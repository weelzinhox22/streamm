import axios from 'axios';
import { MediaItem, Category, Genre, FeaturedContent } from '../types';
import { localM3UContent, hasLocalPlaylist, loadLocalPlaylistFromFile } from '../data/localPlaylist';
import { preloadM3UCache } from './m3uCache';

// URL principal da lista M3U
const MAIN_M3U_URL = 'https://is.gd/angeexx';
// Adicionando suporte para arquivo local direto
const LOCAL_M3U_FILE = '../../lista-iptv.m3u';

// Verificar se estamos rodando no Netlify
const isNetlify = window.location.hostname.includes('netlify.app') || 
                 !window.location.hostname.includes('localhost');

// Função para obter a URL com proxy se necessário
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getProxyUrl = (url: string): string => {
  if (isNetlify) {
    // Converter para URL relativa para usar o proxy do Netlify
    const parsedUrl = new URL(url);
    return `/api/proxy/${parsedUrl.hostname}${parsedUrl.pathname}${parsedUrl.search}`;
  }
  return url;
};

// Função para buscar a lista M3U
export const fetchM3UPlaylist = async (): Promise<string> => {
  // Primeiro tentamos carregar do arquivo local na raiz do projeto
  try {
    console.log('Tentando carregar a playlist do arquivo local na raiz do projeto');
    const localFile = '../../lista-iptv.m3u';
    const response = await fetch(localFile);
    if (response.ok) {
      const localContent = await response.text();
      if (localContent && localContent.includes('#EXTM3U')) {
        console.log('Playlist local carregada com sucesso do arquivo na raiz');
        return localContent;
      }
    }
  } catch (error) {
    console.error('Erro ao carregar do arquivo local na raiz:', error);
  }
  
  // Segundo, tentamos carregar do arquivo local
  try {
    console.log('Tentando carregar a playlist do arquivo local');
    const localContent = await loadLocalPlaylistFromFile();
    if (localContent && localContent.includes('#EXTM3U')) {
      console.log('Playlist local carregada com sucesso do arquivo');
      return localContent;
    }
  } catch (error) {
    console.error('Erro ao carregar do arquivo local:', error);
  }
  
  // Se falhar, verificamos se temos uma playlist local em memória
  if (hasLocalPlaylist()) {
    console.log('Usando playlist local em memória');
    return Promise.resolve(localM3UContent);
  }
  
  // Se não tiver playlist local, tentamos buscar remotamente
  try {
    console.log('Tentando carregar a lista M3U remota:', MAIN_M3U_URL);
    const response = await axios.get(MAIN_M3U_URL, {
      headers: {
        'Accept': '*/*',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      timeout: 15000
    });
    
    // Verificar se a resposta é texto e não HTML
    const contentType = response.headers['content-type'] || '';
    if (contentType.includes('html') && !response.data.includes('#EXTM3U')) {
      console.error('A resposta não parece ser uma lista M3U válida:', contentType);
      throw new Error('Formato de resposta inválido');
    }
    
    console.log('Lista M3U carregada com sucesso. Tamanho:', response.data.length);
    return response.data;
  } catch (error) {
    console.error('Erro ao carregar a lista M3U:', error);
    
    // Tentar obter a URL real para onde is.gd redireciona
    try {
      console.log('Tentando descobrir para onde o link is.gd redireciona...');
      const redirectResponse = await axios.get(MAIN_M3U_URL, {
        maxRedirects: 0,
        validateStatus: status => status >= 200 && status < 400
      });
      
      if (redirectResponse.headers.location) {
        const realUrl = redirectResponse.headers.location;
        console.log('URL real encontrada:', realUrl);
        
        // Tentar carregar da URL real
        try {
          const directResponse = await axios.get(realUrl, { timeout: 15000 });
          console.log('Lista carregada diretamente da URL real');
          return directResponse.data;
        } catch (directError) {
          console.error('Erro ao carregar da URL real:', directError);
        }
      }
    } catch (redirectError) {
      console.error('Erro ao tentar encontrar redirecionamento:', redirectError);
    }
    
    throw new Error('Não foi possível carregar a lista M3U');
  }
};

// Function to parse the M3U playlist
export const parseM3UPlaylist = (content: string): MediaItem[] => {
  const lines = content.split(/\r?\n/);
  const items: MediaItem[] = [];
  let currentItem: Partial<MediaItem> | null = null;
  let skipCurrentItem = false;

  console.log(`Analisando lista M3U com ${lines.length} linhas`);
  let entryCount = 0;
  let validUrlCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('#EXTINF:')) {
      entryCount++;
      skipCurrentItem = false;
      // Extract metadata from the EXTINF line
      currentItem = {};
      
      // Generate unique ID
      currentItem.id = `media-${items.length + 1}`;
      
      // Extract TVG information
      const tvgIdMatch = line.match(/tvg-id="([^"]*)"/);
      currentItem.tvgId = tvgIdMatch ? tvgIdMatch[1] : undefined;
      
      const tvgNameMatch = line.match(/tvg-name="([^"]*)"/);
      currentItem.tvgName = tvgNameMatch ? tvgNameMatch[1] : undefined;
      
      const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/);
      currentItem.tvgLogo = tvgLogoMatch ? tvgLogoMatch[1] : undefined;
      currentItem.logo = currentItem.tvgLogo;
      currentItem.poster = currentItem.tvgLogo;
      
      // Extract group information - RESPEITE O FORMATO ORIGINAL
      const groupMatch = line.match(/group-title="([^"]*)"/);
      const group = groupMatch ? groupMatch[1] : 'Unknown';
      
      // FILTRAR CANAIS - Pular este item se o group-title começar com "Canais"
      if (group.toLowerCase().startsWith('canais') || group.toLowerCase() === 'canais') {
        skipCurrentItem = true;
        skippedCount++;
        currentItem = null;
        continue;
      }
      
      currentItem.group = group;
      
      // Extract name from the line
      const nameMatch = line.match(/,(.*)$/);
      if (nameMatch && nameMatch[1]) {
        currentItem.name = nameMatch[1].trim();
      } else {
        currentItem.name = `Unknown ${items.length + 1}`;
      }
      
      // Check for series pattern (S01E01) in the name
      const seriesPattern = /S(\d+)E(\d+)/i;
      const isSeriesEpisode = seriesPattern.test(currentItem.name);
      
      // Determine content type based on group and title
      // Regras aprimoradas para detecção do tipo de conteúdo
      const groupLower = group.toLowerCase();
      
      if (groupLower.includes('filme') || 
          groupLower.includes('movie') || 
          groupLower.includes('filmes')) {
        currentItem.type = 'movie';
      } else if (
        isSeriesEpisode || 
        groupLower.includes('série') || 
        groupLower.includes('serie') || 
        groupLower.includes('series')
      ) {
        currentItem.type = 'series';
      } else if (
        groupLower.includes('canal') ||
        groupLower.includes('canais') ||
        groupLower.includes('channel') ||
        groupLower.includes('tv ')
      ) {
        currentItem.type = 'channel';
      } else {
        // Para grupos desconhecidos, tenta inferir pelo nome
        if (isSeriesEpisode) {
          currentItem.type = 'series';
        } else if (currentItem.name.match(/\(\d{4}\)/)) {
          // Assume que é um filme se tem ano entre parênteses
          currentItem.type = 'movie';
        } else {
          // Assume canal se não tem outras características distintas
          currentItem.type = 'channel';
        }
      }
      
      // Extract genre if available from the original group
      let genre = '';
      
      // Extrair o gênero da categoria original, preservando subcategorias
      if (groupLower.includes('|')) {
        // Exemplo: "Filmes | Ação" - queremos extrair "Ação"
        const parts = group.split('|');
        if (parts.length > 1) {
          genre = parts[1].trim();
        }
      } else if (groupLower.includes('-')) {
        // Exemplo: "Filmes - Ação" - queremos extrair "Ação"
        const parts = group.split('-');
        if (parts.length > 1) {
          genre = parts[1].trim();
        }
      } else if (groupLower.includes(':')) {
        // Exemplo: "Filmes: Ação" - queremos extrair "Ação"
        const parts = group.split(':');
        if (parts.length > 1) {
          genre = parts[1].trim();
        }
      }
      
      // Se não conseguiu extrair do grupo, tenta extrair do nome
      if (!genre) {
        const genreMatch = currentItem.name.match(/\[(.*?)\]/);
        if (genreMatch && genreMatch[1]) {
          genre = genreMatch[1];
          // Clean the name by removing the genre brackets
          currentItem.name = currentItem.name.replace(/\[.*?\]/, '').trim();
        }
      }
      
      // Categorias comuns
      if (!genre) {
        if (currentItem.type === 'movie') {
          // Para filmes
          if (groupLower.includes('ação') || groupLower.includes('action')) {
            genre = 'Ação';
          } else if (groupLower.includes('comédia') || groupLower.includes('comedy')) {
            genre = 'Comédia';
          } else if (groupLower.includes('drama')) {
            genre = 'Drama';
          } else if (groupLower.includes('terror') || groupLower.includes('horror')) {
            genre = 'Terror';
          } else if (groupLower.includes('ficção') || groupLower.includes('sci-fi')) {
            genre = 'Ficção Científica';
          } else if (groupLower.includes('netflix')) {
            genre = 'Netflix';
          } else if (groupLower.includes('disney')) {
            genre = 'Disney+';
          } else if (groupLower.includes('prime') || groupLower.includes('amazon')) {
            genre = 'Prime Video';
          } else if (groupLower.includes('hbo')) {
            genre = 'HBO';
          } else {
            // Se ainda não tem gênero, usar o grupo original completo
            genre = group;
          }
        } else if (currentItem.type === 'series') {
          // Para séries
          if (groupLower.includes('netflix')) {
            genre = 'Netflix';
          } else if (groupLower.includes('disney')) {
            genre = 'Disney+';
          } else if (groupLower.includes('prime') || groupLower.includes('amazon')) {
            genre = 'Prime Video';
          } else if (groupLower.includes('hbo')) {
            genre = 'HBO';
          } else if (groupLower.includes('discovery')) {
            genre = 'Discovery';
          } else if (groupLower.includes('apple')) {
            genre = 'Apple TV+';
          } else if (groupLower.includes('ação') || groupLower.includes('action')) {
            genre = 'Ação';
          } else if (groupLower.includes('comédia') || groupLower.includes('comedy')) {
            genre = 'Comédia';
          } else if (groupLower.includes('drama')) {
            genre = 'Drama';
          } else {
            // Se ainda não tem gênero, usar o grupo original completo
            genre = group;
          }
        } else if (currentItem.type === 'channel') {
          // Para canais
          if (groupLower.includes('aberto') || groupLower.includes('tv aberta')) {
            genre = 'Abertos';
          } else if (groupLower.includes('sport') || groupLower.includes('esporte')) {
            genre = 'Esportes';
          } else if (groupLower.includes('documentário') || groupLower.includes('documentary')) {
            genre = 'Documentários';
          } else if (groupLower.includes('notícia') || groupLower.includes('news')) {
            genre = 'Notícias';
          } else if (groupLower.includes('premium') || groupLower.includes('hbo')) {
            genre = 'Filmes e Séries';
          } else if (groupLower.includes('infantil') || groupLower.includes('kids')) {
            genre = 'Infantil';
          } else {
            // Se ainda não tem gênero, usar o grupo original completo
            genre = group;
          }
        }
      }
      
      // Atribuir o gênero encontrado
      currentItem.genre = genre || 'Sem Categoria';
      console.log(`Item: ${currentItem.name}, Grupo: ${group}, Gênero: ${currentItem.genre}`);
      
      // Extract year if available
      const yearMatch = currentItem.name.match(/\((\d{4})\)/);
      if (yearMatch && yearMatch[1]) {
        currentItem.year = yearMatch[1];
        // Clean the name by removing the year parentheses
        currentItem.name = currentItem.name.replace(/\(\d{4}\)/, '').trim();
      }
      
      // For series, extract season and episode
      if (currentItem.type === 'series') {
        const seasonEpisodeMatch = currentItem.name.match(seriesPattern);
        if (seasonEpisodeMatch) {
          currentItem.season = seasonEpisodeMatch[1].padStart(2, '0');
          currentItem.episode = seasonEpisodeMatch[2].padStart(2, '0');
          
          // Extract series name (everything before SxxExx pattern)
          const seriesNameMatch = currentItem.name.split(seriesPattern)[0];
          if (seriesNameMatch) {
            // Store original full name as description for episodes
            currentItem.description = currentItem.name;
            // Set clean series name
            currentItem.name = seriesNameMatch.trim();
          }
        }
      }
      
      // Set as new for demonstration purposes (in a real app, this could be based on date added)
      currentItem.isNew = Math.random() > 0.8; // 20% chance of being new
      currentItem.isFeatured = Math.random() > 0.9; // 10% chance of being featured
    } else if (line.length > 0 && !line.startsWith('#') && currentItem && !skipCurrentItem) {
      // This line should be the URL
      currentItem.url = line;
      validUrlCount++;
      
      // Processar a URL para garantir que funcione no Netlify se necessário
      if (isNetlify && currentItem.url) {
        // Algumas URLs podem precisar de proxy
        if (currentItem.url.startsWith('http')) {
          // Não usamos proxy para todos os URLs para evitar sobrecarga,
          // mas podemos habilitá-lo para URLs específicas se necessário
          // currentItem.url = getProxyUrl(currentItem.url);
        }
      }
      
      // Add the completed item to our list
      items.push(currentItem as MediaItem);
      currentItem = null;
    }
  }

  console.log(`Encontradas ${entryCount} entradas na lista M3U, ${validUrlCount} com URLs válidas, ${skippedCount} ignoradas (Canais)`);
  console.log(`Itens processados: ${items.length}`);
  
  return items;
};

