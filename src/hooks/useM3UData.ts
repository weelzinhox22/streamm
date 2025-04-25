import { useEffect, useState, useCallback } from 'react';
import { loadM3UData, organizeSeriesContent, parseM3UPlaylist, fetchM3UPlaylist } from '../services/m3uService';
import { MediaItem, Category, Genre, FeaturedContent, AppState } from '../types';

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
  
  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
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
      } catch (error) {
        console.error('Error fetching data:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error : new Error('Erro desconhecido ao carregar dados')
        }));
      }
    };

    fetchData();
  }, [organizeContentByGenre]);

  // Search functionality
  const setSearchTerm = useCallback(async (term: string) => {
    setState(prev => ({ ...prev, searchTerm: term }));
    
    if (!term.trim()) {
      setState(prev => ({ ...prev, searchResults: [] }));
      return;
    }
    
    try {
      // Simple search through items
      const lowerTerm = term.toLowerCase();
      const results = state.allItems.filter(item => 
        (item.name && item.name.toLowerCase().includes(lowerTerm)) ||
        (item.tvgName && item.tvgName.toLowerCase().includes(lowerTerm)) ||
        (item.genre && item.genre.toLowerCase().includes(lowerTerm)) ||
        (item.group && item.group.toLowerCase().includes(lowerTerm))
      );
      setState(prev => ({ ...prev, searchResults: results }));
    } catch (error) {
      console.error('Error searching items:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Erro ao pesquisar')
      }));
    }
  }, [state.allItems]);
  
  // Filter items based on search term
  useEffect(() => {
    if (!state.searchTerm.trim()) {
      setFilteredItems(state.items);
      return;
    }
    
    const lowerSearchTerm = state.searchTerm.toLowerCase();
    const filtered = state.items.filter(item => 
      (item.name && item.name.toLowerCase().includes(lowerSearchTerm)) ||
      (item.tvgName && item.tvgName.toLowerCase().includes(lowerSearchTerm)) ||
      (item.genre && item.genre.toLowerCase().includes(lowerSearchTerm)) ||
      (item.group && item.group.toLowerCase().includes(lowerSearchTerm))
    );
    
    console.log(`Pesquisa por "${state.searchTerm}" encontrou ${filtered.length} itens`);
    setFilteredItems(filtered);
  }, [state.searchTerm, state.items]);
  
  return {
    ...state,
    setSearchTerm,
    filteredItems,
    
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