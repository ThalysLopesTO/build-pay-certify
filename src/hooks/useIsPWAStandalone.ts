import { useState, useEffect } from 'react';

export const useIsPWAStandalone = () => {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check multiple methods for PWA standalone detection
    const isIOSStandalone = (window.navigator as any).standalone === true;
    const isDisplayStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isDisplayFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
    
    setIsStandalone(isIOSStandalone || isDisplayStandalone || isDisplayFullscreen);

    // Listen for changes in display mode
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches || (window.navigator as any).standalone === true);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isStandalone;
};
