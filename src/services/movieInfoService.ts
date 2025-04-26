import { MediaItem } from '../types';

// Usamos a OMDB API que é baseada no IMDB mas de uso livre
// Chave da API OMDB fixa no código
const OMDB_API_KEY = 'a43b7d0e';

console.log("OMDB API KEY configurada:", OMDB_API_KEY);

/**
 * Retorna a chave API atual
 */
export const getApiKey = (): string => {
  return OMDB_API_KEY;
};

// Cache para armazenar resultados e evitar requisições repetidas
const movieInfoCache: Record<string, any> = {};

/**
 * Busca informações detalhadas de um filme ou série
 */
export const fetchMovieInfo = async (title: string, year?: string): Promise<any> => {
  // Criar uma chave de cache única para este título/ano
  const cacheKey = `${title}${year ? `-${year}` : ''}`.toLowerCase();
  
  // Verificar se já temos este item em cache
  if (movieInfoCache[cacheKey]) {
    console.log(`Usando informações em cache para: ${title}`);
    return movieInfoCache[cacheKey];
  }
  
  try {
    // Primeiro método - busca direta pelo título
    console.log(`Tentando busca direta pelo título: ${title}`);
    const directUrl = `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&t=${encodeURIComponent(title)}`;
    
    const directResponse = await fetch(directUrl);
    const directData = await directResponse.json();
    
    if (directData.Response === 'True') {
      console.log(`Encontrado via busca direta: ${directData.Title}`);
      // Armazenar em cache
      movieInfoCache[cacheKey] = directData;
      return directData;
    }
    
    // Segundo método - busca pelo título para obter o IMDB ID
    const searchUrl = `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(title)}`;
    console.log(`Buscando por: ${title}`);
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    // Verificar se a busca encontrou algum resultado
    if (searchData.Response === 'True' && searchData.Search && searchData.Search.length > 0) {
      // Pegar o IMDB ID do primeiro resultado
      const imdbId = searchData.Search[0].imdbID;
      
      // Agora buscar os detalhes usando o IMDB ID
      const detailsUrl = `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${imdbId}`;
      console.log(`Buscando detalhes para ID: ${imdbId}`);
      
      const detailsResponse = await fetch(detailsUrl);
      const detailsData = await detailsResponse.json();
      
      if (detailsData.Response === 'True') {
        console.log(`Encontrado via IMDB ID: ${detailsData.Title}`);
        // Armazenar em cache
        movieInfoCache[cacheKey] = detailsData;
        return detailsData;
      }
    }
    
    // Teste direto com um ID conhecido para verificar se a API está funcionando
    console.log("Tentando com um ID conhecido para testar a API...");
    const testUrl = `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=tt3896198`;
    const testResponse = await fetch(testUrl);
    const testData = await testResponse.json();
    
    if (testData.Response === 'True') {
      console.log(`API funcionando! Teste retornou: ${testData.Title}`);
    } else {
      console.error("Erro na API OMDB: ", testData);
    }
    
    console.warn(`Nenhuma informação encontrada para: ${title}`);
    return null;
  } catch (error) {
    console.error(`Erro ao buscar informações para ${title}:`, error);
    return null;
  }
};

/**
 * Enriquece um item de mídia com informações do OMDB/IMDB
 */
