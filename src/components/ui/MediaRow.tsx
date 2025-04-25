import React, { useRef, useEffect } from 'react';
import styled from 'styled-components';
import { gsap } from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { MediaItem } from '../../types';
import MediaCard from './MediaCard';

// Register GSAP plugins
gsap.registerPlugin(ScrollToPlugin);

interface MediaRowProps {
  title: string;
  items: MediaItem[];
  seeAllLink?: string;
  showMoreText?: string;
}

const RowContainer = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  position: relative;
  
  &:hover {
    .control-button {
      opacity: 1;
    }
  }
`;

const RowHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  padding: 0 ${({ theme }) => theme.spacing.md};
`;

const RowTitle = styled.h2`
  font-size: 1.5rem;
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: 1.2rem;
  }
`;

const SeeAllButton = styled.a`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.875rem;
  text-decoration: none;
  display: flex;
  align-items: center;
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
  
  .icon {
    margin-left: ${({ theme }) => theme.spacing.xs};
  }
`;

const ScrollContainer = styled.div`
  position: relative;
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  
  &::-webkit-scrollbar {
    height: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: ${({ theme }) => theme.borderRadius.circle};
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: ${({ theme }) => theme.borderRadius.circle};
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    
    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

const CardGrid = styled.div`
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 200px;
  grid-gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-auto-columns: 160px;
    grid-gap: ${({ theme }) => theme.spacing.sm};
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-auto-columns: 140px;
    grid-gap: ${({ theme }) => theme.spacing.sm};
  }
`;

const ControlButton = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.borderRadius.circle};
  background-color: rgba(0, 0, 0, 0.5);
  color: ${({ theme }) => theme.colors.text};
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.3s ease, background-color 0.3s ease;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primary};
  }
  
  &.prev {
    left: 10px;
  }
  
  &.next {
    right: 10px;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: none;
  }
`;

const EmptyState = styled.div`
  padding: ${({ theme }) => theme.spacing.xl};
  text-align: center;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-style: italic;
`;

const MediaRow: React.FC<MediaRowProps> = ({ 
  title, 
  items, 
  seeAllLink,
  showMoreText = 'Ver Tudo' 
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }
      );
    }
  }, []);
  
  const handleScroll = (direction: 'prev' | 'next') => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = container.clientWidth * 0.8;
      const currentScroll = container.scrollLeft;
      
      gsap.to(container, {
        scrollTo: { 
          x: direction === 'next' 
            ? currentScroll + scrollAmount 
            : currentScroll - scrollAmount 
        },
        duration: 0.5,
        ease: "power2.out"
      });
    }
  };
  
  if (items.length === 0) {
    return null;
  }
  
  return (
    <RowContainer>
      <RowHeader ref={headerRef}>
        <RowTitle>{title}</RowTitle>
        {seeAllLink && (
          <SeeAllButton href={seeAllLink}>
            {showMoreText} <span className="icon">→</span>
          </SeeAllButton>
        )}
      </RowHeader>
      
      <ScrollContainer ref={scrollContainerRef}>
        {items.length > 0 ? (
          <CardGrid>
            {items.map(item => (
              <MediaCard key={item.id} item={item} />
            ))}
          </CardGrid>
        ) : (
          <EmptyState>Nenhum item encontrado</EmptyState>
        )}
      </ScrollContainer>
      
      {items.length > 4 && (
        <>
          <ControlButton 
            className="control-button prev" 
            onClick={() => handleScroll('prev')}
            aria-label="Anterior"
          >
            ←
          </ControlButton>
          <ControlButton 
            className="control-button next" 
            onClick={() => handleScroll('next')}
            aria-label="Próximo"
          >
            →
          </ControlButton>
        </>
      )}
    </RowContainer>
  );
};

export default MediaRow; 