// Function to organize media items into categories
export const organizeByCategories = (items: MediaItem[]): Category[] => {
  const categoriesMap: Record<string, Category> = {};

  items.forEach(item => {
    // Verificar se o grupo já existe no mapa
    if (!categoriesMap[item.group]) {
      // Determinar o tipo predominante para a categoria baseado no group-title
      let categoryType: 'movie' | 'series' | 'channel' = 'channel';
      
      // Inferir o tipo da categoria pelo nome do grupo
      const groupLower = item.group.toLowerCase();
      if (groupLower.includes('filme') || groupLower.includes('movie')) {
        categoryType = 'movie';
      } else if (groupLower.includes('série') || groupLower.includes('serie') || groupLower.includes('series')) {
        categoryType = 'series';
      } else if (groupLower.includes('canal') || groupLower.includes('canais') || groupLower.includes('channel') || groupLower.includes('tv')) {
        categoryType = 'channel';
      }
      
      // Criar a nova categoria
      categoriesMap[item.group] = {
        id: `category-${Object.keys(categoriesMap).length + 1}`,
        name: item.group,
        type: categoryType, // Usar o tipo determinado acima
        items: []
      };
    }
    
    // Adicionar o item à sua categoria
    categoriesMap[item.group].items.push(item);
  });

  return Object.values(categoriesMap);
};

