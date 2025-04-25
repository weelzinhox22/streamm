// Playlist M3U armazenada localmente para evitar problemas de CORS
export const localM3UContent = `#EXTM3U
# Esta é apenas uma amostra. O conteúdo completo será carregado do arquivo lista-iptv.m3u
`;

// Função para verificar se a playlist local existe e tem conteúdo
export const hasLocalPlaylist = (): boolean => {
  return true; // Sempre retorna true pois carregaremos do arquivo local
};

// Nova função para carregar a playlist do arquivo local
export const loadLocalPlaylistFromFile = async (): Promise<string> => {
  try {
    const response = await fetch('/lista-iptv.m3u');
    if (!response.ok) {
      throw new Error(`Failed to load M3U file: ${response.statusText}`);
    }
    const content = await response.text();
    console.log(`M3U file loaded successfully. Size: ${content.length} bytes`);
    return content;
  } catch (error) {
    console.error('Error loading local M3U file:', error);
    return localM3UContent; // Fallback para conteúdo de amostra
  }
}; 