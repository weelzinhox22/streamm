import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import ReactPlayer from 'react-player';
import { gsap } from 'gsap';
import { MediaItem } from '../../types';
import Button from './Button';
import screenfull from 'screenfull';

interface VideoPlayerProps {
  item?: MediaItem;
  url?: string;
  title?: string;
  autoPlay?: boolean;
  onBack?: () => void;
  onClose?: () => void;
  episodes?: MediaItem[];
  currentEpisode?: MediaItem;
  onEpisodeSelect?: (episode: MediaItem) => void;
}

const PlayerContainer = styled.div`
  position: relative;
  width: 100%;
  background-color: ${({ theme }) => theme.colors.backgroundDark};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadows.large};
  display: flex;
  flex-direction: column;
`;

const PlayerWrapper = styled.div`
  position: relative;
  padding-top: 56.25%; /* Player ratio: 16:9 (9/16 = 0.5625) */
  height: 0;
  overflow: hidden;
`;

const PlayerInner = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;

const PlayerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.md};
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0));
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  transition: opacity 0.3s ease;
`;

const PlayerTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 1.25rem;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.7);
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: 1rem;
  }
`;

const PlayerControls = styled.div<{ visible: boolean }>`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: ${({ theme }) => theme.spacing.md};
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0));
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: ${({ visible }) => (visible ? 1 : 0)};
  transition: opacity 0.3s ease;
  z-index: 10;
`;

const ProgressBar = styled.div`
  height: 6px;
  background-color: rgba(255, 255, 255, 0.2);
  width: 100%;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  overflow: hidden;
  margin-top: ${({ theme }) => theme.spacing.md};
  cursor: pointer;
  
  &:hover .progress {
    background-color: ${({ theme }) => theme.colors.primary};
    opacity: 0.8;
  }
`;

const Progress = styled.div<{ width: number }>`
  height: 100%;
  background-color: ${({ theme }) => theme.colors.primary};
  width: ${({ width }) => `${width}%`};
  transition: width 0.1s linear, background-color 0.2s ease;
`;

const LoadProgress = styled.div<{ width: number }>`
  height: 100%;
  background-color: rgba(255, 255, 255, 0.3);
  width: ${({ width }) => `${width}%`};
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
`;

const ButtonsGroup = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const ButtonGroupLeft = styled.div`
  display: flex;
  align-items: center;
`;

const ButtonGroupRight = styled.div`
  display: flex;
  align-items: center;
`;

const TimeDisplay = styled.div`
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.875rem;
  margin: 0 ${({ theme }) => theme.spacing.md};
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.7);
`;

const ControlButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  &:active {
    background-color: rgba(255, 255, 255, 0.2);
  }
`;

const ErrorMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.xl};
  color: ${({ theme }) => theme.colors.text};
  text-align: center;
  height: 300px;
  
  h3 {
    color: ${({ theme }) => theme.colors.error};
    margin-bottom: ${({ theme }) => theme.spacing.md};
  }
  
  p {
    margin-bottom: ${({ theme }) => theme.spacing.lg};
  }
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 5;
`;

const LoadingSpinner = styled.div`
  width: 60px;
  height: 60px;
  border: 5px solid rgba(255, 255, 255, 0.2);
  border-top-color: ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

// Novo estilo para o container de episódios
const EpisodesSection = styled.div`
  margin-top: 20px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const EpisodesTitle = styled.h3`
  font-size: 1.5rem;
  margin: 20px 0;
  color: ${({ theme }) => theme.colors.text};
  text-align: center;
`;

const EpisodesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0 auto;
  max-width: 800px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 0 10px;
  }
`;

const EpisodeItem = styled.div<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  padding: 15px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background-color: ${({ isActive, theme }) => 
    isActive ? `${theme.colors.primary}22` : theme.colors.backgroundLight};
  cursor: pointer;
  transition: background-color 0.2s ease;
  border: 1px solid ${({ isActive, theme }) => 
    isActive ? theme.colors.primary : theme.colors.border};
  
  &:hover {
    background-color: ${({ isActive, theme }) => 
      isActive ? `${theme.colors.primary}33` : `${theme.colors.backgroundLight}aa`};
  }
`;

