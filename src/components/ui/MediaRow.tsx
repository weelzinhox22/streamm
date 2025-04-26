import React, { useRef, useState, useEffect } from 'react';
import styled from 'styled-components';
import { MediaItem } from '../../types';
import MediaCard from './MediaCard';

interface MediaRowProps {
  title: string;
  items: MediaItem[];
  seeAllLink?: string;
  showMoreText?: string;
}

const RowContainer = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  position: relative;
  overflow: hidden;
  padding: ${({ theme }) => theme.spacing.md} 0;
`;

const RowHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  padding: 0 ${({ theme }) => theme.spacing.md};
  position: relative;
  z-index: 2;
`;

const RowTitle = styled.h2`
  font-size: 1.5rem;
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  
  .title-icon {
    margin-right: ${({ theme }) => theme.spacing.sm};
    color: ${({ theme }) => theme.colors.primary};
    opacity: 0.8;
  }
  
  &::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: -2px;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, ${({ theme }) => theme.colors.primary}, transparent);
    transform: translateX(-101%);
    transition: transform 0.6s ease;
  }
  
  ${RowContainer}:hover &::after {
    transform: translateX(0);
  }
  
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
  padding: 8px 12px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background-color: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
  
  .icon {
    margin-left: ${({ theme }) => theme.spacing.sm};
    font-size: 0.75rem;
    transition: transform 0.3s ease;
  }
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    background-color: rgba(255, 255, 255, 0.1);
    transform: scale(1.05);
    
    .icon {
      transform: translateX(3px);
    }
  }
  
  &:active {
    transform: scale(0.98);
  }
`;

const CarouselContainer = styled.div`
  position: relative;
  width: 100%;
  overflow: hidden;
  mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
  -webkit-mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
`;

const CarouselTrack = styled.div`
  display: flex;
  padding: 0 ${({ theme }) => theme.spacing.md};
  transition: transform 0.5s cubic-bezier(0.215, 0.610, 0.355, 1.000);
  will-change: transform;
`;

const CardWrapper = styled.div`
  flex: 0 0 auto;
  width: 200px;
  padding: 0 ${({ theme }) => theme.spacing.sm};
  box-sizing: border-box;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    width: 160px;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    width: 140px;
  }
`;

const ControlButton = styled.button`
  position: absolute;
  top: 50%;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(15, 15, 20, 0.7);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transform: translateY(-50%);
  transition: all 0.3s ease;
  
  &.prev {
    left: ${({ theme }) => theme.spacing.sm};
  }
  
  &.next {
    right: ${({ theme }) => theme.spacing.sm};
  }
  
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    padding: 2px;
    background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary}44, transparent);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
  }
  
  &:hover {
    background-color: rgba(25, 25, 35, 0.85);
    transform: translateY(-50%) scale(1.1);
  }
  
  &:active {
    transform: translateY(-50%) scale(0.95);
    background-color: rgba(25, 25, 35, 0.7);
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    width: 36px;
    height: 36px;
    opacity: 0.7;
  }
`;

const ProgressBar = styled.div`
  height: 3px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  margin-top: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  width: 100%;
  max-width: 200px;
  margin-left: auto;
  margin-right: auto;
  overflow: hidden;
  position: relative;
`;

const ProgressIndicator = styled.div`
  height: 100%;
  background: linear-gradient(to right, ${({ theme }) => theme.colors.primary}, ${({ theme }) => theme.colors.maxPurple});
  border-radius: 3px;
  position: relative;
  transition: width 0.3s ease;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.3), transparent);
    animation: shine 2s infinite;
    
    @keyframes shine {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
  }
`;

// Componentes SVG para os ícones
const GripLinesIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="16" 
    height="16" 
    viewBox="0 0 448 512" 
    fill="currentColor"
    className="title-icon"
  >
    <path d="M32 288c-17.7 0-32 14.3-32 32s14.3 32 32 32l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L32 288zm0-128c-17.7 0-32 14.3-32 32s14.3 32 32 32l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L32 160z"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="12" 
    height="12" 
    viewBox="0 0 448 512" 
    fill="currentColor"
  >
    <path d="M438.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.8 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l306.7 0L233.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z"/>
  </svg>
);

const ChevronLeftIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="16" 
    height="16" 
    viewBox="0 0 320 512" 
    fill="currentColor"
  >
    <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"/>
  </svg>
);

const ChevronRightIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="16" 
    height="16" 
    viewBox="0 0 320 512" 
    fill="currentColor"
  >
    <path d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"/>
  </svg>
);

