import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { MediaItem } from '../../types';
import Button from './Button';

interface HeroProps {
  items: MediaItem[];
}

const HeroContainer = styled.div`
  position: relative;
  width: 100%;
  height: 80vh;
  max-height: 800px;
  min-height: 500px;
  overflow: hidden;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    height: 60vh;
    min-height: 400px;
  }
`;

const HeroSlide = styled.div<{ active: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: ${({ active }) => (active ? 1 : 0)};
  transition: opacity 1s ease;
  z-index: ${({ active }) => (active ? 1 : 0)};
  display: flex;
  align-items: center;
`;

const HeroBackground = styled.div<{ bgUrl?: string }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-image: ${({ bgUrl }) => bgUrl ? `url(${bgUrl})` : 'none'};
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      to right,
      rgba(0, 0, 0, 0.8) 0%,
      rgba(0, 0, 0, 0.6) 50%,
      rgba(0, 0, 0, 0.4) 100%
    );
  }
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 2;
  max-width: 600px;
  padding: ${({ theme }) => theme.spacing.xxl};
  color: ${({ theme }) => theme.colors.text};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.spacing.lg};
    max-width: 100%;
  }
`;

const Title = styled.h1`
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: 2rem;
  }
`;

const Description = styled.p`
  font-size: 1.125rem;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: 1rem;
  }
`;

const InfoTag = styled.span`
  display: inline-block;
  background-color: rgba(255, 255, 255, 0.2);
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  margin-right: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: 0.875rem;
`;

const ButtonsContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.lg};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing.sm};
  }
`;

const SlideControls = styled.div`
  position: absolute;
  bottom: ${({ theme }) => theme.spacing.xl};
  right: ${({ theme }) => theme.spacing.xl};
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  z-index: 5;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    bottom: ${({ theme }) => theme.spacing.lg};
    right: ${({ theme }) => theme.spacing.lg};
  }
`;

const SlideIndicator = styled.button<{ active: boolean }>`
  width: 12px;
  height: 12px;
  border-radius: ${({ theme }) => theme.borderRadius.circle};
  background-color: ${({ active, theme }) => 
    active ? theme.colors.primary : 'rgba(255, 255, 255, 0.3)'};
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.3s ease;
  
  &:hover {
    transform: scale(1.2);
    background-color: ${({ active, theme }) => 
      active ? theme.colors.secondary : 'rgba(255, 255, 255, 0.5)'};
  }
`;

// Fallback image for hero background
const FALLBACK_IMAGE = 'https://via.placeholder.com/1600x900?text=MegaFilmesTV';

const Hero: React.FC<HeroProps> = ({ items }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const displayItems = items.slice(0, 5); // Limit to 5 items
  
  // Auto-rotate slides
  useEffect(() => {
    if (displayItems.length <= 1) return;
    
    const interval = setInterval(() => {
      if (!isAnimating) {
        goToNextSlide();
      }
    }, 6000);
    
    return () => clearInterval(interval);
  }, [currentSlide, isAnimating, displayItems.length]);
  
  // GSAP animations
  useEffect(() => {
    const slideContent = document.querySelector(`.slide-${currentSlide} .hero-content`);
    if (slideContent) {
      setIsAnimating(true);
      gsap.fromTo(
        slideContent,
        { x: -50, opacity: 0 },
        { 
          x: 0, 
          opacity: 1, 
          duration: 0.8, 
          ease: "power3.out",
          onComplete: () => setIsAnimating(false)
        }
      );
    }
  }, [currentSlide]);
  
  const goToSlide = (index: number) => {
    if (index !== currentSlide && !isAnimating) {
      setCurrentSlide(index);
    }
  };
  
  const goToNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % displayItems.length);
  };
  
  if (displayItems.length === 0) {
    return null;
  }
  
  return (
    <HeroContainer>
      {displayItems.map((item, index) => (
        <HeroSlide 
          key={item.id} 
          active={index === currentSlide}
          className={`slide-${index}`}
        >
          <HeroBackground 
            bgUrl={item.logo || FALLBACK_IMAGE} 
          />
          <HeroContent className="hero-content">
            <Title>{item.name}</Title>
            <div>
              {item.year && <InfoTag>{item.year}</InfoTag>}
              {item.genre && <InfoTag>{item.genre}</InfoTag>}
              <InfoTag>{item.type === 'movie' ? 'Filme' : item.type === 'series' ? 'Série' : 'Canal'}</InfoTag>
            </div>
            {item.description && (
              <Description>
                {item.description.length > 150 
                  ? `${item.description.substring(0, 150)}...` 
                  : item.description}
              </Description>
            )}
            <ButtonsContainer>
              <Link to={`/${item.type}s/${item.id}`}>
                <Button variant="primary" size="large" icon="▶">
                  Assistir
                </Button>
              </Link>
              <Link to={`/${item.type}s`}>
                <Button variant="outline" size="large">
                  Mais {item.type === 'movie' ? 'Filmes' : item.type === 'series' ? 'Séries' : 'Canais'}
                </Button>
              </Link>
            </ButtonsContainer>
          </HeroContent>
        </HeroSlide>
      ))}
      
      {displayItems.length > 1 && (
        <SlideControls>
          {displayItems.map((_, index) => (
            <SlideIndicator 
              key={index} 
              active={index === currentSlide} 
              onClick={() => goToSlide(index)}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </SlideControls>
      )}
    </HeroContainer>
  );
};

export default Hero; 