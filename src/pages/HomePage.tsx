import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { gsap } from 'gsap';
import { useNavigate } from 'react-router-dom';
import Hero from '../components/ui/Hero';
import MediaRow from '../components/ui/MediaRow';
import Button from '../components/ui/Button';
import { useM3UData } from '../hooks/useM3UData';
import { MediaItem } from '../types';

const HomeContainer = styled.div`
  padding-bottom: ${({ theme }) => theme.spacing.xxl};
`;

const CategoryContainer = styled.div`
  margin: ${({ theme }) => `${theme.spacing.xl} 0`};
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.backgroundLight};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  box-shadow: ${({ theme }) => theme.shadows.small};
`;

const CategoryTitle = styled.h2`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  font-size: 1.5rem;
`;

const CategoryButtonsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const CategoryTypeSelector = styled.div`
  display: flex;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  
  button {
    margin-right: ${({ theme }) => theme.spacing.sm};
  }
`;

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [categoryType, setCategoryType] = useState<'movies' | 'series' | 'channels'>('movies');
  
  const { 
    featured, 
    contentByType,
    contentByGenre,
    loading, 
    error 
  } = useM3UData();
  
  // Initialize animations
  useEffect(() => {
    if (!loading) {
      // Stagger animation for media rows
      gsap.fromTo(
        '.media-row',
        { y: 50, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          stagger: 0.15, 
          duration: 0.8, 
          ease: "power3.out",
          delay: 0.3
        }
      );
    }
  }, [loading]);
  
  // Show loading state
  if (loading) {
    return (
      <HomeContainer>
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <h2>Carregando conteúdo...</h2>
        </div>
      </HomeContainer>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <HomeContainer>
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <h2>Erro ao carregar o conteúdo</h2>
          <p>Não foi possível carregar a lista M3U. Por favor, tente novamente mais tarde.</p>
        </div>
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
      {/* Hero section */}
      {heroItems.length > 0 && <Hero items={heroItems} />}
      
      {/* Category selector */}
      <CategoryContainer>
        <CategoryTitle>Categorias</CategoryTitle>
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
      
      {/* Featured content sections */}
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
      
      {/* Parent Series Section */}
      {parentSeries.length > 0 && (
        <div className="media-row">
          <MediaRow 
            title="Séries Completas" 
            items={parentSeries.slice(0, 15)} 
            seeAllLink="/series"
          />
        </div>
      )}
      
      {/* Movie sections by genre */}
      {contentByType.movies?.length > 0 && (
        <div className="media-row">
          <MediaRow 
            title="Filmes" 
            items={contentByType.movies.slice(0, 15)} 
            seeAllLink="/movies"
          />
        </div>
      )}
      
      {movieGenres.map(genre => (
        <div key={genre.id} className="media-row">
          <MediaRow 
            title={`Filmes: ${genre.name}`} 
            items={genre.items.slice(0, 15)} 
            seeAllLink={`/movies/genre/${genre.name}`}
          />
        </div>
      ))}
      
      {/* Series sections by genre */}
      {contentByType.series?.length > 0 && (
        <div className="media-row">
          <MediaRow 
            title="Séries" 
            items={contentByType.series.filter((item: MediaItem) => item.url && item.url !== '').slice(0, 15)} 
            seeAllLink="/series"
          />
        </div>
      )}
      
      {seriesGenres.map(genre => (
        <div key={genre.id} className="media-row">
          <MediaRow 
            title={`Séries: ${genre.name}`} 
            items={genre.items.slice(0, 15)} 
            seeAllLink={`/series/genre/${genre.name}`}
          />
        </div>
      ))}
      
      {/* Channels section */}
      {contentByType.channels?.length > 0 && (
        <div className="media-row">
          <MediaRow 
            title="Canais" 
            items={contentByType.channels.slice(0, 15)} 
            seeAllLink="/channels"
          />
        </div>
      )}
    </HomeContainer>
  );
};

export default HomePage; 