// Componente sem framer-motion
const MediaRow: React.FC<MediaRowProps> = ({ 
  title, 
  items, 
  seeAllLink,
  showMoreText = 'Ver Tudo' 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  
  // State for dragging
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragDistance, setDragDistance] = useState(0);
  
  // Calculate items visible per view based on screen width
  const getItemsPerView = () => {
    if (typeof window === 'undefined') return 5;
    
    const width = window.innerWidth;
    if (width < 600) return 2;
    if (width < 960) return 4;
    return 5;
  };
  
  const itemsPerView = getItemsPerView();
  const totalPages = Math.ceil(items.length / itemsPerView);
  
  useEffect(() => {
    const handleResize = () => {
      if (currentIndex >= totalPages) {
        setCurrentIndex(Math.max(0, totalPages - 1));
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentIndex, totalPages]);
  
  // Function to update carousel position
  const updateCarouselPosition = (index: number, dragOffset = 0) => {
    if (carouselRef.current) {
      const offset = -index * 100;
      carouselRef.current.style.transform = `translateX(calc(${offset}% + ${dragOffset}px))`;
    }
  };
  
  // Update carousel position when currentIndex changes
  useEffect(() => {
    updateCarouselPosition(currentIndex);
  }, [currentIndex]);
  
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };
  
  const handleNext = () => {
    if (currentIndex < totalPages - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };
  
  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragDistance(0);
    
    if (carouselRef.current) {
      carouselRef.current.style.transition = 'none';
    }
    
    e.preventDefault();
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const currentDragDistance = e.clientX - dragStartX;
    setDragDistance(currentDragDistance);
    
    updateCarouselPosition(currentIndex, currentDragDistance);
  };
  
  const handleDragEnd = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    if (carouselRef.current) {
      carouselRef.current.style.transition = 'transform 0.5s cubic-bezier(0.215, 0.610, 0.355, 1.000)';
    }
    
    // Change slide if dragged far enough
    const threshold = 100;
    if (dragDistance > threshold && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (dragDistance < -threshold && currentIndex < totalPages - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Snap back to current position
      updateCarouselPosition(currentIndex);
    }
  };
  
  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setDragStartX(e.touches[0].clientX);
    setDragDistance(0);
    
    if (carouselRef.current) {
      carouselRef.current.style.transition = 'none';
    }
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentDragDistance = e.touches[0].clientX - dragStartX;
    setDragDistance(currentDragDistance);
    
    updateCarouselPosition(currentIndex, currentDragDistance);
  };
  
  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    if (carouselRef.current) {
      carouselRef.current.style.transition = 'transform 0.5s cubic-bezier(0.215, 0.610, 0.355, 1.000)';
    }
    
    // Change slide if dragged far enough
    const threshold = 100;
    if (dragDistance > threshold && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (dragDistance < -threshold && currentIndex < totalPages - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Snap back to current position
      updateCarouselPosition(currentIndex);
    }
  };
  
  // Exit early if no items
  if (items.length === 0) {
    return null;
  }
  
  return (
    <RowContainer className="media-row">
      <RowHeader>
        <RowTitle>
          <GripLinesIcon />
          {title}
        </RowTitle>
        {seeAllLink && (
          <SeeAllButton href={seeAllLink}>
            {showMoreText} <span className="icon">
              <ArrowRightIcon />
            </span>
          </SeeAllButton>
        )}
      </RowHeader>
      
      <CarouselContainer>
        <CarouselTrack
          ref={carouselRef}
          style={{ width: `${totalPages * 100}%` }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {items.map((item) => (
            <CardWrapper key={item.id}>
              <MediaCard item={item} />
            </CardWrapper>
          ))}
        </CarouselTrack>
        
        {currentIndex > 0 && (
          <ControlButton 
            className="prev"
            onClick={handlePrev}
            aria-label="Anterior"
          >
            <ChevronLeftIcon />
          </ControlButton>
        )}
        
        {currentIndex < totalPages - 1 && (
          <ControlButton 
            className="next"
            onClick={handleNext}
            aria-label="Próximo"
          >
            <ChevronRightIcon />
          </ControlButton>
        )}
      </CarouselContainer>
      
      {totalPages > 1 && (
        <ProgressBar>
          <ProgressIndicator 
            style={{ width: `${(currentIndex + 1) * (100 / totalPages)}%` }}
          />
        </ProgressBar>
      )}
    </RowContainer>
  );
};

export default MediaRow; 