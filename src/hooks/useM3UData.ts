import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { loadM3UData, organizeSeriesContent, parseM3UPlaylist, fetchM3UPlaylist } from '../services/m3uService';
import { MediaItem, Category, Genre, FeaturedContent, AppState } from '../types';
import debounce from 'lodash/debounce';

// Utility function to create a search index
const createSearchIndex = (items: MediaItem[]) => {
  const index: Record<string, Set<string>> = {};
  
  items.forEach(item => {
    const id = item.id;
    
    // Index item name words
    if (item.name) {
      const words = item.name.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length >= 2) {
          if (!index[word]) {
            index[word] = new Set();
          }
          index[word].add(id);
        }
      });
    }
    
    // Index other relevant fields
    const fieldsToIndex = [
      item.tvgName,
      item.genre,
      item.group
    ];
    
    fieldsToIndex.forEach(field => {
      if (field) {
        const words = field.toLowerCase().split(/\s+/);
        words.forEach(word => {
          if (word.length >= 2) {
            if (!index[word]) {
              index[word] = new Set();
            }
            index[word].add(id);
          }
        });
      }
    });
  });
  
  return index;
};

// Search function using the index
const searchWithIndex = (items: MediaItem[], term: string, searchIndex: Record<string, Set<string>>) => {
  if (!term.trim()) return [];
  
  const words = term.toLowerCase().trim().split(/\s+/);
  if (words.length === 0) return [];
  
  // For single-word searches, get direct matches from index
  if (words.length === 1) {
    const word = words[0];
    const matchIds = new Set<string>();
    
    // Look for exact matches in the index
    if (searchIndex[word]) {
      searchIndex[word].forEach(id => matchIds.add(id));
    }
    
    // Look for partial matches in the index
    Object.entries(searchIndex).forEach(([indexWord, ids]) => {
      if (indexWord.includes(word)) {
        ids.forEach(id => matchIds.add(id));
      }
    });
    
    // Return items that match the IDs
    return items.filter(item => matchIds.has(item.id));
  }
  
  // For multi-word searches, find items that match all words
  const matchesByWord = words.map(word => {
    const wordMatches = new Set<string>();
    
    // Check for exact word matches
    if (searchIndex[word]) {
      searchIndex[word].forEach(id => wordMatches.add(id));
    }
    
    // Check for partial matches
    Object.entries(searchIndex).forEach(([indexWord, ids]) => {
      if (indexWord.includes(word)) {
        ids.forEach(id => wordMatches.add(id));
      }
    });
    
    return wordMatches;
  });
  
  // Find intersection of all word matches
  const finalMatches = new Set<string>(matchesByWord[0]);
  for (let i = 1; i < matchesByWord.length; i++) {
    finalMatches.forEach(id => {
      if (!matchesByWord[i].has(id)) {
        finalMatches.delete(id);
      }
    });
  }
  
  return items.filter(item => finalMatches.has(item.id));
};

interface M3UDataState {
  items: MediaItem[];
  allItems: MediaItem[];
  rawItems: MediaItem[];
  categories: Category[];
  contentByType: Record<string, MediaItem[]>;
  genres: Genre[];
  featured: FeaturedContent[];
  loading: boolean;
  error: Error | null;
  searchResults: MediaItem[];
  searchTerm: string;
  contentByGenre: Record<string, Record<string, MediaItem[]>>;
}

const initialState: AppState = {
  items: [],
  allItems: [],
  rawItems: [],
  categories: [],
  contentByType: { movies: [], series: [], channels: [] },
  genres: [],
  featured: [],
  loading: true,
  error: null,
  searchResults: [],
  searchTerm: '',
  contentByGenre: {},
};

