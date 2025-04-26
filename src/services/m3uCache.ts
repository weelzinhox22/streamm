import { MediaItem } from '../types';
import { loadLocalPlaylistFromFile } from '../data/localPlaylist';
import { parseM3UPlaylist } from './m3uService';

// Chave para armazenar o cache no localStorage
const CACHE_KEY = 'm3u_cache_v1';
const INDEX_KEY = 'm3u_index_v1';
const TIMESTAMP_KEY = 'm3u_timestamp_v1';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 horas

// Estrutura para guardar os dados indexados
interface MediaIndex {
  byId: Record<string, number>;     // ID -> posição no arquivo
  byName: Record<string, number>;   // Nome -> posição no arquivo
  byPartialName: Record<string, number[]>; // Parte do nome -> array de posições
}

// Cache global em memória
let cachedItems: MediaItem[] | null = null;
let mediaIndex: MediaIndex | null = null;
let fileContent: string | null = null;

/**
 * Carrega o índice do cache se existir, ou cria um novo
 */
const loadIndex = async (): Promise<MediaIndex> => {
  if (mediaIndex) {
    return mediaIndex;
  }

  try {
    // Tentar carregar do localStorage
    const storedIndex = localStorage.getItem(INDEX_KEY);
    const storedTimestamp = localStorage.getItem(TIMESTAMP_KEY);
    
    if (storedIndex && storedTimestamp) {
      const timestamp = parseInt(storedTimestamp, 10);
      const now = Date.now();
      
      // Verificar se o cache ainda é válido
      if (now - timestamp < CACHE_EXPIRY_MS) {
        mediaIndex = JSON.parse(storedIndex) as MediaIndex;
        return mediaIndex;
      }
    }
  } catch (error) {
    console.error('Erro ao carregar índice do cache:', error);
  }
  
  // Se não tiver índice em cache ou expirou, cria um novo
  mediaIndex = await createIndex();
  return mediaIndex;
};

/**
 * Cria um novo índice baseado no conteúdo do arquivo M3U
 */
const createIndex = async (): Promise<MediaIndex> => {
  console.log('Criando índice do arquivo M3U...');
  
  // Inicializa o índice
  const index: MediaIndex = {
    byId: {},
    byName: {},
    byPartialName: {}
  };
  
  // Carrega o conteúdo do arquivo
  if (!fileContent) {
    fileContent = await loadLocalPlaylistFromFile();
  }
  
  // Divide o arquivo em linhas
  const lines = fileContent.split(/\r?\n/);
  let currentIndex = 0;
  
  // Percorre as linhas para criar o índice
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('#EXTINF:')) {
      // Extrair informações do item
      const idMatch = line.match(/tvg-id="([^"]*)"/);
      const nameMatch = line.match(/,(.*)$/);
      
      const id = idMatch && idMatch[1] ? idMatch[1] : `item-${currentIndex}`;
      const name = nameMatch && nameMatch[1] ? nameMatch[1].trim() : `Item ${currentIndex}`;
      
      // Registrar no índice
      index.byId[id] = i;
      index.byName[name.toLowerCase()] = i;
      
      // Criar índice por palavras parciais
      const words = name.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 3) { // Apenas palavras com mais de 3 caracteres
          if (!index.byPartialName[word]) {
            index.byPartialName[word] = [];
          }
          if (!index.byPartialName[word].includes(i)) {
            index.byPartialName[word].push(i);
          }
        }
      });
      
      currentIndex++;
    }
  }
  
  // Salvar o índice no localStorage
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(index));
    localStorage.setItem(TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error('Erro ao salvar índice no cache:', error);
  }
  
  console.log(`Índice criado com ${currentIndex} itens`);
  return index;
};

/**
 * Encontra as linhas relevantes para um item específico
 */
const findItemLines = async (searchTerm: string, type?: string): Promise<{start: number, end: number} | null> => {
  const index = await loadIndex();
  
  // Tentar encontrar pelo ID exato
  if (index.byId[searchTerm]) {
    const start = index.byId[searchTerm];
    return { start, end: findEndOfEntry(start) };
  }
  
  // Tentar encontrar pelo nome exato
  const searchTermLower = searchTerm.toLowerCase();
  if (index.byName[searchTermLower]) {
    const start = index.byName[searchTermLower];
    return { start, end: findEndOfEntry(start) };
  }
  
  // Busca por palavra parcial
  const words = searchTermLower.split(/\s+/);
  for (const word of words) {
    if (word.length > 3 && index.byPartialName[word]) {
      // Pegar o primeiro resultado que encontrar
      const start = index.byPartialName[word][0];
      return { start, end: findEndOfEntry(start) };
    }
  }
  
  return null;
};

/**
 * Encontra o fim de uma entrada no arquivo M3U
 */
