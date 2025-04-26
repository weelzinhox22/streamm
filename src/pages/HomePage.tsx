import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useNavigate } from 'react-router-dom';
import Hero from '../components/ui/Hero';
import MediaRow from '../components/ui/MediaRow';
import Button from '../components/ui/Button';
import { useM3UData } from '../hooks/useM3UData';
import { MediaItem } from '../types';

// Registrar o plugin ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

const HomeContainer = styled.div`
  padding-bottom: ${({ theme }) => theme.spacing.xxl};
  max-width: 100%;
  overflow-x: hidden;
`;

const RefreshButton = styled.button`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary} 0%, ${({ theme }) => theme.colors.secondary} 100%);
  color: white;
  border: none;
  border-radius: 50%;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0px 3px 15px rgba(0, 0, 0, 0.3);
  z-index: 10;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  
  &:hover {
    transform: scale(1.1) rotate(15deg);
    box-shadow: 0px 5px 20px rgba(0, 0, 0, 0.4);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  svg {
    width: 24px;
    height: 24px;
    filter: drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.3));
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    width: 48px;
    height: 48px;
    bottom: 15px;
    right: 15px;
  }
`;

const PageSection = styled.section`
  margin: ${({ theme }) => `${theme.spacing.xl} 0`};
  animation: fadeIn 0.6s ease-out;
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const CategoryContainer = styled.div`
  margin: ${({ theme }) => `${theme.spacing.xl} 0`};
  padding: ${({ theme }) => theme.spacing.xl};
  background: linear-gradient(135deg, rgba(30, 30, 40, 0.8) 0%, rgba(20, 20, 30, 0.9) 100%);
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.large};
  border: 1px solid rgba(255, 255, 255, 0.07);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 60%);
    opacity: 0.5;
    pointer-events: none;
    transition: opacity 0.5s ease;
  }
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0px 15px 25px rgba(0, 0, 0, 0.5);
    
    &::before {
      opacity: 0.8;
    }
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.spacing.lg};
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: ${({ theme }) => theme.spacing.md};
  }
`;

const CategoryTitle = styled.h2`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(90deg, ${({ theme }) => theme.colors.primary} 0%, ${({ theme }) => theme.colors.text} 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  position: relative;
  display: inline-block;
  letter-spacing: -0.5px;
  
  &:after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 0;
    width: 80px;
    height: 4px;
    background: linear-gradient(90deg, ${({ theme }) => theme.colors.primary} 0%, transparent 100%);
    border-radius: 4px;
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    font-size: 1.5rem;
    
    &:after {
      width: 60px;
      height: 3px;
    }
  }
`;

const CategoryButtonsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  margin: ${({ theme }) => theme.spacing.lg} 0;
  padding: ${({ theme }) => theme.spacing.md};
  max-height: 200px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.15);
  border-radius: ${({ theme }) => theme.borderRadius.md};
  border: 1px solid rgba(255, 255, 255, 0.03);
  
  /* Custom scrollbar */
  scrollbar-width: thin;
  scrollbar-color: ${({ theme }) => theme.colors.primary} rgba(255, 255, 255, 0.1);
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: ${({ theme }) => theme.colors.primary};
    border-radius: 3px;
  }
  
  /* Button animation on hover */
  button {
    transform: translateY(0);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: ${({ theme }) => theme.shadows.medium};
    }
  }
`;

const CategoryTypeSelector = styled.div`
  display: flex;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  background: rgba(0, 0, 0, 0.3);
  padding: 8px;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  width: fit-content;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: ${({ theme }) => theme.shadows.medium};
  
  button {
    margin-right: 0;
    border-radius: ${({ theme }) => theme.borderRadius.md};
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    min-width: 100px;
    
    &:not(:last-child) {
      margin-right: 8px;
    }
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    width: 100%;
    justify-content: space-between;
    
    button {
      flex: 1;
      min-width: unset;
      font-size: 0.9rem;
      padding: 8px 12px;
    }
  }
`;

const SectionDivider = styled.div`
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%);
  margin: ${({ theme }) => `${theme.spacing.xl} 0`};
`;

const LoadingContainer = styled.div`
  text-align: center;
  padding: 80px 0;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const LoadingSpinner = styled.div`
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top-color: ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  animation: spin 1s cubic-bezier(0.76, 0.16, 0.24, 0.84) infinite;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.h2`
  font-size: 1.5rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.xl};
  min-height: 300px;
  text-align: center;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const ErrorTitle = styled.h2`
  font-size: 1.8rem;
  color: ${({ theme }) => theme.colors.error};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const ErrorMessage = styled.p`
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  max-width: 600px;
`;

