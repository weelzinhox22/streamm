import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { gsap } from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import Header from './Header';
import Footer from './Footer';

// Register GSAP plugins
gsap.registerPlugin(ScrollToPlugin);

const LayoutContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const Main = styled.main`
  flex: 1;
  padding-top: 80px; // Space for fixed header
  padding-bottom: ${({ theme }) => theme.spacing.xl};
`;

const PageContent = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing.lg};
`;

interface LayoutProps {
  children: React.ReactNode;
  onSearch: (term: string) => void;
  searchTerm: string;
  fullWidth?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  onSearch, 
  searchTerm,
  fullWidth = false
}) => {
  const [isLoading, setIsLoading] = useState(true);
  
  // Simulating a loading effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Page transition effect
  useEffect(() => {
    if (!isLoading) {
      gsap.fromTo(
        '.page-content',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
      );
    }
  }, [isLoading]);
  
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  if (isLoading) {
    return (
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh', 
          backgroundColor: '#141414' 
        }}
      >
        <div 
          style={{ 
            color: '#e50914', 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            fontFamily: "'Montserrat', sans-serif" 
          }}
        >
          MegaFilmesTV
        </div>
      </div>
    );
  }
  
  return (
    <LayoutContainer>
      <Header onSearch={onSearch} searchTerm={searchTerm} />
      
      <Main>
        {fullWidth ? (
          <div className="page-content">
            {children}
          </div>
        ) : (
          <PageContent className="page-content">
            {children}
          </PageContent>
        )}
      </Main>
      
      <Footer />
    </LayoutContainer>
  );
};

export default Layout; 