// Function to organize media items by content type (movies, series, channels)
export const organizeByContentType = (items: MediaItem[]): { 
  movies: MediaItem[];
  series: MediaItem[];
  channels: MediaItem[]; 
} => {
  // Primeiro, vamos categorizar pelo group-title para criar uma associação mais forte
  const categories = organizeByCategories(items);
  
  // Agora vamos organizar por tipo, usando a categorização dos grupos
  const movieItems: MediaItem[] = [];
  const seriesItems: MediaItem[] = [];
  const channelItems: MediaItem[] = [];
  
  categories.forEach(category => {
    if (category.type === 'movie') {
      // Para grupos de filmes, todos os itens são considerados filmes
      category.items.forEach(item => {
        if (item.type !== 'movie') {
          // Sobrescrever o tipo baseado no grupo
          item.type = 'movie';
        }
        movieItems.push(item);
      });
    } else if (category.type === 'series') {
      // Para grupos de séries, todos os itens são considerados séries
      category.items.forEach(item => {
        if (item.type !== 'series') {
          // Sobrescrever o tipo baseado no grupo
          item.type = 'series';
        }
        seriesItems.push(item);
      });
    } else if (category.type === 'channel') {
      // Para grupos de canais, todos os itens são considerados canais
      category.items.forEach(item => {
        if (item.type !== 'channel') {
          // Sobrescrever o tipo baseado no grupo
          item.type = 'channel';
        }
        channelItems.push(item);
      });
    } else {
      // Para grupos ambíguos, usar a clasificação individual
      category.items.forEach(item => {
        if (item.type === 'movie') {
          movieItems.push(item);
        } else if (item.type === 'series') {
          seriesItems.push(item);
        } else {
          channelItems.push(item);
        }
      });
    }
  });
  
  return {
    movies: movieItems,
    series: seriesItems,
    channels: channelItems
  };
};

