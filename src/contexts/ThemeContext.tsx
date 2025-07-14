import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'light' | 'dark'; // The actual theme being applied (resolved from system if needed)
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme initialization - runs before React renders
const initializeTheme = () => {
  const stored = localStorage.getItem('theme') as Theme | null;
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  let theme: Theme = stored || 'light';
  let actualTheme: 'light' | 'dark';
  
  if (theme === 'system') {
    actualTheme = systemPrefersDark ? 'dark' : 'light';
  } else {
    actualTheme = theme;
  }
  
  // Apply theme immediately to prevent flash
  const html = document.documentElement;
  if (actualTheme === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
  
  return { theme, actualTheme };
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeState, setThemeState] = useState<{ theme: Theme; actualTheme: 'light' | 'dark' }>(() => 
    initializeTheme()
  );

  const setTheme = (newTheme: Theme) => {
    const html = document.documentElement;
    let actualTheme: 'light' | 'dark';
    
    if (newTheme === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      actualTheme = systemPrefersDark ? 'dark' : 'light';
      localStorage.removeItem('theme'); // Clear stored preference for system default
    } else {
      actualTheme = newTheme;
      localStorage.setItem('theme', newTheme);
    }
    
    // Apply theme class with smooth transition
    html.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    
    if (actualTheme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    
    // Remove transition after applying
    setTimeout(() => {
      html.style.transition = '';
    }, 300);
    
    setThemeState({ theme: newTheme, actualTheme });
  };

  // Listen for system theme changes when theme is set to 'system'
  useEffect(() => {
    if (themeState.theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const newActualTheme = e.matches ? 'dark' : 'light';
      const html = document.documentElement;
      
      if (newActualTheme === 'dark') {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
      
      setThemeState(prev => ({ ...prev, actualTheme: newActualTheme }));
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeState.theme]);

  return (
    <ThemeContext.Provider value={{
      theme: themeState.theme,
      setTheme,
      actualTheme: themeState.actualTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};