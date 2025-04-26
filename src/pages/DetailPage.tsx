import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import VideoPlayer from '../components/ui/VideoPlayer';
import Button from '../components/ui/Button';
import { useM3UData } from '../hooks/useM3UData';
import { MediaItem } from '../types';
import { getSeriesEpisodes, getEpisodesBySeasons } from '../services/m3uService';
import Modal from '../components/ui/Modal';
import MediaRow from '../components/ui/MediaRow';
import { findItemFromM3U } from '../services/m3uCache';

const DetailContainer = styled.div`
  padding: ${({ theme }) => `${theme.spacing.xl} 0`};
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  padding: 0;
  transition: color 0.2s ease;
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
  
  .icon {
    margin-right: ${({ theme }) => theme.spacing.xs};
  }
`;

const MediaContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 350px;
  grid-gap: ${({ theme }) => theme.spacing.xl};
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
  font-size: 2.5rem;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: 1.75rem;
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
  
  .icon {
    margin-right: ${({ theme }) => theme.spacing.xs};
    opacity: 0.8;
  }
`;

const Description = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text};
  
  p {
    margin-bottom: ${({ theme }) => theme.spacing.md};
  }
`;

const RelatedContent = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xxl};
`;

const PosterImage = styled.div<{ bgUrl?: string }>`
  width: 100%;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  overflow: hidden;
  background-color: ${({ theme }) => theme.colors.backgroundLight};
  box-shadow: ${({ theme }) => theme.shadows.medium};
  aspect-ratio: 2/3;
  background-image: ${({ bgUrl }) => bgUrl ? `url(${bgUrl})` : 'none'};
  background-size: cover;
  background-position: center;
  
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
  }
  
  p {
    margin-bottom: ${({ theme }) => theme.spacing.xl};
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

// Fallback image for items without an image
const FALLBACK_IMAGE = 'https://via.placeholder.com/300x450?text=Sem+Imagem';

const SeasonSelector = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const SeasonTitle = styled.h3`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  font-size: 1.2rem;
  color: ${({ theme }) => theme.colors.primary};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: 1.1rem;
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
  background-color: ${({ theme }) => theme.colors.backgroundLight};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: ${({ theme }) => theme.shadows.medium};
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
  
  .play-icon {
    opacity: 0.7;
    transition: opacity 0.2s ease;
  }
  
  &:hover .play-icon {
    opacity: 1;
  }
`;

const EpisodeInfo = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
`;

const EpisodeTitle = styled.h4`
  font-size: 1rem;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const EpisodeNumber = styled.div`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const SeasonsContainer = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xxl};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    margin-top: ${({ theme }) => theme.spacing.lg};
  }
`;

const SectionTitle = styled.h2`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  font-size: 1.2rem;
  color: ${({ theme }) => theme.colors.primary};
`;

const SeasonSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const EpisodeItem = styled.div`
  background-color: ${({ theme }) => theme.colors.backgroundLight};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: ${({ theme }) => theme.shadows.medium};
  }
`;

const EpisodeDescription = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const PlayButton = styled.div`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0;
  transition: color 0.2s ease;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: 8px;
    border-radius: 50%;
    background-color: ${({ theme }) => theme.colors.primary}22;
  }
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const DetailPage: React.FC = () => {
  const { contentType, id } = useParams<{ contentType: string; id: string }>();
  const [item, setItem] = useState<MediaItem | null>(null);
  const [relatedItems, setRelatedItems] = useState<MediaItem[]>([]);
  const [showPlayer, setShowPlayer] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [episodes, setEpisodes] = useState<MediaItem[]>([]);
  const [episodesBySeasons, setEpisodesBySeasons] = useState<Record<string, MediaItem[]>>({});
  const [selectedEpisode, setSelectedEpisode] = useState<MediaItem | null>(null);
  const [activeItem, setActiveItem] = useState<MediaItem | null>(null);
  const [isSeries, setIsSeries] = useState(false);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  const { 
    items,
    allItems, 
    loading: dataLoading, 
    error: dataError 
  } = useM3UData();
  
  const navigate = useNavigate();
  
  // Função para processar um item encontrado
  const handleFoundItem = useCallback((foundItem: MediaItem) => {
    console.log("Item encontrado:", foundItem);
    setItem(foundItem);
    
    // Check if it's a series item with empty URL (parent series)
    if (foundItem.type === 'series' && (!foundItem.url || foundItem.url === '')) {
      console.log("Encontrando episódios para a série:", foundItem.id);
      
      // Use allItems to get episodes
      const seriesEpisodes = getSeriesEpisodes(allItems || [], foundItem.id);
      setEpisodes(seriesEpisodes);
      
      // Group episodes by season
      const seasonEpisodes = getEpisodesBySeasons(allItems || [], foundItem.id);
      setEpisodesBySeasons(seasonEpisodes);
      
      console.log(`Encontrados ${seriesEpisodes.length} episódios em ${Object.keys(seasonEpisodes).length} temporadas`);
      setIsSeries(true);
    }
    
    // Definir relacionados com o mesmo tipo (usando apenas o que já está carregado)
    const sameTypeItems = items.filter(i => 
      i.id !== foundItem?.id && 
      i.type === foundItem?.type
    );
    
    // Definir relacionados com o mesmo gênero se disponível
    let related: MediaItem[] = [];
    if (foundItem?.genre) {
      related = sameTypeItems.filter(i => i.genre === foundItem?.genre);
    }
    
    // Se não tem suficientes do mesmo gênero, adiciona mais do mesmo tipo
    if (related.length < 10) {
      const moreItems = sameTypeItems.filter(i => 
        !foundItem?.genre || i.genre !== foundItem?.genre
      );
      
      related = [...related, ...moreItems].slice(0, 10);
    }
    
    console.log(`Encontrados ${related.length} itens relacionados`);
    setRelatedItems(related);
  }, [items, allItems]);
  
  // Find the item and related items
  useEffect(() => {
    if (!dataLoading) {
      setIsLoading(true);
      console.log(`Procurando item: tipo=${contentType}, id=${id}`);
      
      // Clean the contentType (remove trailing 's' if any)
      const type = contentType?.endsWith('s') 
        ? contentType.slice(0, -1) as 'movie' | 'series' | 'channel'
        : (contentType as 'movie' | 'series' | 'channel');
      
      const findItem = async () => {
        try {
          // Primeiro tentar encontrar diretamente pelo ID/nome no cache para otimizar
          if (id) {
            const decodedId = decodeURIComponent(id || '');
            const directItem = await findItemFromM3U(decodedId, type);
            
            if (directItem) {
              console.log("Item encontrado rapidamente através do cache:", directItem);
              handleFoundItem(directItem);
              setIsLoading(false);
              return;
            }
          }
          
          // Se não encontrou pelo método rápido, cai para o método tradicional com todos os itens
          if (items.length > 0) {
            console.log("Usando método tradicional (mais lento) para encontrar o item...");
            
            // Find the item - first try by ID
            let foundItem = items.find(item => item.id === id && (!type || item.type === type));
            
            // Se não encontrar pelo ID, tenta pelo nome
            if (!foundItem) {
              console.log("Item não encontrado pelo ID, tentando pelo nome...");
              const decodedId = decodeURIComponent(id || '');
              foundItem = items.find(item => 
                (item.name === decodedId || 
                item.tvgName === decodedId) && 
                (!type || item.type === type)
              );
            }
            
            // Se ainda não encontrou, tenta por correspondência parcial do nome
            if (!foundItem) {
              console.log("Item não encontrado exatamente, tentando por correspondência parcial...");
              const decodedId = decodeURIComponent(id || '').toLowerCase();
              foundItem = items.find(item => 
                (item.name?.toLowerCase().includes(decodedId) || 
                item.tvgName?.toLowerCase().includes(decodedId)) && 
                (!type || item.type === type)
              );
            }
            
            // Se continua não encontrando, considera qualquer item com URL válida
            if (!foundItem) {
              console.log("Tentando encontrar qualquer item com este nome e URL válida...");
              const decodedId = decodeURIComponent(id || '').toLowerCase();
              foundItem = items.find(item => 
                (item.name?.toLowerCase().includes(decodedId) || 
                item.tvgName?.toLowerCase().includes(decodedId)) && 
                item.url && item.url.trim() !== ''
              );
            }
            
            if (foundItem) {
              handleFoundItem(foundItem);
            }
          }
        } catch (error) {
          console.error("Erro ao buscar item:", error);
        } finally {
          setIsLoading(false);
        }
      };
      
      findItem();
    }
  }, [dataLoading, items, allItems, contentType, id, handleFoundItem]);
  
  // Initialize animations
  useEffect(() => {
    if (item) {
      gsap.fromTo(
        '.media-detail',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
      );
    }
  }, [item]);
  
  // Go back function
  const goBack = () => {
    navigate(-1);
  };
  
  // Handle image loading error
  const handleImageError = () => {
    setImageError(true);
  };
  
  // Remover o carregamento automático de conteúdo (autoplay)
  useEffect(() => {
    if (item && !dataLoading) {
      // Não fazer nada aqui - removido o autoplay
    }
  }, [item, dataLoading, episodesBySeasons]);
  
  // Prepare player view
  const handlePlay = () => {
    setActiveItem(item);
    setShowPlayer(true);
  };
  
  // Handle player close
  const handlePlayerClose = () => {
    setShowPlayer(false);
  };
  
  // For series with episodes, handle episode selection
  const handleEpisodeSelect = (episode: MediaItem) => {
    if (episode.id === activeItem?.id) return;
    setActiveItem(episode);
  };
  
  // Get episodes for a series
  const getEpisodesForSeries = (seriesId: string): MediaItem[] => {
    return allItems.filter(item => 
      item.type === 'series' && 
      item.parentId === seriesId
    ).sort((a, b) => {
      // Sort by season then episode
      const seasonA = parseInt(a.season || '0');
      const seasonB = parseInt(b.season || '0');
      
      if (seasonA !== seasonB) {
        return seasonA - seasonB;
      }
      
      return parseInt(a.episode || '0') - parseInt(b.episode || '0');
    });
  };
  
  // Get episodes if item is a series
  const seriesEpisodes = isSeries && item ? getEpisodesForSeries(item.id) : [];
  
  // Detectar se é dispositivo mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Verificar no carregamento
    checkIfMobile();
    
    // Adicionar listener para redimensionamento
    window.addEventListener('resize', checkIfMobile);
    
    // Limpar listener
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  // Show loading state
  if (dataLoading || isLoading) {
    return (
      <DetailContainer>
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <h2>Carregando conteúdo...</h2>
        </div>
      </DetailContainer>
    );
  }
  
  // Show error state
  if (dataError) {
    return (
      <DetailContainer>
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <h2>Erro ao carregar o conteúdo</h2>
          <p>Não foi possível carregar os detalhes. Por favor, tente novamente mais tarde.</p>
          <Button variant="outline" onClick={goBack}>
            Voltar
          </Button>
        </div>
      </DetailContainer>
    );
  }
  
  // Show not found state
  if (!item) {
    return (
      <DetailContainer>
        <NotFound>
          <h2>Conteúdo não encontrado</h2>
          <p>O item que você está procurando não existe ou foi removido.</p>
          <Button variant="outline" onClick={goBack}>
            Voltar
          </Button>
        </NotFound>
      </DetailContainer>
    );
  }
  
  // Determine the image source
  const imageSource = imageError || !item.logo ? FALLBACK_IMAGE : item.logo;
  
  return (
    <DetailContainer className="media-detail">
      <BackButton onClick={goBack}>
        <span className="icon">←</span> Voltar
      </BackButton>
      
      <MediaContent>
        {/* No mobile, a imagem é mostrada primeiro, depois os detalhes */}
        {isMobile && (
          <MediaInfo>
            <PosterImage 
              bgUrl={!imageError ? (item.logo || FALLBACK_IMAGE) : FALLBACK_IMAGE}
              className={!item.logo || imageError ? 'placeholder' : ''}
              onError={handleImageError}
            >
              {(!item.logo || imageError) && (
                <div>Sem imagem disponível</div>
              )}
            </PosterImage>
          </MediaInfo>
        )}
        
        <div>
          {showPlayer && activeItem && (
            <Modal onClose={handlePlayerClose}>
              <VideoPlayer 
                item={activeItem}
                url={activeItem.url}
                title={activeItem.name}
                onClose={handlePlayerClose}
                episodes={isSeries && item ? seriesEpisodes : []}
                currentEpisode={activeItem}
                onEpisodeSelect={handleEpisodeSelect}
                autoPlay={false}
              />
            </Modal>
          )}
          
          <Title>{item.name}</Title>
          
          <MetaInfo>
            {item.type && (
              <MetaItem>
                <span className="icon">📺</span>
                {item.type === 'movie' ? 'Filme' : item.type === 'series' ? 'Série' : 'Canal'}
              </MetaItem>
            )}
            
            {item.genre && (
              <MetaItem>
                <span className="icon">🎭</span>
                {item.genre}
              </MetaItem>
            )}
            
            {item.year && (
              <MetaItem>
                <span className="icon">📅</span>
                {item.year}
              </MetaItem>
            )}
            
            {!isMobile && item.group && (
              <MetaItem>
                <span className="icon">🏷️</span>
                {item.group}
              </MetaItem>
            )}
          </MetaInfo>
          
          {item.description && (
            <Description>
              <p>{item.description}</p>
            </Description>
          )}
          
          {/* Exibir Player Button for non-series items or series with direct URL */}
          {(item.type !== 'series' || (item.type === 'series' && item.url && item.url.trim() !== '')) && (
            <Button 
              onClick={handlePlay} 
              icon="▶️" 
              variant="primary"
              style={{ width: isMobile ? '100%' : 'auto' }}
            >
              Assistir Agora
            </Button>
          )}
          
          {/* Series episodes */}
          {item.type === 'series' && Object.keys(episodesBySeasons).length > 0 && (
            <SeasonsContainer>
              <SectionTitle>Episódios</SectionTitle>
              {Object.entries(episodesBySeasons).map(([season, seasonEpisodes]) => (
                <SeasonSection key={season}>
                  <SeasonTitle>{season}</SeasonTitle>
                  <EpisodesList>
                    {seasonEpisodes.map(episode => (
                      <EpisodeItem key={episode.id} onClick={() => {
                        setActiveItem(episode);
                        setShowPlayer(true);
                      }}>
                        <EpisodeNumber>
                          {episode.season && episode.episode && `E${episode.episode}`}
                        </EpisodeNumber>
                        <EpisodeInfo>
                          <EpisodeTitle>{episode.name}</EpisodeTitle>
                          {!isMobile && episode.description && (
                            <EpisodeDescription>
                              {episode.description.slice(0, 100)}
                              {episode.description.length > 100 ? '...' : ''}
                            </EpisodeDescription>
                          )}
                        </EpisodeInfo>
                        <PlayButton>▶️</PlayButton>
                      </EpisodeItem>
                    ))}
                  </EpisodesList>
                </SeasonSection>
              ))}
            </SeasonsContainer>
          )}
        </div>
        
        {/* No desktop, a imagem é mostrada ao lado dos detalhes */}
        {!isMobile && (
          <MediaInfo>
            <PosterImage 
              bgUrl={!imageError ? (item.logo || FALLBACK_IMAGE) : FALLBACK_IMAGE}
              className={!item.logo || imageError ? 'placeholder' : ''}
              onError={handleImageError}
            >
              {(!item.logo || imageError) && (
                <div>Sem imagem disponível</div>
              )}
            </PosterImage>
          </MediaInfo>
        )}
      </MediaContent>
      
      {/* Related content section */}
      {relatedItems.length > 0 && (
        <RelatedContent>
          <h2>Conteúdo Relacionado</h2>
          <MediaRow items={relatedItems} title="" />
        </RelatedContent>
      )}
    </DetailContainer>
  );
};

export default DetailPage; 