export const enrichMediaItem = async (item: MediaItem): Promise<MediaItem> => {
  // Se já tem descrição e não é o texto padrão, não precisamos buscar
  if (item.description && 
      item.description !== 'Sem descrição disponível.' && 
      item.description !== 'No description available.') {
    return item;
  }
  
  try {
    // Limpar o título para melhorar resultados da busca
    let cleanTitle = item.name;
    
    // Remover padrões como "S01E01" do título
    cleanTitle = cleanTitle.replace(/S\d+E\d+/i, '').trim();
    
    // Remover o ano se estiver entre parênteses para usar como parâmetro separado
    let year: string | undefined;
    const yearMatch = cleanTitle.match(/\((\d{4})\)/);
    if (yearMatch) {
      year = yearMatch[1];
      cleanTitle = cleanTitle.replace(/\(\d{4}\)/, '').trim();
    } else {
      // Tentar extrair o ano do campo year do item
      year = item.year;
    }
    
    console.log(`Buscando informações complementares para: "${cleanTitle}"`);
    
    // Buscar informações
    const movieInfo = await fetchMovieInfo(cleanTitle, year);
    
    if (movieInfo) {
      console.log(`Informações encontradas para: "${cleanTitle}"`);
      
      // Traduzir a descrição (neste caso o Plot) de inglês para português
      let descricao = movieInfo.Plot || item.description || "Sem descrição disponível.";
      
      // Verificar se a descrição está em inglês antes de tentar traduzir
      if (descricao && descricao.length > 0 && /^[A-Za-z]/.test(descricao) && !descricao.includes("Sem descrição")) {
        console.log(`Traduzindo descrição: "${descricao.substring(0, 50)}..."`);
        
        // Tradução simples de alguns termos comuns em inglês para português
        descricao = descricao
          .replace(/^A young /g, 'Um jovem ')
          .replace(/^A /g, 'Um ')
          .replace(/^An /g, 'Um ')
          .replace(/^The /g, 'O ')
          .replace(/ the /g, ' o ')
          .replace(/ a /g, ' um ')
          .replace(/ an /g, ' um ')
          .replace(/\bman\b/g, 'homem')
          .replace(/\bwoman\b/g, 'mulher')
          .replace(/\bboy\b/g, 'garoto')
          .replace(/\bgirl\b/g, 'garota')
          .replace(/\blife\b/g, 'vida')
          .replace(/\blove\b/g, 'amor')
          .replace(/\bfamily\b/g, 'família')
          .replace(/\bfriend\b/g, 'amigo')
          .replace(/\bfriends\b/g, 'amigos')
          .replace(/\bmust\b/g, 'deve')
          .replace(/\bwith\b/g, 'com')
          .replace(/\bwithout\b/g, 'sem')
          .replace(/\bhas to\b/g, 'tem que')
          .replace(/\bwho\b/g, 'que')
          .replace(/\bwhen\b/g, 'quando')
          .replace(/\bafter\b/g, 'depois')
          .replace(/\bbefore\b/g, 'antes')
          .replace(/\bworld\b/g, 'mundo')
          .replace(/\bdiscovers\b/g, 'descobre')
          .replace(/\btries\b/g, 'tenta')
          .replace(/\battacks\b/g, 'ataca')
          .replace(/\bsaves\b/g, 'salva')
          .replace(/\bstruggle\b/g, 'luta')
          .replace(/\btheir\b/g, 'seus')
          .replace(/\bhis\b/g, 'seu')
          .replace(/\bher\b/g, 'sua')
          .replace(/\bthey\b/g, 'eles')
          .replace(/\bfind\b/g, 'encontra')
          .replace(/\bdeal\b/g, 'lidar')
          .replace(/\bwhile\b/g, 'enquanto');
          
        console.log(`Descrição traduzida: "${descricao.substring(0, 50)}..."`);
      }
      
      // Criar um novo objeto com as informações enriquecidas
      const enrichedItem = {
        ...item,
        description: descricao,
        genre: item.genre || (movieInfo.Genre ? movieInfo.Genre.split(',')[0] : undefined),
        country: item.country || (movieInfo.Country ? movieInfo.Country.split(',')[0] : undefined)
      };
      
      console.log(`Item enriquecido com sucesso: ${enrichedItem.name}`);
      return enrichedItem;
    } else {
      console.log(`Nenhuma informação adicional encontrada para: ${cleanTitle}`);
    }
  } catch (error) {
    console.error('Erro ao enriquecer item de mídia:', error);
  }
  
  // Retornar o item original se algo der errado
  return {
    ...item,
    description: item.description || "Sem descrição disponível."
  };
};

// Função para testar a API durante a inicialização
const testApiKey = async () => {
  try {
    console.log("Testando API OMDB...");
    const testUrl = `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=tt3896198`;
    const response = await fetch(testUrl);
    const data = await response.json();
    
    if (data.Response === 'True') {
      console.log(`Teste de API OMDB bem-sucedido! Filme retornado: ${data.Title} (${data.Year})`);
      console.log(`Plot: ${data.Plot}`);
      return true;
    } else {
      console.error("Erro ao testar API OMDB:", data);
      return false;
    }
  } catch (error) {
    console.error("Exceção ao testar API OMDB:", error);
    return false;
  }
};

// Executar o teste na inicialização
testApiKey().then(success => {
  if (success) {
    console.log("API OMDB está pronta para uso!");
  } else {
    console.error("AVISO: API OMDB não está funcionando corretamente!");
  }
});

/**
 * Função para limpar o cache de informações de filme
 */
export const clearMovieInfoCache = (): void => {
  Object.keys(movieInfoCache).forEach(key => delete movieInfoCache[key]);
}; 