const ErrorButton = styled(Button)`
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.lg}`};
`;

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [categoryType, setCategoryType] = useState<'movies' | 'series' | 'channels'>('movies');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { 
    featured, 
    contentByType,
    contentByGenre,
    loading, 
    error,
    refreshData
  } = useM3UData();
  
  // Initialize animations
  useEffect(() => {
    if (!loading) {
      // Timeline para controlar a sequência de animações
      const mainTimeline = gsap.timeline({
        defaults: { ease: "power3.out" }
      });
      
      // Animar o Hero primeiro
      if (document.querySelector('.hero-container')) {
        mainTimeline.fromTo(
          '.hero-container',
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, clearProps: "transform" },
          0
        );
      }
      
      // Animar as seções com efeito de sequência
      mainTimeline.fromTo(
        '.page-section',
        { y: 50, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          stagger: 0.15, 
          duration: 0.8,
          clearProps: "transform"
        },
        0.3
      );
      
      // Configurar ScrollTrigger para animações ao rolar
      const mediaRows = document.querySelectorAll('.media-row');
      mediaRows.forEach((row, index) => {
        gsap.set(row, { opacity: 0, y: 30 });
        
        gsap.to(row, {
          scrollTrigger: {
            trigger: row,
            start: "top bottom-=100",
            end: "bottom center",
            toggleActions: "play none none none"
          },
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: index * 0.08,
          ease: "power2.out",
          clearProps: "transform"
        });
      });
    }
  }, [loading]);
  
  // Handle refresh with animation
  const handleRefresh = () => {
    setIsRefreshing(true);
    
    // Adicionar animação ao refreshButton
    const refreshButton = document.querySelector('.refresh-button');
    if (refreshButton) {
      gsap.to(refreshButton, {
        rotation: 360,
        duration: 1,
        ease: "power2.inOut"
      });
    }
    
    // Adicionar efeito de fade out antes de atualizar os dados
    const content = document.querySelector('.home-content');
    if (content) {
      gsap.to(content, {
        opacity: 0.5,
        duration: 0.3,
        onComplete: () => {
          refreshData();
          // Restaurar opacidade após atualização
          gsap.to(content, {
            opacity: 1,
            duration: 0.5,
            delay: 0.2
          });
        }
      });
    } else {
      refreshData();
    }
    
    // Reset refreshing state after animation
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };
  
  // Show loading state
  if (loading) {
    return (
      <HomeContainer>
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>Carregando conteúdo...</LoadingText>
          <p>Aguarde enquanto preparamos os melhores filmes e séries para você</p>
        </LoadingContainer>
      </HomeContainer>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <HomeContainer>
        <ErrorContainer>
          <ErrorTitle>Ops! Algo deu errado</ErrorTitle>
          <ErrorMessage>
            Não foi possível carregar a lista M3U. Verifique sua conexão com a internet e tente novamente.
          </ErrorMessage>
          <ErrorButton variant="primary" onClick={refreshData}>
            Tentar Novamente
          </ErrorButton>
        </ErrorContainer>
      </HomeContainer>
    );
  }
  
  // Select featured items for hero section
  const heroItems = featured && featured.length > 0
    ? [...featured[0].items]
    : [];
  
  // Get movie genres with at least 4 items
  const movieGenres = contentByGenre.movies ? 
    Object.entries(contentByGenre.movies)
      .filter(([_, items]) => items.length >= 4)
      .slice(0, 3)
      .map(([genreName, items]) => ({ 
        id: `genre-movie-${genreName}`,
        name: genreName,
        items 
      })) : [];
  
  // Get series genres with at least 4 items
  const seriesGenres = contentByGenre.series ? 
    Object.entries(contentByGenre.series)
      .filter(([_, items]) => items.length >= 4)
      .slice(0, 3)
      .map(([genreName, items]) => ({ 
        id: `genre-series-${genreName}`,
        name: genreName,
        items 
      })) : [];
  
  // Find series without URL (parent series)
  const parentSeries = contentByType.series
    ? contentByType.series.filter((item: MediaItem) => !item.url || item.url === '')
    : [];
    
  // Handle category selection
  const handleCategoryClick = (genreName: string) => {
    const contentTypeSingular = categoryType === 'movies' ? 'movie' : 
                               categoryType === 'series' ? 'series' : 'channel';
                               
    navigate(`/${categoryType}/genre/${genreName}`);
  };
  
  // Get genres for the selected category type
  const getCategoriesForType = () => {
    if (!contentByGenre[categoryType]) return [];
    
    return Object.keys(contentByGenre[categoryType])
      .filter(genre => contentByGenre[categoryType][genre].length > 0)
      .sort();
  };
  
  const categoriesForSelectedType = getCategoriesForType();
  
  return (
    <HomeContainer>
      {/* Refresh button */}
      <RefreshButton 
        onClick={handleRefresh} 
        aria-label="Refresh content"
        className="refresh-button"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="currentColor"
          style={{ 
            transform: isRefreshing ? 'rotate(360deg)' : 'rotate(0deg)',
            transition: 'transform 1s ease'
          }}
        >
          <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 12h7V5l-2.35 1.35z"/>
        </svg>
      </RefreshButton>
      
      <div className="home-content">
        {/* Hero section */}
        {heroItems.length > 0 && <div className="hero-container"><Hero items={heroItems} /></div>}
        
        {/* Featured content sections */}
        <PageSection className="page-section">
          {featured && featured.map((section) => (
            <div key={section.id} className="media-row">
              <MediaRow 
                title={section.title} 
                items={section.items}
                seeAllLink={
                  section.id === 'featured-movies' 
                    ? '/movies' 
                    : section.id === 'featured-series' 
                      ? '/series' 
                      : undefined
                }
              />
            </div>
          ))}
        </PageSection>
        
        <SectionDivider />
        
        {/* Category selector */}
        <CategoryContainer className="page-section">
          <CategoryTitle>Explore por Categorias</CategoryTitle>
          
          <CategoryTypeSelector>
            <Button 
              variant={categoryType === 'movies' ? 'primary' : 'outline'}
              onClick={() => setCategoryType('movies')}
            >
              Filmes
            </Button>
            <Button 
              variant={categoryType === 'series' ? 'primary' : 'outline'}
              onClick={() => setCategoryType('series')}
            >
              Séries
            </Button>
            <Button 
              variant={categoryType === 'channels' ? 'primary' : 'outline'}
              onClick={() => setCategoryType('channels')}
            >
              Canais
            </Button>
          </CategoryTypeSelector>
          
          <CategoryButtonsContainer>
            {categoriesForSelectedType.map(genre => (
              <Button
                key={genre}
                variant="outline"
                size="small"
                onClick={() => handleCategoryClick(genre)}
              >
                {genre}
              </Button>
            ))}
          </CategoryButtonsContainer>
        </CategoryContainer>
        
        <SectionDivider />
        
        {/* Parent Series Section */}
        <PageSection className="page-section">
          {parentSeries.length > 0 && (
            <div className="media-row">
              <MediaRow 
                title="Séries Completas" 
                items={parentSeries.slice(0, 15)} 
                seeAllLink="/series"
                showMoreText="Ver Todas as Séries"
              />
            </div>
          )}
        </PageSection>
        
        {/* Movie sections by genre */}
        <PageSection className="page-section">
          {contentByType.movies?.length > 0 && (
            <div className="media-row">
              <MediaRow 
                title="Filmes Em Alta" 
                items={contentByType.movies.slice(0, 15)} 
                seeAllLink="/movies"
                showMoreText="Ver Todos os Filmes"
              />
            </div>
          )}
        </PageSection>
        
        <PageSection className="page-section">
          {movieGenres.map(genre => (
            <div key={genre.id} className="media-row">
              <MediaRow 
                title={`Filmes: ${genre.name}`} 
                items={genre.items.slice(0, 15)} 
                seeAllLink={`/movies/genre/${genre.name}`}
                showMoreText="Ver Mais"
              />
            </div>
          ))}
        </PageSection>
        
        {/* Series sections by genre */}
        <PageSection className="page-section">
          {contentByType.series?.length > 0 && (
            <div className="media-row">
              <MediaRow 
                title="Séries Populares" 
                items={contentByType.series.filter((item: MediaItem) => item.url && item.url !== '').slice(0, 15)} 
                seeAllLink="/series"
                showMoreText="Ver Todas as Séries"
              />
            </div>
          )}
        </PageSection>
        
        <PageSection className="page-section">
          {seriesGenres.map(genre => (
            <div key={genre.id} className="media-row">
              <MediaRow 
                title={`Séries: ${genre.name}`} 
                items={genre.items.slice(0, 15)} 
                seeAllLink={`/series/genre/${genre.name}`}
                showMoreText="Ver Mais"
              />
            </div>
          ))}
        </PageSection>
      </div>
    </HomeContainer>
  );
};

export default HomePage; 