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
  height: 85vh;
  max-height: 800px;
  min-height: 500px;
  overflow: hidden;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.large};
  transition: transform 0.3s ease;
  
  &:hover {
    transform: scale(1.005);
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    height: 60vh;
    min-height: 400px;
    border-radius: ${({ theme }) => theme.borderRadius.md};
  }
`;

const HeroSlide = styled.div<{ active: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: ${({ active }) => (active ? 1 : 0)};
  transition: opacity 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
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
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      to right,
      rgba(0, 0, 0, 0.9) 0%,
      rgba(0, 0, 0, 0.6) 50%,
      rgba(0, 0, 0, 0.3) 100%
    );
    z-index: 1;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 30%;
    background: linear-gradient(
      to top,
      rgba(20, 20, 20, 1) 0%,
      rgba(20, 20, 20, 0) 100%
    );
    z-index: 1;
  }
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 2;
  max-width: 650px;
  padding: ${({ theme }) => theme.spacing.xxl};
  color: ${({ theme }) => theme.colors.text};
  animation: slideUp 0.8s ease-out forwards;
  
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.spacing.lg};
    max-width: 100%;
  }
`;

const Title = styled.h1`
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  letter-spacing: -0.5px;
  background: linear-gradient(90deg, ${({ theme }) => theme.colors.text} 0%, rgba(255, 255, 255, 0.8) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: 2.2rem;
  }
`;

const Description = styled.p`
  font-size: 1.2rem;
  line-height: 1.6;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  opacity: 0.9;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: 1rem;
  }
`;

const InfoTag = styled.span`
  display: inline-block;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.backgroundLight} 0%, rgba(31, 31, 31, 0.7) 100%);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.md}`};
  margin-right: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0.5px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
`;

const ButtonsContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.xl};
  
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
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  transform: ${({ active }) => active ? 'scale(1.2)' : 'scale(1)'};
  
  &:hover {
    transform: scale(1.3);
    background-color: ${({ active, theme }) => 
      active ? theme.colors.secondary : 'rgba(255, 255, 255, 0.5)'};
  }
`;

// Controles de navegação para desktop
const NavButton = styled.button<{ direction: 'prev' | 'next' }>`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  ${({ direction }) => direction === 'prev' ? 'left: 20px;' : 'right: 20px;'}
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.3s ease, transform 0.3s ease, background-color 0.3s ease;
  
  ${HeroContainer}:hover & {
    opacity: 0.8;
  }
  
  &:hover {
    background: ${({ theme }) => theme.colors.primary};
    opacity: 1;
    transform: translateY(-50%) scale(1.1);
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: none;
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
    }, 7000);
    
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
  
  const goToPrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + displayItems.length) % displayItems.length);
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
                  Assistir Agora
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
      
      {/* Navegação lateral */}
      {displayItems.length > 1 && (
        <>
          <NavButton 
            direction="prev" 
            onClick={goToPrevSlide}
            aria-label="Slide anterior"
          >
            &#8592;
          </NavButton>
          <NavButton 
            direction="next" 
            onClick={goToNextSlide}
            aria-label="Próximo slide"
          >
            &#8594;
          </NavButton>
        </>
      )}
      
      {/* Indicadores de slide */}
      {displayItems.length > 1 && (
        <SlideControls>
          {displayItems.map((_, index) => (
            <SlideIndicator 
              key={index} 
              active={index === currentSlide}
              onClick={() => goToSlide(index)}
              aria-label={`Ir para slide ${index + 1}`}
            />
          ))}
        </SlideControls>
      )}
    </HeroContainer>
  );
};

export default Hero; 