export const useM3UData = () => {
  const [state, setState] = useState<AppState>(initialState);
  const [filteredItems, setFilteredItems] = useState<MediaItem[]>([]);
  const [searchIndex, setSearchIndex] = useState<Record<string, Set<string>>>({});
  const [indexReady, setIndexReady] = useState(false);
  const [searchPerformance, setSearchPerformance] = useState({ time: 0, count: 0 });
  
  // Function to organize content by genre
  const organizeContentByGenre = useCallback((items: MediaItem[]): Record<string, Record<string, MediaItem[]>> => {
    console.log("Starting genre organization with", items.length, "items");
    
    // Count how many items have genres
    const itemsWithGenre = items.filter(item => !!item.genre).length;
    console.log(`${itemsWithGenre} out of ${items.length} items have genre data`);
    
    // Inicialize a estrutura vazia para coletar todos os gêneros encontrados
    const byGenre: Record<string, Record<string, MediaItem[]>> = {
      movies: {},
      series: {},
      channels: {}
    };
    
    // Primeiro passo - coletar todos os gêneros encontrados na coleção
    const movieGenres = new Set<string>();
    const seriesGenres = new Set<string>();
    const channelGenres = new Set<string>();
    
    items.forEach(item => {
      const type = item.type + 's';  // Convert to plural: movie -> movies, series -> series, channel -> channels
      if (type !== 'movies' && type !== 'series' && type !== 'channels') return;
      
      const genre = item.genre || 'Sem Categoria';
      
      // Adicionar gênero ao conjunto correspondente
      if (type === 'movies') {
        movieGenres.add(genre);
      } else if (type === 'series') {
        seriesGenres.add(genre);
      } else if (type === 'channels') {
        channelGenres.add(genre);
      }
    });
    
    // Inicializar arrays para cada gênero
    movieGenres.forEach(genre => {
      byGenre.movies[genre] = [];
    });
    
    seriesGenres.forEach(genre => {
      byGenre.series[genre] = [];
    });
    
    channelGenres.forEach(genre => {
      byGenre.channels[genre] = [];
    });
    
    console.log('Gêneros de Filmes:', Array.from(movieGenres));
    console.log('Gêneros de Séries:', Array.from(seriesGenres));
    console.log('Gêneros de Canais:', Array.from(channelGenres));
    
    // Agora distribua os itens pelos gêneros correspondentes
    items.forEach(item => {
      const type = item.type + 's';  // Convert to plural: movie -> movies, series -> series, channel -> channels
      if (!byGenre[type]) return;  // Skip if not a recognized type
      
      const genre = item.genre || 'Sem Categoria';
      
      if (!byGenre[type][genre]) {
        byGenre[type][genre] = [];
      }
      
      // For series, only add parent items or standalone series
      if (type === 'series') {
        if (!item.parentId || item.parentId === item.id) {
          // Avoid duplicates
          const exists = byGenre[type][genre].some(existing => existing.id === item.id);
          if (!exists) {
            byGenre[type][genre].push(item);
          }
        }
      } else {
        // For movies and channels, add all items
        byGenre[type][genre].push(item);
      }
    });
    
    // Count genres and items in each category
    for (const typeKey in byGenre) {
      console.log(`Type ${typeKey} genres:`);
      for (const genre in byGenre[typeKey]) {
        console.log(`- ${genre}: ${byGenre[typeKey][genre].length} items`);
      }
    }
    
    return byGenre;
  }, []);
  
  // Build search index when items are loaded
  useEffect(() => {
    if (state.allItems.length > 0 && !indexReady) {
      console.log("Building search index for", state.allItems.length, "items");
      const startTime = performance.now();
      
      // Run in a Worker-like pattern to avoid blocking the UI
      setTimeout(() => {
        const index = createSearchIndex(state.allItems);
        setSearchIndex(index);
        setIndexReady(true);
        
        const endTime = performance.now();
        console.log(`Search index built in ${endTime - startTime}ms`);
        console.log(`Index contains ${Object.keys(index).length} unique terms`);
      }, 100);
    }
  }, [state.allItems, indexReady]);
  
  // Fetch all data function
  const fetchData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Get data from M3U service
      const result = await loadM3UData();
      
      // Organize content by genre
      const contentByGenre = organizeContentByGenre(result.allItems);
      
      setState({
        ...result,
        searchResults: [],
        searchTerm: '',
        contentByGenre,
        loading: false,
        error: null
      });
      setFilteredItems(result.items);
      
      // Reset index status to trigger rebuild
      setIndexReady(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('Erro desconhecido ao carregar dados')
      }));
    }
  }, [organizeContentByGenre]);

  // Function to manually refresh data
  const refreshData = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Debounced search function to improve performance
  const debouncedSearch = useRef(
    debounce(async (term: string) => {
      if (!term.trim()) {
        setState(prev => ({ ...prev, searchResults: [] }));
        return;
      }
      
      try {
        const startTime = performance.now();
        let results: MediaItem[] = [];
        
        // Use index-based search if index is ready
        if (indexReady) {
          results = searchWithIndex(state.allItems, term, searchIndex);
        } else {
          // Fallback to traditional search
          const lowerTerm = term.toLowerCase();
          results = state.allItems.filter(item => 
            (item.name && item.name.toLowerCase().includes(lowerTerm)) ||
            (item.tvgName && item.tvgName.toLowerCase().includes(lowerTerm)) ||
            (item.genre && item.genre.toLowerCase().includes(lowerTerm)) ||
            (item.group && item.group.toLowerCase().includes(lowerTerm))
          );
        }
        
        const endTime = performance.now();
        const searchTime = endTime - startTime;
        
        setSearchPerformance({
          time: searchTime,
          count: results.length
        });
        
        console.log(`Pesquisa por "${term}" encontrou ${results.length} itens em ${searchTime.toFixed(2)}ms`);
        
        setState(prev => ({ ...prev, searchResults: results }));
      } catch (error) {
        console.error('Error searching items:', error);
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error : new Error('Erro ao pesquisar')
        }));
      }
    }, 300)
  ).current;

  // Search functionality with improved performance
  const setSearchTerm = useCallback(async (term: string) => {
    setState(prev => ({ ...prev, searchTerm: term }));
    debouncedSearch(term);
  }, [debouncedSearch]);
  
  // Filter items based on search term - using memoization for better performance
  const getFilteredItems = useMemo(() => {
    if (!state.searchTerm.trim()) {
      return state.items;
    }
    
    if (state.searchResults.length > 0) {
      return state.searchResults;
    }
    
    const lowerSearchTerm = state.searchTerm.toLowerCase();
    return state.items.filter(item => 
      (item.name && item.name.toLowerCase().includes(lowerSearchTerm)) ||
      (item.tvgName && item.tvgName.toLowerCase().includes(lowerSearchTerm)) ||
      (item.genre && item.genre.toLowerCase().includes(lowerSearchTerm)) ||
      (item.group && item.group.toLowerCase().includes(lowerSearchTerm))
    );
  }, [state.searchTerm, state.items, state.searchResults]);
  
  // Update filtered items when the memoized value changes
  useEffect(() => {
    setFilteredItems(getFilteredItems);
  }, [getFilteredItems]);
  
  return {
    ...state,
    setSearchTerm,
    filteredItems,
    refreshData,
    searchPerformance,
    
    // Helper function to get pagination
    getPaginatedItems: (items: MediaItem[], page: number, itemsPerPage: number = 30) => {
      const startIndex = (page - 1) * itemsPerPage;
      return items.slice(startIndex, startIndex + itemsPerPage);
    },
    
    // Get total pages for pagination
    getTotalPages: (items: MediaItem[], itemsPerPage: number = 30) => {
      return Math.ceil(items.length / itemsPerPage);
    }
  };
}; 