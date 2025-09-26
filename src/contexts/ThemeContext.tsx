import React, { createContext, useContext } from 'react';

interface ThemeContextType {
  colors: {
    background: string;
    surface: string;
    surfaceElevated: string;
    primary: string;
    secondary: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
    border: string;
    borderLight: string;
    shadow: string;
    glassBackground: string;
    glassBorder: string;
    glassGradient: string[];
    button: string;
    buttonText: string;
    error: string;
    success: string;
    warning: string;
    info: string;
    accent: string;
    accentLight: string;
    skeletonBackground: string;
    skeletonHighlight: string;
  };
}

const lightColors = {
  background: '#f8f9fa',
  surface: '#ffffff',
  surfaceElevated: '#ffffff',
  primary: '#007AFF',
  secondary: '#FFD700',
  text: '#1a1a1a',
  textSecondary: '#6c757d',
  textTertiary: '#adb5bd',
  border: '#e9ecef',
  borderLight: '#f1f3f4',
  shadow: '#000000',
  glassBackground: 'rgba(255, 255, 255, 0.25)',
  glassBorder: 'rgba(255, 255, 255, 0.3)',
  glassGradient: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'],
  button: '#007AFF',
  buttonText: '#ffffff',
  error: '#dc3545',
  success: '#28a745',
  warning: '#ffc107',
  info: '#17a2b8',
  accent: '#6f42c1',
  accentLight: '#e9ecef',
  skeletonBackground: '#f0f0f0',
  skeletonHighlight: '#e0e0e0',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value: ThemeContextType = {
    colors: lightColors,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};