// Function to organize media items by genre
export const organizeByGenre = (items: MediaItem[]): Genre[] => {
  const genresMap: Record<string, Genre> = {};

  items.forEach(item => {
    if (item.genre) {
      if (!genresMap[item.genre]) {
        genresMap[item.genre] = {
          id: `genre-${Object.keys(genresMap).length + 1}`,
          name: item.genre,
          items: []
        };
      }
      genresMap[item.genre].items.push(item);
    }
  });

  return Object.values(genresMap);
};

// Function to get featured content
export const getFeaturedContent = (items: MediaItem[]): FeaturedContent[] => {
  const featuredItems = items.filter(item => item.isFeatured);
  
  return [
    {
      id: 'featured-new',
      title: 'Novidades',
      items: items.filter(item => item.isNew).slice(0, 10)
    },
    {
      id: 'featured-movies',
      title: 'Filmes em Destaque',
      items: featuredItems.filter(item => item.type === 'movie').slice(0, 10)
    },
    {
      id: 'featured-series',
      title: 'Séries em Destaque',
      items: featuredItems.filter(item => item.type === 'series').slice(0, 10)
    }
  ];
};

// Interface para o retorno da função organizeSeriesContent
interface OrganizedSeriesContent {
  listingItems: MediaItem[];
  allItems: MediaItem[];
}

