import { useState, useEffect } from 'react';

// Detect PWA standalone synchronously for initial render
const getInitialPWAStandalone = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const isIOSStandalone = (window.navigator as any).standalone === true;
  const isDisplayStandalone = window.matchMedia?.('(display-mode: standalone)')?.matches ?? false;
  const isDisplayFullscreen = window.matchMedia?.('(display-mode: fullscreen)')?.matches ?? false;
  
  return isIOSStandalone || isDisplayStandalone || isDisplayFullscreen;
};

export const useIsPWAStandalone = () => {
  // Initialize with synchronous detection to avoid race condition
  const [isStandalone, setIsStandalone] = useState(getInitialPWAStandalone);

  useEffect(() => {
    // Re-check and listen for changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = () => {
      setIsStandalone(getInitialPWAStandalone());
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isStandalone;
};
