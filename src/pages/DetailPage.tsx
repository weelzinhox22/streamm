import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import styled from 'styled-components';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import Button from '../components/ui/Button';
import { useM3UData } from '../hooks/useM3UData';
import { MediaItem } from '../types';
import { getSeriesEpisodes, getEpisodesBySeasons } from '../services/m3uService';
import Modal from '../components/ui/Modal';
import MediaRow from '../components/ui/MediaRow';
import { findItemFromM3U } from '../services/m3uCache';
import { enrichMediaItem } from '../services/movieInfoService';

// Componentes estilizados melhorados
const DetailContainer = styled.div`
  padding: ${({ theme }) => `${theme.spacing.xl} 0`};
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 400px;
    background: linear-gradient(to bottom, 
      ${({ theme }) => theme.colors.backgroundDark}00,
      ${({ theme }) => theme.colors.background}
    );
    z-index: 0;
    pointer-events: none;
  }
`;

const ContentWrapper = styled.div`
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing.md};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 0 ${({ theme }) => theme.spacing.sm};
  }
`;

const BackdropImage = styled.div<{ bgUrl?: string }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 70vh;
  background-image: ${({ bgUrl }) => bgUrl ? `url(${bgUrl})` : 'none'};
  background-size: cover;
  background-position: center top;
  opacity: 0.15;
  filter: blur(15px);
  z-index: 0;
  pointer-events: none;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 70%;
    background: linear-gradient(to bottom, 
      ${({ theme }) => theme.colors.background}00,
      ${({ theme }) => theme.colors.background}
    );
  }
`;

const BackButton = styled.button`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  padding: 8px 16px;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    background: rgba(255, 255, 255, 0.1);
    transform: translateX(-3px);
  }
  
  .icon {
    margin-right: ${({ theme }) => theme.spacing.xs};
  }
`;

const MediaContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 350px;
  grid-gap: ${({ theme }) => theme.spacing.xxl};
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: 1fr;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-gap: ${({ theme }) => theme.spacing.md};
    margin-bottom: ${({ theme }) => theme.spacing.lg};
  }
`;

const MediaInfo = styled.div`
  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    order: -1;
    margin-bottom: ${({ theme }) => theme.spacing.lg};
  }
`;

const Title = styled.h1`
  font-size: 3rem;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  background: linear-gradient(to right, 
    ${({ theme }) => theme.colors.primary}, 
    ${({ theme }) => theme.colors.text}
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 700;
  line-height: 1.2;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: 2rem;
    margin-bottom: ${({ theme }) => theme.spacing.sm};
  }
`;

const MetaInfo = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.875rem;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 50px;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  
  .icon {
    margin-right: ${({ theme }) => theme.spacing.xs};
    opacity: 0.8;
  }
`;

const Description = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  line-height: 1.8;
  color: ${({ theme }) => theme.colors.text};
  font-size: 1.05rem;
  
  p {
    margin-bottom: ${({ theme }) => theme.spacing.md};
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: column;
  }
`;

const PlayButton = styled(Button)`
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
  }
  
  &:active {
    transform: translateY(-1px);
  }
`;

const PosterImage = styled.div<{ bgUrl?: string }>`
  width: 100%;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  overflow: hidden;
  background-color: ${({ theme }) => theme.colors.backgroundLight};
  box-shadow: ${({ theme }) => theme.shadows.medium};
  aspect-ratio: 2/3;
  background-image: ${({ bgUrl }) => bgUrl ? `url(${bgUrl})` : 'none'};
  background-size: cover;
  background-position: center;
  position: relative;
  transform: translateY(0);
  transition: transform 0.5s ease, box-shadow 0.5s ease;
  
  &:hover {
    transform: translateY(-10px) scale(1.02);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  }
  
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: ${({ theme }) => theme.borderRadius.lg};
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
    pointer-events: none;
  }
  
  &.placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${({ theme }) => theme.colors.textSecondary};
    font-weight: 500;
    text-align: center;
    padding: ${({ theme }) => theme.spacing.md};
  }
`;