// Function to organize series into shows with seasons and episodes
export const organizeSeriesContent = (items: MediaItem[]): OrganizedSeriesContent => {
  // Primeiro, pré-processamos todos os itens de séries para identificar séries e episódios
  const seriesMap = new Map<string, MediaItem>();
  const episodeItems: MediaItem[] = [];
  
  // Primeiro, pré-processamos todos os itens de séries para limpar nomes
  const seriesItems = items.filter(item => item.type === 'series').map(item => {
    // Clonar o item para não modificar o original
    const processedItem = { ...item };
    
    // Padrões para detectar temporadas e episódios
    const seriesPattern = /S(\d+)E(\d+)/i;
    const seasonEpisodeMatch = processedItem.name.match(seriesPattern);
    
    if (seasonEpisodeMatch) {
      // Armazenar informações de temporada e episódio
      processedItem.season = seasonEpisodeMatch[1].padStart(2, '0');
      processedItem.episode = seasonEpisodeMatch[2].padStart(2, '0');
      
      // Extrair o nome da série (tudo antes do padrão SxxExx)
      const seriesNameParts = processedItem.name.split(seriesPattern);
      if (seriesNameParts.length > 0) {
        // Armazenar o nome original como descrição para episódios
        processedItem.description = processedItem.description || processedItem.name;
        // Definir o nome limpo da série
        processedItem.name = seriesNameParts[0].trim();
      }
    }
    
    return processedItem;
  });
  
  // Agora organizamos as séries em grupos
  seriesItems.forEach(item => {
    // Pular itens que já são episódios processados anteriormente
    if (item.parentId) return;
    
    // Se não tem temporada e episódio, tratar como item independente
    if (!item.season || !item.episode) {
      seriesMap.set(item.id, item);
      return;
    }
    
    // Usar nome em minúsculas como chave para consistência
    const seriesKey = item.name.toLowerCase();
    
    // Se ainda não vimos esta série, criar uma entrada
    if (!seriesMap.has(seriesKey)) {
      // Criar um item pai para a série
      const seriesId = `series-${seriesKey.replace(/[^a-z0-9]/gi, '-')}`;
      const seriesItem: MediaItem = {
        id: seriesId,
        name: item.name,
        url: '', // Séries pai não têm URL direta
        group: item.group,
        type: 'series',
        genre: item.genre,
        logo: item.logo,
        description: `Coletânea de episódios de ${item.name}`,
        isNew: item.isNew,
        isFeatured: item.isFeatured,
        tvgId: item.tvgId,
        tvgName: item.tvgName,
        tvgLogo: item.tvgLogo
      };
      
      seriesMap.set(seriesKey, seriesItem);
    }
    
    // Adicionar este episódio à lista de episódios com referência ao pai
    const seriesId = seriesMap.get(seriesKey)!.id;
    const episodeItem: MediaItem = {
      ...item,
      id: `${seriesId}-s${item.season}e${item.episode}`,
      parentId: seriesId,
      name: item.name, // Manter o nome da série para o episódio
      description: `${item.name} - Temporada ${parseInt(item.season)} Episódio ${parseInt(item.episode)}` + 
                   (item.description ? ` - ${item.description}` : '')
    };
    
    episodeItems.push(episodeItem);
  });
  
  // Converter o mapa de séries para array
  const seriesParentItems = Array.from(seriesMap.values());
  
  // Filtrar itens de séries para busca e listagens (excluindo episódios)
  // Para buscas e listagens, queremos apenas itens não-episódios e itens de série-pai
  const itemsForListingsAndSearch = items.filter(item => {
    // Manter todos os itens que não são séries
    if (item.type !== 'series') return true;
    
    // Para séries, verificar se é um episódio que já processamos
    if (item.season && item.episode) {
      // Verificar se já temos um item pai para esta série
      const seriesName = item.name.split(/S\d+E\d+/i)[0].trim().toLowerCase();
      
      // Se já temos um item pai, não incluir este episódio na listagem/busca
      return !seriesMap.has(seriesName);
    }
    
    // Manter qualquer outro item de série (que não é episódio)
    return true;
  });
  
  // Adicionar os itens de série-pai (representando coleções de episódios)
  const combinedItems = [...itemsForListingsAndSearch, ...seriesParentItems];
  
  // Para acesso completo, incluindo todos os episódios para a página de detalhes
  // rastreamento interno, etc.
  const allItemsWithEpisodes = [...items, ...seriesParentItems, ...episodeItems];
  
  // Salvar todos os episódios em uma estrutura global para acesso rápido
  episodesBySeriesId.clear();
  episodeItems.forEach(episode => {
    if (episode.parentId) {
      if (!episodesBySeriesId.has(episode.parentId)) {
        episodesBySeriesId.set(episode.parentId, []);
      }
      episodesBySeriesId.get(episode.parentId)?.push(episode);
    }
  });
  
  return {
    // Itens para listagens e busca (sem episódios individuais)
    listingItems: combinedItems,
    // Todos os itens, incluindo episódios, para acesso interno
    allItems: allItemsWithEpisodes
  };
};

