import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import Button from '../ui/Button';

const FooterContainer = styled.footer`
  background-color: ${({ theme }) => theme.colors.backgroundDark};
  padding: ${({ theme }) => `${theme.spacing.xl} 0`};
  margin-top: ${({ theme }) => theme.spacing.xxl};
`;

const FooterContent = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing.lg};
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-gap: ${({ theme }) => theme.spacing.xl};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const FooterColumn = styled.div`
  display: flex;
  flex-direction: column;
`;

const FooterTitle = styled.h3`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 1.125rem;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  font-weight: 600;
`;

const FooterLink = styled(Link)`
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  text-decoration: none;
  transition: color 0.2s ease;
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const FooterExternalLink = styled.a`
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  text-decoration: none;
  transition: color 0.2s ease;
  display: flex;
  align-items: center;
  
  .icon {
    margin-right: ${({ theme }) => theme.spacing.xs};
  }
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const FooterText = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.875rem;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const FooterBottom = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  margin-top: ${({ theme }) => theme.spacing.xl};
  padding-top: ${({ theme }) => theme.spacing.lg};
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
  padding-left: ${({ theme }) => theme.spacing.lg};
  padding-right: ${({ theme }) => theme.spacing.lg};
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing.lg};
  }
`;

const Copyright = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.875rem;
`;

const ScrollToTopButton = styled.button<{ visible: boolean }>`
  position: fixed;
  bottom: ${({ theme }) => theme.spacing.xl};
  right: ${({ theme }) => theme.spacing.xl};
  width: 50px;
  height: 50px;
  border-radius: ${({ theme }) => theme.borderRadius.circle};
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.text};
  border: none;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: ${({ theme }) => theme.shadows.medium};
  transition: all 0.3s ease;
  opacity: ${({ visible }) => (visible ? 1 : 0)};
  visibility: ${({ visible }) => (visible ? 'visible' : 'hidden')};
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.secondary};
    transform: translateY(-5px);
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    width: 40px;
    height: 40px;
    font-size: 1.2rem;
    bottom: ${({ theme }) => theme.spacing.lg};
    right: ${({ theme }) => theme.spacing.lg};
  }
`;

const Footer: React.FC = () => {
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  // Handle scroll button visibility
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const threshold = 500;
      
      if (scrollY > threshold) {
        setShowScrollButton(true);
      } else {
        setShowScrollButton(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  // Scroll to top function
  const scrollToTop = () => {
    gsap.to(window, {
      scrollTo: { y: 0 },
      duration: 1,
      ease: "power3.inOut"
    });
  };
  
  const currentYear = new Date().getFullYear();
  
  return (
    <FooterContainer>
      <FooterContent>
        <FooterColumn>
          <FooterTitle>MegaFilmesTV</FooterTitle>
          <FooterText>
            Seu site de streaming de filmes, séries e canais de TV através de listas M3U.
          </FooterText>
          <FooterText>
            Fácil de usar, compatível com todos os dispositivos.
          </FooterText>
        </FooterColumn>
        
        <FooterColumn>
          <FooterTitle>Categorias</FooterTitle>
          <FooterLink to="/movies">Filmes</FooterLink>
          <FooterLink to="/series">Séries</FooterLink>
          <FooterLink to="/channels">Canais de TV</FooterLink>
        </FooterColumn>
        
        <FooterColumn>
          <FooterTitle>Links</FooterTitle>
          <FooterLink to="/">Início</FooterLink>
          <FooterLink to="/search">Busca</FooterLink>
          <FooterLink to="/about">Sobre Nós</FooterLink>
        </FooterColumn>
        
        <FooterColumn>
          <FooterTitle>Contato</FooterTitle>
          <FooterExternalLink href="mailto:weelzinhox22@gmail.com">
            <span className="icon">✉️</span> weelzinhox22@gmail.com
          </FooterExternalLink>
          <FooterExternalLink href="https://t.me/megafilmestv2" target="_blank" rel="noopener noreferrer">
            <span className="icon">📱</span> Telegram
          </FooterExternalLink>
        </FooterColumn>
      </FooterContent>
      
      <FooterBottom>
        <Copyright>
          © {currentYear} MegaFilmesTV. Todos os direitos reservados.
        </Copyright>
        
        <div>
          <Button variant="text" onClick={scrollToTop}>
            Voltar para o topo
          </Button>
        </div>
      </FooterBottom>
      
      <ScrollToTopButton 
        visible={showScrollButton}
        onClick={scrollToTop}
        aria-label="Voltar para o topo"
      >
        ↑
      </ScrollToTopButton>
    </FooterContainer>
  );
};

export default Footer; 