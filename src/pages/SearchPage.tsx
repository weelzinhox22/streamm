import React, { useEffect, useState, useMemo } from 'react';
import styled from 'styled-components';
import { useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import MediaCard from '../components/ui/MediaCard';
import Button from '../components/ui/Button';
import { useM3UData } from '../hooks/useM3UData';
import { ContentType } from '../types';

const Container = styled.div`
  padding: ${({ theme }) => `${theme.spacing.xl} 0`};
`;

const Header = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const Title = styled.h1`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  font-size: 2.5rem;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    font-size: 2rem;
  }
`;

const SearchResult = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const SearchTerm = styled.span`
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 500;
`;

const FiltersContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
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

const SearchPage: React.FC = () => {
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedType, setSelectedType] = useState<ContentType | 'all'>('all');
  const [term, setTerm] = useState<string>('');
  
  const { 
    items,
    searchTerm, 
    setSearchTerm,
    getPaginatedItems, 
    getTotalPages,
    loading, 
    error 
  } = useM3UData();
  
  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedType, searchTerm]);
  
  // Initialize animations
  useEffect(() => {
    if (!loading) {
      gsap.fromTo(
        '.search-results',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" }
      );
    }
  }, [loading, currentPage, selectedType]);
  
  // Get search query from URL and update the search term
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('q');
    if (query) {
      setTerm(query);
      setSearchTerm(query);
    }
  }, [location.search, setSearchTerm]);
  
  // Filtragem manual dos itens com base no termo de pesquisa
  const filteredBySearch = useMemo(() => {
    if (!term.trim()) return [];
    
    const lowerTerm = term.toLowerCase();
    return items.filter(item => {
      return (
        (item.name && item.name.toLowerCase().includes(lowerTerm)) ||
        (item.tvgName && item.tvgName.toLowerCase().includes(lowerTerm)) ||
        (item.genre && item.genre.toLowerCase().includes(lowerTerm)) ||
        (item.group && item.group.toLowerCase().includes(lowerTerm))
      );
    });
  }, [items, term]);
  
  // Filter items by selected type
  const getFilteredByType = () => {
    if (selectedType === 'all') {
      return filteredBySearch;
    }
    return filteredBySearch.filter(item => item.type === selectedType);
  };
  
  // Show loading state
  if (loading) {
    return (
      <Container>
        <Header>
          <Title>Resultados da busca</Title>
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
          <Title>Resultados da busca</Title>
        </Header>
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <h2>Erro ao carregar o conteúdo</h2>
          <p>Não foi possível carregar os resultados. Por favor, tente novamente mais tarde.</p>
        </div>
      </Container>
    );
  }
  
  const filteredByType = getFilteredByType();
  const totalPages = getTotalPages(filteredByType);
  const currentItems = getPaginatedItems(filteredByType, currentPage);
  
  // Handle type filter click
  const handleTypeClick = (type: ContentType | 'all') => {
    setSelectedType(type);
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
        <Title>Resultados da busca</Title>
        {searchTerm && (
          <SearchResult>
            {filteredBySearch.length} resultados para: <SearchTerm>"{term}"</SearchTerm>
          </SearchResult>
        )}
        
        <FiltersContainer>
          <Button 
            variant={selectedType === 'all' ? 'primary' : 'outline'}
            size="small"
            onClick={() => handleTypeClick('all')}
          >
            Todos
          </Button>
          
          <Button 
            variant={selectedType === 'movie' ? 'primary' : 'outline'}
            size="small"
            onClick={() => handleTypeClick('movie')}
          >
            Filmes
          </Button>
          
          <Button 
            variant={selectedType === 'series' ? 'primary' : 'outline'}
            size="small"
            onClick={() => handleTypeClick('series')}
          >
            Séries
          </Button>
          
          <Button 
            variant={selectedType === 'channel' ? 'primary' : 'outline'}
            size="small"
            onClick={() => handleTypeClick('channel')}
          >
            Canais
          </Button>
        </FiltersContainer>
      </Header>
      
      <div className="search-results">
        {currentItems.length > 0 ? (
          <>
            <Grid>
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
            <h3>Nenhum resultado encontrado</h3>
            <p>
              Não encontramos nenhum conteúdo que corresponda à sua busca. 
              Por favor, tente termos diferentes ou remova os filtros.
            </p>
          </EmptyState>
        )}
      </div>
    </Container>
  );
};

export default SearchPage; 