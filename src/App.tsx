import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import HomePage from './pages/HomePage';
import DetailPage from './pages/DetailPage';
import ContentListPage from './pages/ContentListPage';
import SearchPage from './pages/SearchPage';
import Layout from './components/layout/Layout';
import GlobalStyles from './styles/globalStyles';
import theme from './styles/theme';
import { ContentType } from './types';

// ScrollToTop component to reset scroll position on navigation
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// RouteWrapper component to handle search and pass it down to the Layout
const RouteWrapper: React.FC<{ element: React.ReactNode }> = ({ element }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');

  // Extract search term from URL on initial load
  useEffect(() => {
    if (location.pathname === '/search') {
      const params = new URLSearchParams(location.search);
      const query = params.get('q');
      if (query) {
        setSearchTerm(query);
      }
    }
  }, [location]);

  // Handle search submission
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.trim()) {
      navigate(`/search?q=${encodeURIComponent(term.trim())}`);
    }
  };

  return (
    <Layout onSearch={handleSearch} searchTerm={searchTerm}>
      {element}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles theme={theme} />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<RouteWrapper element={<HomePage />} />} />
          
          <Route path="/movies" element={<RouteWrapper element={<ContentListPage contentType="movie" />} />} />
          <Route path="/movies/genre/:genreName" element={<RouteWrapper element={<ContentListPage contentType="movie" />} />} />
          
          <Route path="/series" element={<RouteWrapper element={<ContentListPage contentType="series" />} />} />
          <Route path="/series/genre/:genreName" element={<RouteWrapper element={<ContentListPage contentType="series" />} />} />
          
          <Route path="/channels" element={<RouteWrapper element={<ContentListPage contentType="channel" />} />} />
          <Route path="/channels/genre/:genreName" element={<RouteWrapper element={<ContentListPage contentType="channel" />} />} />
          
          <Route path="/search" element={<RouteWrapper element={<SearchPage />} />} />
          
          <Route path="/movies/:id" element={<RouteWrapper element={<DetailPage />} />} />
          <Route path="/series/:id" element={<RouteWrapper element={<DetailPage />} />} />
          <Route path="/channels/:id" element={<RouteWrapper element={<DetailPage />} />} />
          
          {/* Fallback route */}
          <Route path="*" element={<RouteWrapper element={<HomePage />} />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
