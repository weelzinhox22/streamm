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
  font-size: 1.7rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  position: relative;
  letter-spacing: -0.5px;
  transition: transform 0.3s ease;
  
  span {
    color: ${({ theme }) => theme.colors.text};
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 2px;
      background: linear-gradient(90deg, transparent, ${({ theme }) => theme.colors.primary}, transparent);
      transform: scaleX(0);
      transform-origin: center;
      transition: transform 0.3s ease;
      opacity: 0.7;
    }
  }
  
  &:hover {
    text-decoration: none;
    transform: scale(1.03);
    
    span::after {
      transform: scaleX(1);
    }
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    font-size: 1.5rem;
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
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  transition: all 0.3s ease;
  
  svg {
    margin-right: 6px;
    font-size: 1.1rem;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 100%;
    height: 2px;
    background-color: ${({ theme }) => theme.colors.primary};
    transform: scaleX(${({ active }) => (active ? 1 : 0)});
    transform-origin: left;
    transition: transform 0.3s ease;
  }
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
    
    &::after {
      transform: scaleX(1);
    }
  }
`;

const SearchContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  margin-left: ${({ theme }) => theme.spacing.md};
`;

const SearchButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.text};
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  transition: all 0.3s ease;
  position: relative;
  z-index: 2;
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const SearchInput = styled.input<{ expanded: boolean }>`
  background-color: rgba(0, 0, 0, 0.6);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 20px;
  color: ${({ theme }) => theme.colors.text};
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.lg}`};
  width: ${({ expanded }) => (expanded ? '220px' : '0')};
  opacity: ${({ expanded }) => (expanded ? 1 : 0)};
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: absolute;
  right: 0;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px rgba(138, 43, 226, 0.3);
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    width: ${({ expanded }) => (expanded ? '150px' : '0')};
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
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  transition: all 0.3s ease;
  
  svg {
    margin-right: 10px;
    font-size: 1.2rem;
  }
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
    transform: translateX(5px);
  }
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
  
  // Icons for navigation
  const HomeIcon = () => (
    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L8 2.207l6.646 6.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-2a.5.5 0 0 0-.5.5v1.293L8.707 1.5Z"/>
      <path d="m8 3.293 6 6V13.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5V9.293l6-6Z"/>
    </svg>
  );

  const MovieIcon = () => (
    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M0 1a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V1zm4 0v6h8V1H4zm8 8H4v6h8V9zM1 1v2h2V1H1zm2 3H1v2h2V4zM1 7v2h2V7H1zm2 3H1v2h2v-2zm-2 3v2h2v-2H1zM15 1h-2v2h2V1zm-2 3v2h2V4h-2zm2 3h-2v2h2V7zm-2 3v2h2v-2h-2zm2 3h-2v2h2v-2z"/>
    </svg>
  );

  const SeriesIcon = () => (
    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M2.5 13.5A.5.5 0 0 1 3 13h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zM13.991 3l.024.001a1.46 1.46 0 0 1 .538.143.757.757 0 0 1 .302.254c.067.1.145.277.145.602v5.991l-.001.024a1.464 1.464 0 0 1-.143.538.758.758 0 0 1-.254.302c-.1.067-.277.145-.602.145H2.009l-.024-.001a1.464 1.464 0 0 1-.538-.143.758.758 0 0 1-.302-.254C1.078 10.502 1 10.325 1 10V4.009l.001-.024a1.46 1.46 0 0 1 .143-.538.758.758 0 0 1 .254-.302C1.498 3.078 1.675 3 2 3h11.991zM14 2H2C0 2 0 4 0 4v6c0 2 2 2 2 2h12c2 0 2-2 2-2V4c0-2-2-2-2-2z"/>
    </svg>
  );

  const ChannelIcon = () => (
    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M2.5 13.5A.5.5 0 0 1 3 13h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zM1 4.5a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13a.5.5 0 0 1-.5-.5zM3.5 3a.5.5 0 0 0 0 1H12a.5.5 0 0 0 0-1H3.5zM8 6.982C9.664 6.309 10.825 5.136 10.5 3 13.987 3.3 14.982 5.136 15 8c-.015 2.864-1.015 4.7-4.5 5-1.073-2.286-2.75-1.628-2.75-1.628s-1 .814-1.75 1.628c-3.485-.3-4.5-2.136-4.5-5 .173-2.864 1.015-4.7 4.5-5C5.18 5.136 6.336 6.3 8 6.982z"/>
    </svg>
  );

  // Add a search icon component after the navigation icons
  const SearchIcon = () => (
    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
    </svg>
  );
  
  return (
    <HeaderContainer scrolled={scrolled} ref={headerRef}>
      <HeaderContent>
        <Logo to="/">
          Mega<span>FilmesTV</span>
        </Logo>
        
        <Navigation>
          <NavLink to="/" active={isActive('/')}>
            <HomeIcon />Home
          </NavLink>
          <NavLink to="/movies" active={isActive('/movies')}>
            <MovieIcon />Filmes
          </NavLink>
          <NavLink to="/series" active={isActive('/series')}>
            <SeriesIcon />Séries
          </NavLink>
          <NavLink to="/channels" active={isActive('/channels')}>
            <ChannelIcon />Canais
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
            <SearchIcon />
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
        <MobileMenuClose onClick={toggleMobileMenu} aria-label="Fechar menu">
          ✖
        </MobileMenuClose>
        
        <MobileNavLink to="/" active={isActive('/')} onClick={toggleMobileMenu}>
          <HomeIcon />Home
        </MobileNavLink>
        <MobileNavLink to="/movies" active={isActive('/movies')} onClick={toggleMobileMenu}>
          <MovieIcon />Filmes
        </MobileNavLink>
        <MobileNavLink to="/series" active={isActive('/series')} onClick={toggleMobileMenu}>
          <SeriesIcon />Séries
        </MobileNavLink>
        <MobileNavLink to="/channels" active={isActive('/channels')} onClick={toggleMobileMenu}>
          <ChannelIcon />Canais
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