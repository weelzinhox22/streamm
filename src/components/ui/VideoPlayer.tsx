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
  min-height: 300px; /* Altura mínima para o player */
`;

const PlayerWrapper = styled.div`
  position: relative;
  padding-top: 50.25%; /* Player ratio: 16:9 (9/16 = 0.5625) */
  height: 0;
  overflow: hidden;
  min-height: 200px; /* Altura mínima para garantir que o player seja visível */
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
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.7), transparent);
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
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: ${({ visible }) => (visible ? 1 : 0)};
  transition: opacity 0.3s ease;
  z-index: 10;
  padding-bottom: 20px; /* Mais espaço na parte inferior */
`;

const ProgressBar = styled.div`
  height: 8px; /* Barra de progresso mais alta */
  background-color: rgba(255, 255, 255, 0.2);
  width: 100%;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  overflow: hidden;
  margin-top: ${({ theme }) => theme.spacing.md};
  cursor: pointer;
  position: relative;
  
  &:hover .progress {
    background-color: ${({ theme }) => theme.colors.primary};
    opacity: 1;
    height: 10px; /* Aumenta ainda mais ao passar o mouse */
  }
`;

const Progress = styled.div<{ width: number }>`
  height: 100%;
  background-color: ${({ theme }) => theme.colors.primary};
  width: ${({ width }) => `${width}%`};
  transition: width 0.1s linear;
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
  padding: 10px 0; /* Mais espaço vertical */
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
`;

const ControlButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  width: 50px; /* Aumentando a área clicável */
  height: 50px; /* Aumentando a área clicável */
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
  
  svg {
    font-size: 1.5rem;
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
  
  svg {
    font-size: 1rem;
  }
`;

const VolumeContainer = styled.div`
  display: flex;
  align-items: center;
  position: relative;
  width: 30px;
  height: 50px;
  overflow: visible;
  
  &:hover .volume-slider {
    width: 80px;
    opacity: 1;
  }
`;

const VolumeSlider = styled.div`
  position: absolute;
  height: 6px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  width: 0;
  opacity: 0;
  transition: all 0.2s ease;
  margin-left: 35px;
  cursor: pointer;
  overflow: hidden;
  
  &.volume-slider {
    width: 0;
    opacity: 0;
  }
`;

const VolumeProgress = styled.div<{ width: number }>`
  height: 100%;
  background-color: ${({ theme }) => theme.colors.primary};
  width: ${({ width }) => `${width}%`};
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

// Ícones SVG para controles
const PlayIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);

const VolumeUpIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
  </svg>
);

const VolumeMuteIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
  </svg>
);

const ExpandIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
  </svg>
);

const CompressIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
  </svg>
);

const BackwardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" />
  </svg>
);

const ForwardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" />
  </svg>
);

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
  
  // Handle volume slider
  const volumeSliderRef = useRef<HTMLDivElement>(null);
  
  const handleVolumeSliderChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (volumeSliderRef.current) {
      const rect = volumeSliderRef.current.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      const newVolume = Math.max(0, Math.min(1, pos));
      
      handleVolumeChange(newVolume);
    }
  };
  
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
                  {playing ? <PauseIcon /> : <PlayIcon />}
                </ControlButton>
                
                <VolumeContainer>
                  <ControlButton onClick={toggleMute} aria-label={muted ? 'Ativar som' : 'Silenciar'}>
                    {muted ? <VolumeMuteIcon /> : <VolumeUpIcon />}
                  </ControlButton>
                  <VolumeSlider 
                    className="volume-slider" 
                    ref={volumeSliderRef}
                    onClick={handleVolumeSliderChange}
                  >
                    <VolumeProgress width={muted ? 0 : volume * 100} />
                  </VolumeSlider>
                </VolumeContainer>
                
                <TimeDisplay>
                  {formatTime(played * duration)} / {formatTime(duration)}
                </TimeDisplay>
              </ButtonGroupLeft>
              
              <ButtonGroupRight>
                <ControlButton onClick={toggleFullscreen} aria-label={fullscreen ? 'Sair da tela cheia' : 'Tela cheia'}>
                  {fullscreen ? <CompressIcon /> : <ExpandIcon />}
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
                <BackwardIcon /> Episódio Anterior
              </NavigationButton>
              <NavigationButton 
                onClick={goToNextEpisode} 
                disabled={!nextEpisode}
              >
                Próximo Episódio <ForwardIcon />
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
                <PlayButton>
                  <PlayIcon />
                </PlayButton>
              </EpisodeItem>
            ))}
          </EpisodesList>
        </EpisodesSection>
      )}
    </>
  );
};

export default VideoPlayer; 