const EpisodeNumber = styled.div`
  font-weight: bold;
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.primary};
  min-width: 50px;
`;

const EpisodeInfo = styled.div`
  flex: 1;
`;

const EpisodeTitle = styled.div`
  font-weight: bold;
  margin-bottom: 5px;
  font-size: 1rem;
`;

const EpisodeDescription = styled.div`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const PlayButton = styled.div`
  margin-left: 10px;
  font-size: 1.5rem;
`;

// Botões de navegação de episódios
const NavigationButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
  margin: 15px 0;
`;

const NavigationButton = styled.button`
  background-color: ${({ theme }) => theme.colors.backgroundLight};
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.primary};
  padding: 8px 15px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: bold;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.backgroundLight};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Check if we're on Netlify
const isNetlify = window.location.hostname.includes('netlify.app') || 
                  !window.location.hostname.includes('localhost');

// Function to get proxy URL when needed
const getProxyUrl = (url: string): string => {
  if (isNetlify && url) {
    try {
      const parsedUrl = new URL(url);
      return `/api/proxy/${parsedUrl.hostname}${parsedUrl.pathname}${parsedUrl.search}`;
    } catch (error) {
      console.error('Invalid URL for proxy:', url);
    }
  }
  return url;
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  item, 
  url, 
  title, 
  autoPlay = true, 
  onBack, 
  onClose,
  episodes = [],
  currentEpisode,
  onEpisodeSelect
}) => {
  const [playing, setPlaying] = useState(autoPlay);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [played, setPlayed] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const [duration, setDuration] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isLiveStream, setIsLiveStream] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  
  const playerRef = useRef<ReactPlayer>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerWrapperRef = useRef<HTMLDivElement>(null);
  const controlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Encontrar índice do episódio atual
  const currentEpisodeIndex = currentEpisode 
    ? episodes.findIndex(ep => ep.id === currentEpisode.id)
    : -1;
    
  // Determinar episódio anterior e próximo
  const prevEpisode = currentEpisodeIndex > 0 ? episodes[currentEpisodeIndex - 1] : null;
  const nextEpisode = currentEpisodeIndex < episodes.length - 1 ? episodes[currentEpisodeIndex + 1] : null;

  // Function to navigate to previous episode
  const goToPrevEpisode = () => {
    if (prevEpisode && onEpisodeSelect) {
      onEpisodeSelect(prevEpisode);
    }
  };

  // Function to navigate to next episode
  const goToNextEpisode = () => {
    if (nextEpisode && onEpisodeSelect) {
      onEpisodeSelect(nextEpisode);
    }
  };

  // Auto-play next episode when current one ends
  const handleEnded = () => {
    if (nextEpisode && onEpisodeSelect) {
      onEpisodeSelect(nextEpisode);
    }
  };
  
  // Process video URL when item changes
  useEffect(() => {
    const sourceUrl = url || (item?.url || '');
    const itemName = title || (item?.name || 'Vídeo');
    const isTV = item?.type === 'channel';
    
    console.log('Preparando para reproduzir:', itemName);
    console.log('URL original:', sourceUrl);
    console.log('Tipo de conteúdo:', item?.type);
    
    setIsLiveStream(isTV);
    
    // Check if URL seems valid
    if (!sourceUrl || sourceUrl.trim() === '') {
      setError('URL de vídeo não encontrada');
      setLoading(false);
      return;
    }
    
    // Try to apply proxy only if on Netlify and needed
    try {
      // Check if it's a direct MP4 or HLS stream
      const isDirectMP4 = sourceUrl.toLowerCase().endsWith('.mp4');
      const isHLS = sourceUrl.toLowerCase().includes('.m3u8');
      
      console.log('É um link direto MP4?', isDirectMP4);
      console.log('É uma transmissão HLS?', isHLS);
      
      // Live TV streams usually use HLS (.m3u8)
      if (isTV) {
        console.log('Configurando para TV ao vivo');
        setVideoUrl(sourceUrl);
      } else if (isDirectMP4) {
        console.log('Configurando para reprodução direta de MP4');
        // For direct MP4 URLs, use original URL without proxy
        setVideoUrl(sourceUrl);
      } else if (isNetlify) {
        // For other URL types, apply proxy when on Netlify
        const proxyUrl = getProxyUrl(sourceUrl);
        console.log('Aplicando proxy para URL no Netlify:', proxyUrl);
        setVideoUrl(proxyUrl);
      } else {
        // Using original URL for local testing
        setVideoUrl(sourceUrl);
      }
      
      setError(null);
      setLoading(true);
    } catch (e) {
      console.error('Erro ao processar URL do vídeo:', e);
      setError('Erro ao processar URL do vídeo');
      setLoading(false);
    }
  }, [item, url, title]);
  
  // Handle controls visibility
  useEffect(() => {
    const showControls = () => {
      setControlsVisible(true);
      
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
      }
      
      controlsTimeout.current = setTimeout(() => {
        if (playing) {
          setControlsVisible(false);
        }
      }, 3000);
    };
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', showControls);
      container.addEventListener('mouseenter', showControls);
      container.addEventListener('mouseleave', () => {
        if (playing) {
          setControlsVisible(false);
        }
      });
      container.addEventListener('click', () => {
        setControlsVisible(true);
        if (controlsTimeout.current) {
          clearTimeout(controlsTimeout.current);
        }
        controlsTimeout.current = setTimeout(() => {
          if (playing) {
            setControlsVisible(false);
          }
        }, 3000);
      });
    }
    
    return () => {
      if (container) {
        container.removeEventListener('mousemove', showControls);
        container.removeEventListener('mouseenter', showControls);
        container.removeEventListener('mouseleave', () => {
          if (playing) {
            setControlsVisible(false);
          }
        });
      }
      
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
      }
    };
  }, [playing]);
  
  // Format time display
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return hours > 0
      ? `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${secs < 10 ? '0' : ''}${secs}`
      : `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Handle player ready
  const handleReady = () => {
    setLoading(false);
    
    // Animate the player
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" }
      );
    }
  };
  
  // Handle player error
  const handleError = (err: any) => {
    console.error('Erro do player:', err);
    
    // For live TV, try opening in external player
    if (isLiveStream) {
      const sourceUrl = url || (item?.url || '');
      
      try {
        // Try to create an iframe element to play the stream
        console.log('Tentando reproduzir stream com player alternativo via iframe...');
        
        if (containerRef.current) {
          // Clear container and add iframe
          while (containerRef.current.firstChild) {
            containerRef.current.removeChild(containerRef.current.firstChild);
          }
          
          const iframe = document.createElement('iframe');
          iframe.src = sourceUrl;
          iframe.width = '100%';
          iframe.height = '500px';
          iframe.style.border = 'none';
          iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
          iframe.allowFullscreen = true;
          
          containerRef.current.appendChild(iframe);
          setLoading(false);
          return;
        }
      } catch (fallbackError) {
        console.error('Erro ao aplicar método alternativo para TV:', fallbackError);
      }
      
      // If iframe fails, offer link to open in new tab
      setError('Não foi possível reproduzir o canal de TV ao vivo no player integrado. Tente abrir em uma nova aba ou use um player externo.');
      setLoading(false);
      return;
    }
    
    // If direct link, try another playback approach
    if (videoUrl.toLowerCase().endsWith('.mp4')) {
      try {
        // For direct MP4, try with normal video tag
        console.log('Tentando reproduzir MP4 com método alternativo...');
        
        // Create a native video element directly
        const videoElement = document.createElement('video');
        videoElement.src = videoUrl;
        videoElement.controls = true;
        videoElement.autoplay = true;
        videoElement.style.width = '100%';
        videoElement.style.height = 'auto';
        
        // Clear container and add video
        if (containerRef.current) {
          // Remove any existing child element
          while (containerRef.current.firstChild) {
            containerRef.current.removeChild(containerRef.current.firstChild);
          }
          
          // Add native player
          containerRef.current.appendChild(videoElement);
          
          // Mark as loaded
          setLoading(false);
          return;
        }
      } catch (fallbackError) {
        console.error('Erro ao aplicar método alternativo:', fallbackError);
      }
    }
    
    // Try with proxy if on Netlify and not already tried
    if (isNetlify && videoUrl === (url || '')) {
      try {
        console.log('Tentando com proxy...');
        const proxyUrl = getProxyUrl(url || '');
        if (proxyUrl !== videoUrl) {
          console.log('Usando URL com proxy:', proxyUrl);
          setVideoUrl(proxyUrl);
          return; // Return to try with new URL
        }
      } catch (proxyError) {
        console.error('Erro ao aplicar proxy:', proxyError);
      }
    }
    
    setError('Erro ao carregar vídeo. O formato pode não ser suportado ou a fonte pode estar indisponível.');
    setLoading(false);
  };
  
  // Handle play/pause toggle
  const togglePlay = () => {
    setPlaying(!playing);
  };
  
  // Handle volume change
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (newVolume === 0) {
      setMuted(true);
    } else {
      setMuted(false);
    }
  };
  
  // Handle mute toggle
  const toggleMute = () => {
    setMuted(!muted);
  };
  
  // Handle seeking
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    
    if (playerRef.current) {
      playerRef.current.seekTo(pos);
    }
  };
  
  // Handle progress update
  const handleProgress = (state: { played: number; loaded: number }) => {
    setPlayed(state.played);
    setLoaded(state.loaded);
  };
  
  // Handle duration change
  const handleDuration = (duration: number) => {
    setDuration(duration);
  };
  
  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (screenfull.isEnabled && playerWrapperRef.current) {
      screenfull.toggle(playerWrapperRef.current);
      setFullscreen(!fullscreen);
    }
  };
  
  // Update fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (screenfull.isEnabled) {
        setFullscreen(screenfull.isFullscreen);
      }
    };
    
    if (screenfull.isEnabled) {
      screenfull.on('change', handleFullscreenChange);
    }
    
    return () => {
      if (screenfull.isEnabled) {
        screenfull.off('change', handleFullscreenChange);
      }
    };
  }, []);
  
  // Handle episode selection
  const handleEpisodeClick = (episode: MediaItem) => {
    if (onEpisodeSelect) {
      onEpisodeSelect(episode);
    }
  };
  
  // Esta função vai garantir que o player seja visível ao abrir
  useEffect(() => {
    // Quando o componente montar, dar um tempo e então fazer scroll para ele
    const timer = setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (error) {
    return (
      <PlayerContainer>
        <ErrorMessage>
          <h3>Não foi possível reproduzir o vídeo</h3>
          <p>{error}</p>
          {isLiveStream && url && (
            <Button 
              onClick={() => window.open(url, '_blank')}
              variant="primary"
              style={{ marginBottom: '10px' }}
            >
              Abrir em Player Externo
            </Button>
          )}
          <Button onClick={onBack || onClose} icon="←">
            Voltar
          </Button>
        </ErrorMessage>
      </PlayerContainer>
    );
  }
  
  const hasEpisodes = episodes && episodes.length > 0;
  
  return (
    <>
      <PlayerContainer ref={containerRef}>
        <PlayerWrapper ref={playerWrapperRef}>
          <PlayerHeader style={{ opacity: controlsVisible ? 1 : 0 }}>
            <PlayerTitle>{title || (item?.name || 'Reproduzindo')}</PlayerTitle>
            <Button 
              variant="text" 
              size="small" 
              onClick={onBack || onClose} 
              icon="✕"
            >
              Fechar
            </Button>
          </PlayerHeader>
          
          <PlayerInner>
            <ReactPlayer
              ref={playerRef}
              url={videoUrl}
              width="100%"
              height="100%"
              playing={playing}
              volume={volume}
              muted={muted}
              onReady={handleReady}
              onError={handleError}
              onProgress={handleProgress}
              onDuration={handleDuration}
              onEnded={handleEnded}
              controls={false}
              config={{
                file: {
                  forceVideo: true,
                  attributes: {
                    crossOrigin: 'anonymous',
                    controlsList: 'nodownload',
                    preload: 'auto'
                  },
                  hlsOptions: {
                    enableWorker: true,
                    lowLatencyMode: true,
                    debug: false,
                    maxLoadingDelay: 4,
                    minAutoBitrate: 0
                  },
                  forceHLS: false,
                  forceDASH: false
                }
              }}
            />
          </PlayerInner>
          
          <PlayerControls visible={controlsVisible}>
            <ButtonsGroup>
              <ButtonGroupLeft>
                <ControlButton onClick={togglePlay} aria-label={playing ? 'Pausar' : 'Reproduzir'}>
                  {playing ? '⏸️' : '▶️'}
                </ControlButton>
                
                <ControlButton onClick={toggleMute} aria-label={muted ? 'Ativar som' : 'Silenciar'}>
                  {muted ? '🔇' : '🔊'}
                </ControlButton>
                
                <TimeDisplay>
                  {formatTime(played * duration)} / {formatTime(duration)}
                </TimeDisplay>
              </ButtonGroupLeft>
              
              <ButtonGroupRight>
                <ControlButton onClick={toggleFullscreen} aria-label={fullscreen ? 'Sair da tela cheia' : 'Tela cheia'}>
                  {fullscreen ? '⊿' : '⊿'}
                </ControlButton>
              </ButtonGroupRight>
            </ButtonsGroup>
            
            <ProgressBar onClick={handleSeek}>
              <LoadProgress width={loaded * 100} />
              <Progress className="progress" width={played * 100} />
            </ProgressBar>
          </PlayerControls>
          
          {loading && (
            <LoadingOverlay>
              <LoadingSpinner />
            </LoadingOverlay>
          )}
        </PlayerWrapper>
      </PlayerContainer>
      
      {/* Lista de episódios para séries */}
      {hasEpisodes && currentEpisode && (
        <EpisodesSection>
          <EpisodesTitle>Episódios</EpisodesTitle>
          
          {/* Botões de navegação */}
          {hasEpisodes && (
            <NavigationButtons>
              <NavigationButton 
                onClick={goToPrevEpisode} 
                disabled={!prevEpisode}
              >
                ◀ Episódio Anterior
              </NavigationButton>
              <NavigationButton 
                onClick={goToNextEpisode} 
                disabled={!nextEpisode}
              >
                Próximo Episódio ▶
              </NavigationButton>
            </NavigationButtons>
          )}
          
          <EpisodesList>
            {episodes.map((episode) => (
              <EpisodeItem 
                key={episode.id} 
                isActive={currentEpisode.id === episode.id}
                onClick={() => handleEpisodeClick(episode)}
              >
                <EpisodeNumber>
                  {episode.season && episode.episode ? `E${episode.episode}` : ''}
                </EpisodeNumber>
                <EpisodeInfo>
                  <EpisodeTitle>{episode.name}</EpisodeTitle>
                  <EpisodeDescription>
                    {episode.description?.slice(0, 100)}{episode.description && episode.description.length > 100 ? '...' : ''}
                  </EpisodeDescription>
                </EpisodeInfo>
                <PlayButton>▶️</PlayButton>
              </EpisodeItem>
            ))}
          </EpisodesList>
        </EpisodesSection>
      )}
    </>
  );
};

export default VideoPlayer; 