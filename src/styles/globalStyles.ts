import { createGlobalStyle } from 'styled-components';
import { Theme } from './theme';

const GlobalStyles = createGlobalStyle<{ theme: Theme }>`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  html {
    font-size: 16px;
    scroll-behavior: smooth;
  }
  
  body {
    font-family: ${({ theme }) => theme.fonts.primary};
    background-color: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.text};
    overflow-x: hidden;
    min-height: 100vh;
    line-height: 1.5;
  }
  
  h1, h2, h3, h4, h5, h6 {
    font-family: ${({ theme }) => theme.fonts.secondary};
    font-weight: 700;
    margin-bottom: ${({ theme }) => theme.spacing.md};
  }
  
  h1 {
    font-size: 2.5rem;
  }
  
  h2 {
    font-size: 2rem;
  }
  
  h3 {
    font-size: 1.75rem;
  }
  
  h4 {
    font-size: 1.5rem;
  }
  
  h5 {
    font-size: 1.25rem;
  }
  
  h6 {
    font-size: 1rem;
  }
  
  p {
    margin-bottom: ${({ theme }) => theme.spacing.md};
  }
  
  a {
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: none;
    transition: color ${({ theme }) => theme.transitions.fast};
    
    &:hover {
      color: ${({ theme }) => theme.colors.secondary};
    }
  }
  
  img {
    max-width: 100%;
    height: auto;
  }
  
  button, input, select, textarea {
    font-family: ${({ theme }) => theme.fonts.primary};
  }
  
  ul, ol {
    margin-left: ${({ theme }) => theme.spacing.lg};
    margin-bottom: ${({ theme }) => theme.spacing.md};
  }
  
  button {
    cursor: pointer;
  }
  
  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  ::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.backgroundDark};
  }
  
  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.textDark};
    border-radius: ${({ theme }) => theme.borderRadius.md};
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.colors.textSecondary};
  }
  
  /* Utility classes */
  .container {
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 ${({ theme }) => theme.spacing.md};
  }
  
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
  
  /* Animation classes for GSAP */
  .fadeIn {
    opacity: 0;
  }
  
  .slideUp {
    transform: translateY(30px);
    opacity: 0;
  }
  
  .slideDown {
    transform: translateY(-30px);
    opacity: 0;
  }
  
  .slideLeft {
    transform: translateX(30px);
    opacity: 0;
  }
  
  .slideRight {
    transform: translateX(-30px);
    opacity: 0;
  }
  
  .scale {
    transform: scale(0.8);
    opacity: 0;
  }
`;

export default GlobalStyles; 