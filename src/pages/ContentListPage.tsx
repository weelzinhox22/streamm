import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { gsap } from 'gsap';
import { useParams, useNavigate } from 'react-router-dom';
import MediaCard from '../components/ui/MediaCard';
import Button from '../components/ui/Button';
import { useM3UData } from '../hooks/useM3UData';
import { ContentType, MediaItem } from '../types';

interface ContentListPageProps {
  contentType: ContentType;
}

const Container = styled.div`
  padding: ${({ theme }) => `${theme.spacing.xl} 0`};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const Title = styled.h1`
  margin: 0;
  font-size: 2.5rem;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: 2rem;
  }
`;

const CategoryName = styled.span`
  color: ${({ theme }) => theme.colors.primary};
`;

const FiltersContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  grid-gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: ${({ theme }) => theme.spacing.xl};
  gap: ${({ theme }) => theme.spacing.md};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-wrap: wrap;
  }
`;

const PageInfo = styled.div`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xxl} 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  
  h3 {
    margin-bottom: ${({ theme }) => theme.spacing.md};
  }
`;

const ContentListPage: React.FC<ContentListPageProps> = ({ contentType }) => {
  const { genreName } = useParams<{ genreName?: string }>();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(genreName || null);
  
  const { 
    contentByType,
    contentByGenre,
    getPaginatedItems,
    getTotalPages,
    loading,
    error 
  } = useM3UData();
  
  // Reset page when contentType or selectedGenre changes
  useEffect(() => {
    setCurrentPage(1);
  }, [contentType, selectedGenre]);
  
  // Update URL when genre changes
  useEffect(() => {
    if (selectedGenre && selectedGenre !== genreName) {
      navigate(`/${contentType}s/genre/${selectedGenre}`);
    } else if (!selectedGenre && genreName) {
      navigate(`/${contentType}s`);
    }
  }, [selectedGenre, genreName, contentType, navigate]);
  
  // Initialize animations
  useEffect(() => {
    if (!loading) {
      gsap.fromTo(
        '.content-grid',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" }
      );
    }
  }, [loading, currentPage, selectedGenre]);
  
  // Get the content
  const getCurrentContent = (): MediaItem[] => {
    if (selectedGenre) {
      // Get content directly from contentByGenre if genre is selected
      const typeKey = contentType === 'movie' ? 'movies' : 
                       contentType === 'series' ? 'series' : 'channels';
      
      return contentByGenre[typeKey]?.[selectedGenre] || [];
    }
    
    // Otherwise return all content of the specified type
    const typeKey = contentType === 'movie' ? 'movies' : 
                    contentType === 'series' ? 'series' : 'channels';
    return contentByType[typeKey] || [];
  };
  
  // Get relevant genres for the selected content type
  const getRelevantGenres = (): { id: string; name: string }[] => {
    const typeKey = contentType === 'movie' ? 'movies' : 
                    contentType === 'series' ? 'series' : 'channels';
    
    console.log("Content type:", contentType);
    console.log("Type key:", typeKey);
    console.log("contentByGenre:", contentByGenre);
    console.log("contentByGenre[typeKey]:", contentByGenre[typeKey]);
    
    if (!contentByGenre[typeKey]) return [];
    
    const genres = Object.keys(contentByGenre[typeKey]).map(genreName => ({
      id: `genre-${contentType}-${genreName}`,
      name: genreName
    }));
    
    console.log("Genres found:", genres);
    return genres;
  };
  
  // Show loading state
  if (loading) {
    return (
      <Container>
        <Header>
          <Title>
            {contentType === 'movie' ? 'Filmes' : 
             contentType === 'series' ? 'Séries' : 'Canais'}
          </Title>
        </Header>
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <h2>Carregando conteúdo...</h2>
        </div>
      </Container>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <Container>
        <Header>
          <Title>
            {contentType === 'movie' ? 'Filmes' : 
             contentType === 'series' ? 'Séries' : 'Canais'}
          </Title>
        </Header>
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <h2>Erro ao carregar o conteúdo</h2>
          <p>Não foi possível carregar a lista M3U. Por favor, tente novamente mais tarde.</p>
        </div>
      </Container>
    );
  }
  
  const content = getCurrentContent();
  const relevantGenres = getRelevantGenres();
  const totalPages = getTotalPages(content);
  const currentItems = getPaginatedItems(content, currentPage);
  
  const title = 
    contentType === 'movie' ? 'Filmes' : 
    contentType === 'series' ? 'Séries' : 'Canais';
  
  // Handle genre filter click
  const handleGenreClick = (genreName: string) => {
    if (selectedGenre === genreName) {
      setSelectedGenre(null);
    } else {
      setSelectedGenre(genreName);
    }
    setCurrentPage(1);
  };
  
  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to top when changing page
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  return (
    <Container>
      <Header>
        <Title>
          {title}
          {selectedGenre && (
            <>: <CategoryName>{selectedGenre}</CategoryName></>
          )}
        </Title>
        
        <FiltersContainer>
          <Button 
            variant={!selectedGenre ? 'primary' : 'outline'}
            size="small"
            onClick={() => setSelectedGenre(null)}
          >
            Todos
          </Button>
          
          {relevantGenres.map(genre => (
            <Button
              key={genre.id}
              variant={selectedGenre === genre.name ? 'primary' : 'outline'}
              size="small"
              onClick={() => handleGenreClick(genre.name)}
            >
              {genre.name}
            </Button>
          ))}
        </FiltersContainer>
      </Header>
      
      {content.length > 0 ? (
        <>
          <Grid className="content-grid">
            {currentItems.map(item => (
              <MediaCard key={item.id} item={item} />
            ))}
          </Grid>
          
          {totalPages > 1 && (
            <Pagination>
              <Button
                variant="outline"
                size="small"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
              >
                Primeira
              </Button>
              
              <Button
                variant="outline"
                size="small"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              
              <PageInfo>
                Página {currentPage} de {totalPages}
              </PageInfo>
              
              <Button
                variant="outline"
                size="small"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
              
              <Button
                variant="outline"
                size="small"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
              >
                Última
              </Button>
            </Pagination>
          )}
        </>
      ) : (
        <EmptyState>
          <h3>Nenhum conteúdo encontrado</h3>
          <p>
            Não encontramos nenhum {
              contentType === 'movie' ? 'filme' : 
              contentType === 'series' ? 'série' : 'canal'
            } {selectedGenre && `na categoria ${selectedGenre}`}.
          </p>
          {selectedGenre && (
            <Button 
              variant="outline" 
              onClick={() => setSelectedGenre(null)}
            >
              Ver todos os {
                contentType === 'movie' ? 'filmes' : 
                contentType === 'series' ? 'séries' : 'canais'
              }
            </Button>
          )}
        </EmptyState>
      )}
    </Container>
  );
};

export default ContentListPage; 