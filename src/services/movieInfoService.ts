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
        
        // Tradução mais abrangente do inglês para português
        descricao = traduzirParaPortugues(descricao);
        
        console.log(`Descrição traduzida: "${descricao.substring(0, 50)}..."`);
      }
      
      // Criar um novo objeto com as informações enriquecidas
      const enrichedItem = {
        ...item,
        description: descricao,
        genre: item.genre || (movieInfo.Genre ? movieInfo.Genre.split(',')[0] : undefined),
        country: item.country || (movieInfo.Country ? movieInfo.Country.split(',')[0] : undefined),
        year: item.year || movieInfo.Year
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

/**
 * Função para traduzir texto de inglês para português
 */
function traduzirParaPortugues(texto: string): string {
  // Mapeamento expandido de termos inglês -> português
  const traducoes: Record<string, string> = {
    // Artigos e pronomes
    "^The ": "O ",
    "^A ": "Um ",
    "^An ": "Um ",
    "^A young ": "Um jovem ",
    " the ": " o ",
    " a ": " um ",
    " an ": " um ",
    " this ": " este ",
    " these ": " estes ",
    " those ": " aqueles ",
    " his ": " seu ",
    " her ": " sua ",
    " their ": " seus ",
    " they ": " eles ",
    " he ": " ele ",
    " she ": " ela ",
    " it ": " isto ",
    
    // Substantivos comuns
    "\\bman\\b": "homem",
    "\\bmen\\b": "homens",
    "\\bwoman\\b": "mulher",
    "\\bwomen\\b": "mulheres",
    "\\bboy\\b": "garoto",
    "\\bboys\\b": "garotos",
    "\\bgirl\\b": "garota",
    "\\bgirls\\b": "garotas",
    "\\bchild\\b": "criança",
    "\\bchildren\\b": "crianças",
    "\\blife\\b": "vida",
    "\\bwar\\b": "guerra",
    "\\bworld\\b": "mundo",
    "\\bcity\\b": "cidade",
    "\\btown\\b": "cidade",
    "\\bvillage\\b": "vila",
    "\\bfamily\\b": "família",
    "\\bfriend\\b": "amigo",
    "\\bfriends\\b": "amigos",
    "\\blove\\b": "amor",
    "\\benemy\\b": "inimigo",
    "\\benemies\\b": "inimigos",
    "\\bfather\\b": "pai",
    "\\bmother\\b": "mãe",
    "\\bbrother\\b": "irmão",
    "\\bsister\\b": "irmã",
    "\\bhome\\b": "lar",
    "\\bhouse\\b": "casa",
    "\\btime\\b": "tempo",
    "\\byear\\b": "ano",
    "\\byears\\b": "anos",
    "\\bday\\b": "dia",
    "\\bdays\\b": "dias",
    "\\bnight\\b": "noite",
    "\\bmovie\\b": "filme",
    "\\bfilm\\b": "filme",
    "\\bseries\\b": "série",
    
    // Verbos comuns
    "\\bmust\\b": "deve",
    "\\bhas to\\b": "tem que",
    "\\bfind\\b": "encontrar",
    "\\bfinds\\b": "encontra",
    "\\bdiscovers\\b": "descobre",
    "\\btries\\b": "tenta",
    "\\btry\\b": "tentar",
    "\\battacks\\b": "ataca",
    "\\battack\\b": "atacar",
    "\\bsaves\\b": "salva",
    "\\bsave\\b": "salvar",
    "\\bstruggle\\b": "luta",
    "\\bstruggles\\b": "luta",
    "\\bdeal\\b": "lidar",
    "\\bdeals\\b": "lida",
    "\\blive\\b": "viver",
    "\\blives\\b": "vive",
    "\\bdie\\b": "morrer",
    "\\bdies\\b": "morre",
    "\\bfight\\b": "lutar",
    "\\bfights\\b": "luta",
    "\\bmeet\\b": "encontrar",
    "\\bmeets\\b": "encontra",
    "\\bmake\\b": "fazer",
    "\\bmakes\\b": "faz",
    "\\bhelp\\b": "ajudar",
    "\\bhelps\\b": "ajuda",
    "\\breturn\\b": "retornar",
    "\\breturns\\b": "retorna",
    "\\bface\\b": "enfrentar",
    "\\bfaces\\b": "enfrenta",
    "\\bbecome\\b": "tornar-se",
    "\\bbecomes\\b": "torna-se",
    "\\bchange\\b": "mudar",
    "\\bchanges\\b": "muda",
    "\\brealize\\b": "perceber",
    "\\brealizes\\b": "percebe",
    
    // Preposições e conjunções
    "\\bwith\\b": "com",
    "\\bwithout\\b": "sem",
    "\\bfor\\b": "para",
    "\\bfrom\\b": "de",
    "\\bto\\b": "para",
    "\\bin\\b": "em",
    "\\bon\\b": "em",
    "\\bat\\b": "em",
    "\\bof\\b": "de",
    "\\bby\\b": "por",
    "\\babout\\b": "sobre",
    "\\bthrough\\b": "através",
    "\\bduring\\b": "durante",
    "\\bafter\\b": "depois",
    "\\bbefore\\b": "antes",
    "\\bwhen\\b": "quando",
    "\\bwhile\\b": "enquanto",
    "\\bif\\b": "se",
    "\\bbecause\\b": "porque",
    "\\bsince\\b": "desde",
    "\\buntil\\b": "até",
    "\\balthough\\b": "embora",
    "\\bthough\\b": "embora",
    "\\bhowever\\b": "entretanto",
    "\\btherefore\\b": "portanto",
    "\\bconsequently\\b": "consequentemente",
    "\\bmoreover\\b": "além disso",
    "\\badditionally\\b": "adicionalmente"
  };
  
  // Aplicar todas as traduções
  let resultado = texto;
  
  for (const [ingles, portugues] of Object.entries(traducoes)) {
    const regex = new RegExp(ingles, 'g');
    resultado = resultado.replace(regex, portugues);
  }
  
  return resultado;
}

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