// Mapa global para armazenar episódios por série
const episodesBySeriesId = new Map<string, MediaItem[]>();

// Function to get episodes for a specific series
export const getSeriesEpisodes = (items: MediaItem[], seriesId: string): MediaItem[] => {
  // Primeiro, tentar buscar do cache
  if (episodesBySeriesId.has(seriesId)) {
    return episodesBySeriesId.get(seriesId) || [];
  }
  
  // Se não estiver no cache, buscar do array completo
  return items.filter(item => 
    item.type === 'series' && 
    item.parentId === seriesId &&
    item.season &&
    item.episode
  ).sort((a, b) => {
    // Sort by season, then by episode
    const seasonA = parseInt(a.season || '0');
    const seasonB = parseInt(b.season || '0');
    
    if (seasonA !== seasonB) {
      return seasonA - seasonB;
    }
    
    return parseInt(a.episode || '0') - parseInt(b.episode || '0');
  });
};

// Function to get episodes grouped by season
export const getEpisodesBySeasons = (items: MediaItem[], seriesId: string): Record<string, MediaItem[]> => {
  const episodes = getSeriesEpisodes(items, seriesId);
  const seasons: Record<string, MediaItem[]> = {};
  
  episodes.forEach(episode => {
    if (!episode.season) return;
    
    const seasonKey = `Season ${parseInt(episode.season)}`;
    if (!seasons[seasonKey]) {
      seasons[seasonKey] = [];
    }
    
    seasons[seasonKey].push(episode);
  });
  
  return seasons;
};