const NotFound = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xxl} 0;
  
  h2 {
    margin-bottom: ${({ theme }) => theme.spacing.lg};
    color: ${({ theme }) => theme.colors.error};
    font-size: 2rem;
  }
  
  p {
    margin-bottom: ${({ theme }) => theme.spacing.xl};
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: 1.1rem;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }
`;

// Fallback image for items without an image
const FALLBACK_IMAGE = 'https://via.placeholder.com/300x450?text=Sem+Imagem';

const SeasonSelector = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`;

const SeasonButton = styled.button<{ active: boolean }>`
  background: ${({ active, theme }) => active ? theme.colors.primary : 'transparent'};
  color: ${({ active, theme }) => active ? theme.colors.text : theme.colors.textSecondary};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border: 1px solid ${({ active, theme }) => active ? theme.colors.primary : theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: 14px;
  margin-right: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background: ${({ active, theme }) => active ? theme.colors.secondary : theme.colors.backgroundLight};
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: 12px;
    padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  }
`;

const SeasonTitle = styled.h3`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  font-size: 1.4rem;
  color: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  
  &::before {
    content: '';
    display: inline-block;
    width: 4px;
    height: 24px;
    background: linear-gradient(to bottom, ${({ theme }) => theme.colors.primary}, ${({ theme }) => theme.colors.maxPurple});
    margin-right: ${({ theme }) => theme.spacing.sm};
    border-radius: 2px;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: 1.2rem;
    margin-bottom: ${({ theme }) => theme.spacing.sm};
    padding-left: ${({ theme }) => theme.spacing.sm};
  }
`;

const EpisodesList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing.sm};
  }
`;

const EpisodeCard = styled.div`
  background-color: rgba(30, 30, 40, 0.4);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: ${({ theme }) => theme.borderRadius.md};
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.05);
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: ${({ theme }) => theme.shadows.medium};
    border-color: rgba(255, 255, 255, 0.1);
  }
`;

const EpisodeImage = styled.div<{ bgUrl?: string }>`
  width: 100%;
  height: 158px;
  background-color: ${({ theme }) => theme.colors.backgroundDark};
  background-image: ${({ bgUrl }) => bgUrl ? `url(${bgUrl})` : 'none'};
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, 
      transparent 50%,
      rgba(0, 0, 0, 0.7) 100%
    );
    z-index: 1;
    opacity: 0.7;
    transition: opacity 0.3s ease;
  }
  
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: ${({ theme }) => theme.colors.primary};
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 0;
  }
  
  .play-icon {
    position: relative;
    z-index: 2;
    opacity: 0.7;
    transition: all 0.3s ease;
    transform: scale(1);
  }
  
  ${EpisodeCard}:hover & {
    &::after {
      opacity: 0.2;
    }
    
    .play-icon {
      opacity: 1;
      transform: scale(1.1);
    }
  }
`;

const EpisodeInfo = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
`;

const EpisodeTitle = styled.h4`
  font-size: 1rem;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  transition: color 0.3s ease;
  
  ${EpisodeCard}:hover & {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const EpisodeNumber = styled.div`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  display: flex;
  align-items: center;
  
  &::before {
    content: '';
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: ${({ theme }) => theme.colors.primary};
    margin-right: ${({ theme }) => theme.spacing.xs};
  }
`;

const SeasonsContainer = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xxl};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    margin-top: ${({ theme }) => theme.spacing.lg};
  }
`;

const SectionTitle = styled.h2`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  font-size: 1.5rem;
  color: ${({ theme }) => theme.colors.text};
  position: relative;
  padding-bottom: ${({ theme }) => theme.spacing.sm};
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 60px;
    height: 3px;
    background: linear-gradient(to right, ${({ theme }) => theme.colors.primary}, ${({ theme }) => theme.colors.maxPurple});
    border-radius: 3px;
  }
`;

const SeasonSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  animation: fadeIn 0.5s ease forwards;
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const EpisodeItem = styled.div`
  background-color: rgba(30, 30, 40, 0.4);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: ${({ theme }) => theme.borderRadius.md};
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.05);
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: ${({ theme }) => theme.shadows.medium};
    border-color: rgba(255, 255, 255, 0.1);
  }
`;