const findEndOfEntry = (startLine: number): number => {
  if (!fileContent) {
    return startLine + 2; // Assumindo o padrão de 2 linhas por entrada
  }
  
  const lines = fileContent.split(/\r?\n/);
  
  // Procurar a linha da URL (a primeira linha não vazia após a linha #EXTINF)
  for (let i = startLine + 1; i < Math.min(lines.length, startLine + 5); i++) {
    const line = lines[i].trim();
    if (line && !line.startsWith('#')) {
      return i + 1;
    }
  }
  
  return startLine + 2;
};

/**
 * Busca um item específico pelo ID ou nome sem precisar ler todo o arquivo
 */
export const findItemFromM3U = async (searchId: string, type?: string): Promise<MediaItem | null> => {
  console.log(`Buscando item com ID: "${searchId}"`);
  
  // Tentar obter do cache em memória primeiro
  if (cachedItems) {
    console.log(`Buscando em ${cachedItems.length} itens em cache...`);
    // Primeiro, tentar buscar por ID exato
    let item = cachedItems.find(item => item.id === searchId);
    
    // Se não encontrou pelo ID exato, tenta buscar por ID parcial
    if (!item) {
      item = cachedItems.find(item => item.id.includes(searchId) || searchId.includes(item.id));
    }
    
    // Tentar buscar por nome
    if (!item) {
      item = cachedItems.find(item => 
        item.name.toLowerCase() === searchId.toLowerCase() ||
        item.name.toLowerCase().includes(searchId.toLowerCase())
      );
    }
    
    if (item) {
      console.log(`Item encontrado no cache: ${item.name}`);
      return item;
    }
  }
  
  console.log(`Buscando item "${searchId}" diretamente no arquivo...`);
  
  // Carregar o conteúdo do arquivo se não estiver em memória
  if (!fileContent) {
    fileContent = await loadLocalPlaylistFromFile();
  }
  
  // Encontrar as linhas relevantes
  const itemLines = await findItemLines(searchId, type);
  if (!itemLines) {
    console.log(`Item "${searchId}" não encontrado no índice, tentando método alternativo...`);
    
    // Se falhar a busca indexada, carrega todos os itens e faz uma busca manual
    const content = await loadLocalPlaylistFromFile();
    const allItems = parseM3UPlaylist(content);
    
    // Busca pelo ID ou nome mais próximo
    const foundItem = allItems.find(item => 
      item.id === searchId || 
      item.id.includes(searchId) || 
      searchId.includes(item.id) ||
      item.name.toLowerCase() === searchId.toLowerCase() ||
      item.name.toLowerCase().includes(searchId.toLowerCase())
    );
    
    if (foundItem) {
      console.log(`Item encontrado pelo método alternativo: ${foundItem.name}`);
      return foundItem;
    }
    
    return null;
  }
  
  // Extrair as linhas do conteúdo
  const lines = fileContent.split(/\r?\n/);
  const relevantLines = lines.slice(itemLines.start, itemLines.end).join('\n');
  
  // Parsear apenas as linhas relevantes
  const parsedItems = parseM3UPlaylist(relevantLines);
  
  if (parsedItems.length > 0) {
    console.log(`Item "${searchId}" encontrado através da busca indexada: ${parsedItems[0].name}`);
    return parsedItems[0];
  }
  
  return null;
};

/**
 * Pré-carrega todo o arquivo M3U no cache
 */
export const preloadM3UCache = async (): Promise<MediaItem[]> => {
  // Se já tiver em cache, retorna
  if (cachedItems) {
    return cachedItems;
  }
  
  try {
    // Tentar carregar do localStorage
    const storedCache = localStorage.getItem(CACHE_KEY);
    const storedTimestamp = localStorage.getItem(TIMESTAMP_KEY);
    
    if (storedCache && storedTimestamp) {
      const timestamp = parseInt(storedTimestamp, 10);
      const now = Date.now();
      
      // Verificar se o cache ainda é válido
      if (now - timestamp < CACHE_EXPIRY_MS) {
        cachedItems = JSON.parse(storedCache) as MediaItem[];
        return cachedItems;
      }
    }
  } catch (error) {
    console.error('Erro ao carregar cache do M3U:', error);
  }
  
  // Se não tiver cache ou expirou, carrega o arquivo
  console.log('Carregando e processando arquivo M3U completo...');
  
  if (!fileContent) {
    fileContent = await loadLocalPlaylistFromFile();
  }
  
  // Parseia o arquivo completo
  cachedItems = parseM3UPlaylist(fileContent);
  
  // Salva no localStorage para uso futuro
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cachedItems));
    localStorage.setItem(TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error('Erro ao salvar cache do M3U:', error);
  }
  
  return cachedItems;
};

/**
 * Limpa o cache para forçar recarregamento
 */
export const clearM3UCache = (): void => {
  cachedItems = null;
  mediaIndex = null;
  fileContent = null;
  
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(INDEX_KEY);
    localStorage.removeItem(TIMESTAMP_KEY);
  } catch (error) {
    console.error('Erro ao limpar cache do M3U:', error);
  }
}; 