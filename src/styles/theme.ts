const theme = {
  colors: {
    primary: '#e50914', // Netflix red
    secondary: '#b81d24',
    tertiary: '#221f1f',
    background: '#141414',
    backgroundLight: '#1f1f1f',
    backgroundDark: '#0b0b0b',
    text: '#ffffff',
    textSecondary: '#b3b3b3',
    textDark: '#666666',
    border: '#333333',
    success: '#46d369',
    warning: '#febd69',
    error: '#ff5252',
    maxPurple: '#7e11e9', // MAX purple accent
    maxBlue: '#4a2ed8',    // MAX blue accent
  },
  fonts: {
    primary: "'Roboto', sans-serif",
    secondary: "'Montserrat', sans-serif",
  },
  breakpoints: {
    xs: '320px',
    sm: '576px',
    md: '768px',
    lg: '992px',
    xl: '1200px',
    xxl: '1400px',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  borderRadius: {
    xs: '2px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    xxl: '24px',
    circle: '50%',
  },
  transitions: {
    fast: '0.2s ease',
    normal: '0.3s ease',
    slow: '0.5s ease',
  },
  shadows: {
    small: '0 2px 8px rgba(0, 0, 0, 0.15)',
    medium: '0 4px 12px rgba(0, 0, 0, 0.2)',
    large: '0 8px 24px rgba(0, 0, 0, 0.25)',
    hover: '0 8px 16px rgba(0, 0, 0, 0.3)',
    focus: '0 0 0 3px rgba(229, 9, 20, 0.4)',
  },
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
};

export type Theme = typeof theme;
export default theme; 