import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';

interface HeaderProps {
  onSearch: (term: string) => void;
  searchTerm: string;
}

const HeaderContainer = styled.header<{ scrolled: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
  transition: background-color 0.3s ease;
  background-color: ${({ scrolled, theme }) => 
    scrolled ? theme.colors.background : 'transparent'};
  box-shadow: ${({ scrolled, theme }) => 
    scrolled ? theme.shadows.medium : 'none'};
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0) 100%);
    opacity: ${({ scrolled }) => (scrolled ? 0 : 1)};
    transition: opacity 0.3s ease;
    pointer-events: none;
  }
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.lg}`};
  max-width: 1400px;
  margin: 0 auto;
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  font-family: ${({ theme }) => theme.fonts.secondary};
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  
  span {
    color: ${({ theme }) => theme.colors.text};
  }
  
  &:hover {
    text-decoration: none;
  }
`;

const Navigation = styled.nav`
  display: flex;
  align-items: center;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: none;
  }
`;

const NavLink = styled(Link)<{ active?: boolean }>`
  color: ${({ theme, active }) => 
    active ? theme.colors.primary : theme.colors.text};
  font-weight: ${({ active }) => (active ? 600 : 400)};
  margin: 0 ${({ theme }) => theme.spacing.md};
  text-decoration: none;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 0;
    width: 100%;
    height: 2px;
    background-color: ${({ theme }) => theme.colors.primary};
    transform: scaleX(${({ active }) => (active ? 1 : 0)});
    transform-origin: left;
    transition: transform 0.3s ease;
  }
  
  &:hover::after {
    transform: scaleX(1);
  }
`;

const SearchContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const SearchButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.text};
  font-size: 1.2rem;
  cursor: pointer;
  margin-right: ${({ theme }) => theme.spacing.sm};
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const SearchInput = styled.input<{ expanded: boolean }>`
  background-color: rgba(0, 0, 0, 0.6);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: ${({ theme }) => theme.colors.text};
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  width: ${({ expanded }) => (expanded ? '200px' : '0')};
  opacity: ${({ expanded }) => (expanded ? 1 : 0)};
  transition: width 0.3s ease, opacity 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    width: ${({ expanded }) => (expanded ? '120px' : '0')};
  }
`;

const MobileMenuButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.text};
  font-size: 1.5rem;
  cursor: pointer;
  display: none;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    display: block;
  }
`;

const MobileMenu = styled.div<{ open: boolean }>`
  position: fixed;
  top: 0;
  right: 0;
  width: 70%;
  max-width: 300px;
  height: 100vh;
  background-color: ${({ theme }) => theme.colors.backgroundDark};
  z-index: 1001;
  transform: translateX(${({ open }) => (open ? '0' : '100%')});
  transition: transform 0.3s ease;
  box-shadow: ${({ theme }) => theme.shadows.large};
  display: flex;
  flex-direction: column;
  padding: ${({ theme }) => theme.spacing.xl};
  
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    display: none;
  }
`;

const MobileNavLink = styled(Link)<{ active?: boolean }>`
  color: ${({ theme, active }) => 
    active ? theme.colors.primary : theme.colors.text};
  font-size: 1.2rem;
  font-weight: ${({ active }) => (active ? 600 : 400)};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  text-decoration: none;
`;

const MobileMenuClose = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.text};
  font-size: 1.5rem;
  cursor: pointer;
  align-self: flex-end;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const MobileOverlay = styled.div<{ open: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  opacity: ${({ open }) => (open ? 1 : 0)};
  visibility: ${({ open }) => (open ? 'visible' : 'hidden')};
  transition: opacity 0.3s ease, visibility 0.3s ease;
`;

const Header: React.FC<HeaderProps> = ({ onSearch, searchTerm }) => {
  const [scrolled, setScrolled] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  // Animate header on mount
  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { y: -50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }
      );
    }
  }, []);
  
  // Handle search expansion
  const toggleSearch = () => {
    setSearchExpanded(!searchExpanded);
    if (!searchExpanded && searchInputRef.current) {
      // Focus the search input when expanded
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300);
    }
  };
  
  // Handle search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchInputRef.current?.value.trim() || '';
    
    if (term) {
      onSearch(term);
      // Redirecionar para a página de busca
      navigate(`/search?q=${encodeURIComponent(term)}`);
      
      // Fechar o menu mobile se estiver aberto
      if (mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    }
  };
  
  // Check if path is active
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };
  
  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    // Prevent body scroll when menu is open
    document.body.style.overflow = !mobileMenuOpen ? 'hidden' : '';
  };
  
  return (
    <HeaderContainer scrolled={scrolled} ref={headerRef}>
      <HeaderContent>
        <Logo to="/">
          Mega<span>FilmesTV</span>
        </Logo>
        
        <Navigation>
          <NavLink to="/" active={isActive('/')}>
            Home
          </NavLink>
          <NavLink to="/movies" active={isActive('/movies')}>
            Filmes
          </NavLink>
          <NavLink to="/series" active={isActive('/series')}>
            Séries
          </NavLink>
          <NavLink to="/channels" active={isActive('/channels')}>
            Canais
          </NavLink>
        </Navigation>
        
        <SearchContainer>
          <form onSubmit={handleSearchSubmit}>
            <SearchInput
              ref={searchInputRef}
              expanded={searchExpanded}
              placeholder="Buscar..."
              defaultValue={searchTerm}
              aria-label="Buscar"
            />
          </form>
          <SearchButton 
            onClick={toggleSearch}
            aria-label={searchExpanded ? "Fechar busca" : "Abrir busca"}
          >
            🔍
          </SearchButton>
        </SearchContainer>
        
        <MobileMenuButton 
          onClick={toggleMobileMenu}
          aria-label="Abrir menu"
        >
          ☰
        </MobileMenuButton>
      </HeaderContent>
      
      <MobileMenu open={mobileMenuOpen}>
        <MobileMenuClose 
          onClick={toggleMobileMenu}
          aria-label="Fechar menu"
        >
          ✕
        </MobileMenuClose>
        <MobileNavLink to="/" active={isActive('/')} onClick={toggleMobileMenu}>
          Home
        </MobileNavLink>
        <MobileNavLink to="/movies" active={isActive('/movies')} onClick={toggleMobileMenu}>
          Filmes
        </MobileNavLink>
        <MobileNavLink to="/series" active={isActive('/series')} onClick={toggleMobileMenu}>
          Séries
        </MobileNavLink>
        <MobileNavLink to="/channels" active={isActive('/channels')} onClick={toggleMobileMenu}>
          Canais
        </MobileNavLink>
        
        <form onSubmit={handleSearchSubmit} style={{ marginTop: 'auto' }}>
          <SearchInput
            expanded={true}
            placeholder="Buscar..."
            defaultValue={searchTerm}
            aria-label="Buscar no menu mobile"
            style={{ width: '100%' }}
          />
        </form>
      </MobileMenu>
      
      <MobileOverlay open={mobileMenuOpen} onClick={toggleMobileMenu} />
    </HeaderContainer>
  );
};

export default Header; 