// Main function to load and process the M3U playlist
export const loadM3UData = async () => {
  try {
    // Tentar usar o cache pré-carregado primeiro
    try {
      console.log('Tentando carregar dados do cache M3U...');
      const cachedItems = await preloadM3UCache();
      
      if (cachedItems && cachedItems.length > 0) {
        console.log(`Cache M3U carregado com sucesso: ${cachedItems.length} itens`);
        
        // Organize series content
        const organizedContent = organizeSeriesContent(cachedItems);
        
        // Use the listing items for display
        const processedItems = organizedContent.listingItems;
        
        // Organize by content type
        const contentByType = organizeByContentType(processedItems);
        
        // Organize by category
        const categories = organizeByCategories(processedItems);
        
        // Organize by genre
        const genres = organizeByGenre(processedItems);
        
        // Get featured content
        const featured = getFeaturedContent(processedItems);
        
        return {
          items: processedItems,
          // Manter todos os itens incluindo episódios para acesso interno
          allItems: organizedContent.allItems,
          rawItems: cachedItems, // Original items before series organization
          contentByType,
          categories,
          genres,
          featured
        };
      }
    } catch (cacheError) {
      console.warn('Erro ao carregar do cache:', cacheError);
    }
    
    // Se o cache falhar, carrega normalmente
    console.log('Carregando dados M3U tradicionalmente...');
    
    // Fetch the playlist
    const content = await fetchM3UPlaylist();
    
    // Parse the playlist
    const rawItems = parseM3UPlaylist(content);
    
    // Organize series content
    const organizedContent = organizeSeriesContent(rawItems);
    
    // Use the listing items for display
    const processedItems = organizedContent.listingItems;
    
    // Organize by content type
    const contentByType = organizeByContentType(processedItems);
    
    // Organize by category
    const categories = organizeByCategories(processedItems);
    
    // Organize by genre
    const genres = organizeByGenre(processedItems);
    
    // Get featured content
    const featured = getFeaturedContent(processedItems);
    
    return {
      items: processedItems,
      // Manter todos os itens incluindo episódios para acesso interno
      allItems: organizedContent.allItems,
      rawItems, // Original items before series organization
      contentByType,
      categories,
      genres,
      featured
    };
  } catch (error) {
    console.error('Error loading M3U data:', error);
    throw error;
  }
}; 