import React, { createContext, useState, useEffect, ReactNode } from 'react';

interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
  theme: ThemeColors;
}

// Interface para as cores do tema EDP
interface ThemeColors {
  // Cores principais
  bg: {
    primary: string;
    secondary: string;
    tertiary: string;
    elevated: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
  };
  border: {
    normal: string;
    subtle: string;
  };
  accent: {
    purple: string;
    green: string;
    blue: string;
    purpleHover: string;
    greenHover: string;
    blueHover: string;
  };
  status: {
    success: string;
    warning: string;
    error: string;
    info: string;
    successBg: string;
    warningBg: string;
    errorBg: string;
    infoBg: string;
  };
  input: {
    bg: string;
    border: string;
    placeholder: string;
    focus: string;
  };
}

// Definições específicas para tema claro
const lightTheme: ThemeColors = {
  bg: {
    primary: 'bg-white',
    secondary: 'bg-gray-50',
    tertiary: 'bg-gray-100',
    elevated: 'bg-white shadow-md',
  },
  text: {
    primary: 'text-gray-900',
    secondary: 'text-gray-700',
    muted: 'text-gray-500',
  },
  border: {
    normal: 'border-[#212E3C]', // Alterado de 'border-gray-200'
    subtle: 'border-[#CBD5E1]', // Alterado de 'border-gray-100'
  },
  accent: {
    purple: 'bg-edp-primary-purple',
    green: 'bg-edp-primary-green',
    blue: 'bg-edp-primary-blue',
    purpleHover: 'hover:bg-opacity-90',
    greenHover: 'hover:bg-opacity-90',
    blueHover: 'hover:bg-opacity-90',
  },
  status: {
    success: 'text-green-700',
    warning: 'text-yellow-700',
    error: 'text-red-700',
    info: 'text-blue-700',
    successBg: 'bg-green-100',
    warningBg: 'bg-yellow-100',
    errorBg: 'bg-red-100',
    infoBg: 'bg-blue-100',
  },
  input: {
    bg: 'bg-white',
    border: 'border-gray-300',
    placeholder: 'placeholder-gray-400',
    focus: 'focus:ring-edp-primary-blue focus:border-edp-primary-blue',
  },
};

// Definições específicas para tema escuro
const darkTheme: ThemeColors = {
  bg: {
    primary: 'bg-gray-900',
    secondary: 'bg-gray-800',
    tertiary: 'bg-gray-700',
    elevated: 'bg-gray-800 shadow-lg',
  },
  text: {
    primary: 'text-white',
    secondary: 'text-gray-300',
    muted: 'text-gray-400',
  },
  border: {
    normal: 'border-gray-700',
    subtle: 'border-gray-800',
  },
  accent: {
    purple: 'bg-edp-primary-purple',
    green: 'bg-edp-primary-green',
    blue: 'bg-edp-primary-blue',
    purpleHover: 'hover:bg-purple-800',
    greenHover: 'hover:bg-green-600',
    blueHover: 'hover:bg-blue-600',
  },
  status: {
    success: 'text-green-400',
    warning: 'text-yellow-400',
    error: 'text-red-400',
    info: 'text-blue-400',
    successBg: 'bg-green-900 bg-opacity-40',
    warningBg: 'bg-yellow-900 bg-opacity-40',
    errorBg: 'bg-red-900 bg-opacity-40',
    infoBg: 'bg-blue-900 bg-opacity-40',
  },
  input: {
    bg: 'bg-gray-700',
    border: 'border-gray-600',
    placeholder: 'placeholder-gray-400',
    focus: 'focus:ring-edp-primary-blue focus:border-edp-primary-blue',
  },
};

// Estilos CSS para injetar no HTML head
const darkModeStyles = `
:root.dark {
    --bg-primary: #070c14;
    --bg-secondary: #0c1220;
    --bg-tertiary: #111927;
    --bg-elevated: #172032;
    --border-subtle: #1f2c3f;
    --text-primary:rgb(246, 243, 244);
    --text-secondary: #b4c0d3;
    
    /* Cores oficiais da EDP */
    --edp-purple: #32127A;
    --edp-green: #A4D233;
    --edp-blue: #00ACEB;
    
    /* Variações para hover */
    --edp-purple-hover: #280F62;
    --edp-green-hover: #93BD2D;
    --edp-blue-hover: #009BD3;
    
    --card-bg: linear-gradient(145deg, #0a1525, #131f32);
    --sidebar-bg: linear-gradient(180deg, #070c14 0%, #0c1525 100%);
    --header-bg: rgba(7, 12, 20, 0.8);
  }
`;

export const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Verificar preferência salva ou preferência do sistema
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Determinar o tema atual baseado no modo escuro
  const theme = darkMode ? darkTheme : lightTheme;

  // Criar elemento de estilo para o tema escuro
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.setAttribute('id', 'edp-dark-theme');
    styleEl.textContent = darkModeStyles;
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
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode, theme }}>
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