// Componentes de carregamento modernos
const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(10, 10, 15, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
`;

const LoadingSpinner = styled.div`
  width: 80px;
  height: 80px;
  position: relative;
  margin-bottom: 30px;
  
  &::before, &::after {
    content: '';
    position: absolute;
    border-radius: 50%;
    border: 4px solid transparent;
    border-top-color: ${({ theme }) => theme.colors.primary};
    border-bottom-color: ${({ theme }) => theme.colors.maxPurple};
    animation: spin 1.5s linear infinite;
  }
  
  &::before {
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
  }
  
  &::after {
    width: 60%;
    height: 60%;
    top: 20%;
    left: 20%;
    border-top-color: ${({ theme }) => theme.colors.maxPurple};
    border-bottom-color: ${({ theme }) => theme.colors.primary};
    animation: spin 1s linear infinite reverse;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.div`
  color: ${({ theme }) => theme.colors.text};
  font-size: 18px;
  text-align: center;
  margin-bottom: 20px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .dots {
    overflow: hidden;
    display: inline-flex;
    margin-left: 4px;
    
    &::after {
      content: '...';
      animation: dots 1.4s steps(4, end) infinite;
      width: 0;
    }
    
    @keyframes dots {
      0%, 20% { width: 0; }
      40% { width: 3px; }
      60% { width: 6px; }
      80%, 100% { width: 9px; }
    }
  }
`;

const LoadingBar = styled.div`
  width: 300px;
  max-width: 80%;
  height: 4px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  margin-bottom: 10px;
  
  .fill {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 0%;
    background: linear-gradient(
      to right,
      ${({ theme }) => theme.colors.primary},
      ${({ theme }) => theme.colors.maxPurple}
    );
    border-radius: 4px;
    transition: width 0.5s ease-out;
  }
`;

const LoadingPercent = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: right;
  width: 300px;
  max-width: 80%;
`;

// O componente de loading que inclui animação
const Loading: React.FC<{
  message?: string;
  progress?: number;
}> = ({ message = "Carregando...", progress = 0 }) => {
  const [percent, setPercent] = useState(progress);
  const fillRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Animar a barra
    if (fillRef.current) {
      gsap.to(fillRef.current, {
        width: `${progress}%`,
        duration: 0.5,
        ease: "power1.out"
      });
    }
    
    setPercent(progress);
  }, [progress]);
  
  return (
    <LoadingOverlay>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <LoadingSpinner />
        <LoadingText>
          {message}<span className="dots"></span>
        </LoadingText>
        <LoadingBar>
          <div className="fill" ref={fillRef} />
        </LoadingBar>
        <LoadingPercent>{percent}%</LoadingPercent>
      </div>
    </LoadingOverlay>
  );
};

// Componente de loading específico para carregamento de player
const PlayerLoading: React.FC<{
  onComplete: () => void;
  messages?: string[];
}> = ({ onComplete, messages = [
  'Preparando sua mídia',
  'Conectando ao servidor',
  'Carregando dados',
  'Finalizando'
] }) => {
  const [currentMessage, setCurrentMessage] = useState(messages[0]);
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    let step = 0;
    const messageCount = messages.length;
    const increment = 100 / messageCount;
    
    const interval = setInterval(() => {
      if (step < messageCount) {
        setCurrentMessage(messages[step]);
        setProgress(Math.min(100, (step + 1) * increment));
        step++;
      } else {
        clearInterval(interval);
        onComplete();
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [messages, onComplete]);
  
  return <Loading message={currentMessage} progress={progress} />;
};

// Componente de descrição com skeleton loading
const DescriptionSkeleton = styled.div`
  width: 100%;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  
  .line {
    height: 16px;
    margin-bottom: 12px;
    border-radius: 4px;
    background: linear-gradient(
      to right,
      rgba(255, 255, 255, 0.05) 0%,
      rgba(255, 255, 255, 0.15) 50%,
      rgba(255, 255, 255, 0.05) 100%
    );
    background-size: 200% 100%;
    animation: shimmer 2s infinite linear;
    
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    
    &:nth-child(1) { width: 100%; }
    &:nth-child(2) { width: 95%; }
    &:nth-child(3) { width: 98%; }
    &:nth-child(4) { width: 85%; }
  }
`;

// Componente SkeletonDescription sem referência a ref
const SkeletonDescription: React.FC = () => {
  // Use useEffect para animar diretamente aqui
  useEffect(() => {
    const lines = document.querySelectorAll('.skeleton-line');
    
    lines.forEach((line, i) => {
      gsap.to(line, {
        opacity: gsap.utils.random(0.5, 1),
        duration: 1,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: i * 0.1
      });
    });
  }, []);
  
  return (
    <DescriptionSkeleton>
      <div className="line skeleton-line"></div>
      <div className="line skeleton-line"></div>
      <div className="line skeleton-line"></div>
      <div className="line skeleton-line"></div>
    </DescriptionSkeleton>
  );
};

// Versão adaptada do findItemFromM3U que retorna undefined em vez de null
const findItemCompatible = async (searchId: string): Promise<MediaItem | undefined> => {
  try {
    const result = await findItemFromM3U(searchId);
    return result || undefined;
  } catch (error) {
    console.error("Erro ao buscar item:", error);
    return undefined;
  }
};

// Lazy load heavy components
const VideoPlayer = lazy(() => import('../components/ui/VideoPlayer'));
const RelatedContent = lazy(() => import('../components/RelatedContent'));

const DetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { allItems, categories } = useM3UData();
  const [item, setItem] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [episodes, setEpisodes] = useState<MediaItem[]>([]);
  const [seasonEpisodes, setSeasonEpisodes] = useState<{ [key: string]: MediaItem[] }>({});
  const [currentSeason, setCurrentSeason] = useState<string | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<MediaItem | null>(null);
  const [relatedItems, setRelatedItems] = useState<MediaItem[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [loadingDescription, setLoadingDescription] = useState(false);
  
  useEffect(() => {
    if (!id) return;
    
    const findItem = async () => {
      setLoading(true);
      try {
        console.log("Procurando item com ID:", id);
        
        // Método 1: Tenta encontrar diretamente na lista allItems
        let foundItem = allItems.find(item => 
          item.id === id || 
          item.id.includes(id) || 
          id.includes(item.id) ||
          item.name.toLowerCase() === id.toLowerCase() ||
          item.name.toLowerCase().includes(id.toLowerCase())
        );
        
        if (foundItem) {
          console.log("Item encontrado na lista allItems:", foundItem.name);
        } else {
          // Método 2: Tenta buscar via findItemCompatible
          console.log("Tentando buscar via findItemFromM3U");
          foundItem = await findItemCompatible(id);
        }
        
        if (foundItem) {
          console.log("Item encontrado:", foundItem);
          setItem(foundItem);
          
          // Garantir que foundItem está definido para o TypeScript
          const item = foundItem; // Esta atribuição ajuda o TypeScript a inferir o tipo
          
          // Se é uma série, busca episódios
          if (item.type === 'series') {
            const allEpisodes = getSeriesEpisodes(allItems, item.seriesId || item.id);
            setEpisodes(allEpisodes);
            
            // Agrupar episódios por temporada
            const episodesBySeason = getEpisodesBySeasons(allEpisodes, item.seriesId || item.id);
            setSeasonEpisodes(episodesBySeason);
            
            // Definir temporada atual (primeira temporada ou S01)
            const seasons = Object.keys(episodesBySeason);
            setCurrentSeason(seasons.length > 0 ? seasons[0] : null);
          }
          
          // Obter itens relacionados (itens na mesma categoria)
          const category = item.category || '';
          let categoryItems = allItems.filter(i => 
            i.category === category && 
            i.id !== item.id
          );
          
          // Se não encontrar itens relacionados pela categoria, tenta pelo tipo
          if (categoryItems.length === 0) {
            categoryItems = allItems.filter(i => 
              i.type === item.type && 
              i.id !== item.id
            ).slice(0, 10);
          }
          
          setRelatedItems(categoryItems);
        } else {
          console.error('Item não encontrado:', id);
        }
      } catch (error) {
        console.error('Erro ao buscar o item:', error);
      } finally {
        setLoading(false);
      }
    };
    
    findItem();
  }, [id, allItems]);
  
  useEffect(() => {
    if (item) {
      console.log('Item carregado:', item);
      console.log('Imagem do item:', item.poster || item.logo || item.tvgLogo || 'Sem imagem');
      
      // Buscar informações adicionais se não houver descrição
      if (!item.description || 
          item.description === 'Sem descrição disponível.' ||
          item.description === 'No description available.') {
        const fetchDescription = async () => {
          try {
            setLoadingDescription(true);
            const enrichedItem = await enrichMediaItem(item);
            if (enrichedItem.description !== item.description) {
              console.log('Descrição encontrada:', enrichedItem.description);
              setItem(enrichedItem);
            }
            setLoadingDescription(false);
          } catch (error) {
            console.error('Erro ao buscar descrição:', error);
            setLoadingDescription(false);
          }
        };
        
        fetchDescription();
      }
    }
  }, [item]);
  
  // Go back handler with animation
  const goBack = () => {
    if (containerRef.current) {
      gsap.to(containerRef.current, {
        opacity: 0, 
        y: 30, 
        duration: 0.5, 
        ease: "power3.in",
        onComplete: () => {
          navigate(-1);
        }
      });
    } else {
      navigate(-1);
    }
  };
  
  const handleImageError = () => {
    if (item) {
      setItem({
        ...item,
        poster: FALLBACK_IMAGE
      });
    }
  };
  
  // Check if the media is a movie or series
  const isMovie = item?.type === 'movie';
  const isSeries = item?.type === 'series';
  
  // Get available seasons from episodes
  const seasons = Object.keys(seasonEpisodes).sort();
  
  // Get current season episodes
  const currentSeasonEpisodes = currentSeason ? seasonEpisodes[currentSeason] || [] : [];
  
  // Handler functions for media playback
  const handlePlay = (episode?: MediaItem) => {
    if (episode || item) {
      setSelectedEpisode(episode || (item as MediaItem));
      setPlayerLoading(true);
    }
  };
  
  const handlePlayerClose = () => {
    setShowVideoPlayer(false);
    setSelectedEpisode(null);
  };
  
  const handleEpisodeSelect = (episode: MediaItem) => {
    if (episode) {
      setSelectedEpisode(episode);
      setPlayerLoading(true);
    }
  };

  const handleSeasonChange = (season: string) => {
    setCurrentSeason(season);
    
    // Animate the season change
    const seasonElement = document.getElementById(`season-${season}`);
    if (seasonElement) {
      gsap.fromTo(
        seasonElement,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
      );
    }
  };
  
  const handlePlayerLoadingComplete = () => {
    setPlayerLoading(false);
    setShowVideoPlayer(true);
  };
  
  if (loading) {
    return <Loading message="Carregando conteúdo" progress={50} />;
  }
  
  if (!item) {
    return (
      <NotFound>
        <h2>Mídia não encontrada</h2>
        <p>O item que você está procurando não foi encontrado na nossa base de dados.</p>
        <Button onClick={goBack}>Voltar para a página anterior</Button>
      </NotFound>
    );
  }
  
  return (
    <DetailContainer ref={containerRef}>
      <BackdropImage bgUrl={item.poster || item.logo || item.tvgLogo || FALLBACK_IMAGE} />
      
      <ContentWrapper>
        <BackButton onClick={goBack}>
          <span className="icon">←</span> Voltar
        </BackButton>
        
        {/* Botão para limpar cache - útil para depuração */}
        <BackButton 
          onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}
          style={{ marginLeft: '10px' }}
        >
          <span className="icon">🔄</span> Recarregar dados
        </BackButton>
        
        <MediaContent>
          <MediaInfo>
            <Title>{item.name}</Title>
            
            <MetaInfo>
              {item.year && (
                <MetaItem>
                  <span className="icon">📅</span> {item.year}
                </MetaItem>
              )}
              {item.category && (
                <MetaItem>
                  <span className="icon">🏷️</span> {item.category}
                </MetaItem>
              )}
              {item.type && (
                <MetaItem>
                  <span className="icon">{item.type === 'movie' ? '🎬' : '📺'}</span> 
                  {item.type === 'movie' ? 'Filme' : 'Série'}
                </MetaItem>
              )}
              {item.country && (
                <MetaItem>
                  <span className="icon">🌍</span> {item.country}
                </MetaItem>
              )}
            </MetaInfo>
            
            {loadingDescription ? (
              <SkeletonDescription />
            ) : (
              <Description>
                <p>{item.description || 'Sem descrição disponível.'}</p>
              </Description>
            )}
            
            <ActionButtons>
              {isMovie && (
                <PlayButton 
                  variant="primary" 
                  onClick={() => handlePlay()}
                  iconPosition="left"
                  icon="▶️"
                >
                  Assistir Agora
                </PlayButton>
              )}
              
              {isSeries && seasons.length > 0 && (
                <PlayButton 
                  variant="primary" 
                  onClick={() => {
                    // Play first episode of current season
                    if (currentSeasonEpisodes.length > 0) {
                      handlePlay(currentSeasonEpisodes[0]);
                    }
                  }}
                  iconPosition="left"
                  icon="▶️"
                >
                  Assistir Agora
                </PlayButton>
              )}
            </ActionButtons>
            
            {isSeries && seasons.length > 0 && (
              <SeasonsContainer>
                <SectionTitle>Temporadas</SectionTitle>
                
                <SeasonSelector>
                  {seasons.map(season => (
                    <SeasonButton
                      key={season}
                      active={season === currentSeason}
                      onClick={() => handleSeasonChange(season)}
                    >
                      {season.replace('S', 'Temporada ')}
                    </SeasonButton>
                  ))}
                </SeasonSelector>
                
                {currentSeason && (
                  <SeasonSection id={`season-${currentSeason}`}>
                    <SeasonTitle>{currentSeason.replace('S', 'Temporada ')}</SeasonTitle>
                    
                    <EpisodesList>
                      {currentSeasonEpisodes.map(episode => (
                        <EpisodeCard 
                          key={episode.id} 
                          onClick={() => handleEpisodeSelect(episode)}
                        >
                          <EpisodeImage bgUrl={episode.poster || episode.logo || episode.tvgLogo || item.poster || FALLBACK_IMAGE}>
                            <span className="play-icon">▶️</span>
                          </EpisodeImage>
                          <EpisodeInfo>
                            <EpisodeTitle>{episode.name}</EpisodeTitle>
                            <EpisodeNumber>
                              {episode.episode ? `Episódio ${episode.episode}` : 'Episódio'}
                            </EpisodeNumber>
                          </EpisodeInfo>
                        </EpisodeCard>
                      ))}
                    </EpisodesList>
                  </SeasonSection>
                )}
              </SeasonsContainer>
            )}
          </MediaInfo>
          
          <PosterImage 
            bgUrl={item.poster || item.logo || item.tvgLogo || FALLBACK_IMAGE} 
            className={!item.poster && !item.logo && !item.tvgLogo ? 'placeholder' : ''}
            onError={handleImageError}
          >
            {!item.poster && !item.logo && !item.tvgLogo && 'Sem Imagem'}
          </PosterImage>
        </MediaContent>
        
        {relatedItems.length > 0 && (
          <Suspense fallback={<LoadingContainer><div>Loading related content...</div></LoadingContainer>}>
            <RelatedContent items={relatedItems} onItemClick={handleEpisodeSelect} />
          </Suspense>
        )}
      </ContentWrapper>
      
      {playerLoading && (
        <PlayerLoading 
          onComplete={handlePlayerLoadingComplete}
          messages={
            selectedEpisode && selectedEpisode.season ?
            [
              `Preparando S${selectedEpisode.season}E${selectedEpisode.episode}`,
              'Conectando ao servidor de séries',
              'Carregando dados do episódio',
              'Configurando legendas',
              'Sincronizando áudio',
              'Pronto para reprodução'
            ] :
            [
              'Preparando sua mídia',
              'Conectando ao servidor de streaming',
              'Carregando dados de vídeo',
              'Configurando qualidade ideal',
              'Inicializando player',
              'Pronto para reprodução'
            ]
          }
        />
      )}
      
      {showVideoPlayer && selectedEpisode && (
        <Modal onClose={handlePlayerClose} fullWidth>
          <Suspense fallback={<LoadingContainer><div>Loading player...</div></LoadingContainer>}>
            <VideoPlayer
              item={selectedEpisode}
              url={selectedEpisode.url}
              title={selectedEpisode.name}
              autoPlay={true}
              onClose={handlePlayerClose}
              onEpisodeSelect={handleEpisodeSelect}
              episodes={episodes}
              currentEpisode={selectedEpisode}
            />
          </Suspense>
        </Modal>
      )}
    </DetailContainer>
  );
};

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 200px;
  color: white;
  font-size: 18px;
`;

export default DetailPage; 