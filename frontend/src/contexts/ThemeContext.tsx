import React, { createContext, useState, useEffect, ReactNode } from 'react';

interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

// Definição das cores do tema EDP
const darkThemeStyles = `
  :root.dark {
    --bg-primary: #070c14;
    --bg-secondary: #0c1220;
    --bg-tertiary: #111927;
    --bg-elevated: #172032;
    --border-subtle: #1f2c3f;
    --text-primary: #f3f4f6;
    --text-secondary: #b4c0d3;
    --accent-blue: #0073e6;
    --accent-blue-hover: #0086ff;
    --card-bg: linear-gradient(145deg, #0a1525, #131f32);
    --sidebar-bg: linear-gradient(180deg, #070c14 0%, #0c1525 100%);
    --header-bg: rgba(7, 12, 20, 0.8);
  }
`;

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Verificar preferência salva ou preferência do sistema
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Criar elemento de estilo para o tema escuro
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.setAttribute('id', 'edp-dark-theme');
    styleEl.textContent = darkThemeStyles;
    document.head.appendChild(styleEl);

    return () => {
      const existingStyle = document.getElementById('edp-dark-theme');
      if (existingStyle) document.head.removeChild(existingStyle);
    };
  }, []);

  // Aplicar classe ao document quando darkMode mudar
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');

      // Aplicar classe para estilos extras
      document.documentElement.classList.add('edp-dark-theme');

      // Sobrescrever cores do sistema
      document.documentElement.style.setProperty('color-scheme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.remove('edp-dark-theme');
      localStorage.setItem('theme', 'light');
      document.documentElement.style.setProperty('color-scheme', 'light');
    }
  }, [darkMode]);

  // Função para alternar entre modos
  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook personalizado para acessar o tema
export const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};