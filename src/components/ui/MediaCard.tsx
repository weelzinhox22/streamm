import React, { useState } from 'react';
import styled from 'styled-components';
import { MediaItem } from '../../types';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';

interface MediaCardProps {
  item: MediaItem;
  showInfo?: boolean;
}

const CardContainer = styled.div`
  position: relative;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  overflow: hidden;
  transition: transform ${({ theme }) => theme.transitions.fast}, 
              box-shadow ${({ theme }) => theme.transitions.fast};
  cursor: pointer;
  width: 100%;
  aspect-ratio: 2/3;
  background-color: ${({ theme }) => theme.colors.backgroundLight};
  
  &:hover, &:focus {
    transform: scale(1.05);
    z-index: 10;
    box-shadow: ${({ theme }) => theme.shadows.large};
    
    .card-info {
      opacity: 1;
      transform: translateY(0);
    }
    
    .overlay {
      opacity: 0.8;
    }
  }
`;

const CardImage = styled.div<{ bgUrl?: string }>`
  width: 100%;
  height: 100%;
  background-image: ${({ bgUrl }) => bgUrl ? `url(${bgUrl})` : 'none'};
  background-size: cover;
  background-position: center;
  
  &.placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: ${({ theme }) => theme.colors.backgroundLight};
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: 0.875rem;
    font-weight: 500;
    text-align: center;
    padding: ${({ theme }) => theme.spacing.md};
  }
`;

const CardOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0.4) 50%,
    rgba(0, 0, 0, 0.8) 100%
  );
  opacity: 0.4;
  transition: opacity ${({ theme }) => theme.transitions.fast};
`;

const CardBadge = styled.div<{ type: 'new' | 'featured' }>`
  position: absolute;
  top: ${({ theme }) => theme.spacing.sm};
  right: ${({ theme }) => theme.spacing.sm};
  background-color: ${({ type, theme }) => 
    type === 'new' ? theme.colors.success : theme.colors.maxPurple};
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.75rem;
  font-weight: 600;
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  z-index: 2;
`;

const CardInfo = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text};
  opacity: 0.9;
  transform: translateY(10px);
  transition: opacity ${({ theme }) => theme.transitions.fast},
              transform ${({ theme }) => theme.transitions.fast};
  z-index: 2;
`;

const CardTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CardDetails = styled.div`
  display: flex;
  flex-direction: column;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const CardDetail = styled.span`
  display: flex;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  
  &:last-child {
    margin-bottom: 0;
  }
  
  .icon {
    margin-right: ${({ theme }) => theme.spacing.xs};
  }
`;

// Fallback image for cards without an image
const FALLBACK_IMAGE = 'https://via.placeholder.com/300x450?text=Sem+Imagem';

const MediaCard: React.FC<MediaCardProps> = ({ item, showInfo = true }) => {
  const [imageError, setImageError] = useState(false);
  
  // Generate the link path based on the media type and ensure valid ID
  const getLinkPath = () => {
    // Verifica se o item tem ID válido
    if (!item.id) {
      console.error('Item sem ID:', item);
      return '/'; // Redirecionar para a home em caso de erro
    }
    
    // Para séries, verificar se é uma série principal (parent)
    if (item.type === 'series') {
      // Série com URL vazia geralmente é uma série parent (agrupamento de episódios)
      const isSeriesParent = !item.url || item.url === '';
      
      // Para série parent, usar o ID normal
      if (isSeriesParent) {
        return `/series/${encodeURIComponent(item.id)}`;
      }
      
      // Se tem parentId, usar o ID do parent para sempre ir para a página da série
      if (item.parentId) {
        return `/series/${encodeURIComponent(item.parentId)}`;
      }
    }
    
    // Para filmes e canais, usar a rota padrão
    return `/${item.type}s/${encodeURIComponent(item.id)}`;
  };
  
  const linkPath = getLinkPath();
  
  // Handle image loading error
  const handleImageError = () => {
    setImageError(true);
  };
  
  // Determine the image source
  const imageSource = imageError || !item.logo ? 
    FALLBACK_IMAGE : 
    item.logo;
  
  // Animation reference
  const cardRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    // Add animation when the component mounts
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { y: 30, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 0.6, 
          delay: Math.random() * 0.3, // Random delay for staggered effect
          ease: "power3.out" 
        }
      );
    }
  }, []);
  
  return (
    <Link to={linkPath} style={{ textDecoration: 'none', display: 'block' }}>
      <CardContainer ref={cardRef}>
        <CardImage 
          bgUrl={imageSource}
          className={imageError || !item.logo ? 'placeholder' : ''}
          onError={handleImageError}
        >
          {(imageError || !item.logo) && <div>{item.name}</div>}
        </CardImage>
        
        <CardOverlay className="overlay" />
        
        {item.isNew && <CardBadge type="new">NOVO</CardBadge>}
        {item.isFeatured && !item.isNew && <CardBadge type="featured">DESTAQUE</CardBadge>}
        
        {showInfo && (
          <CardInfo className="card-info">
            <CardTitle>{item.name}</CardTitle>
            <CardDetails>
              {item.year && (
                <CardDetail>
                  <span className="icon">📅</span> {item.year}
                </CardDetail>
              )}
              {item.genre && (
                <CardDetail>
                  <span className="icon">🎭</span> {item.genre}
                </CardDetail>
              )}
              {item.type === 'series' && item.season && item.episode && (
                <CardDetail>
                  <span className="icon">📺</span> S{item.season}E{item.episode}
                </CardDetail>
              )}
            </CardDetails>
          </CardInfo>
        )}
      </CardContainer>
    </Link>
  );
};

export default MediaCard; 