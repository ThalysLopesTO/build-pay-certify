import { useEffect } from 'react';

export const useScrollToActiveSection = (activeTab: string) => {
  useEffect(() => {
    // Small delay to ensure DOM is updated after navigation
    const timer = setTimeout(() => {
      const activeElement = document.querySelector(`[data-sidebar-item="${activeTab}"]`);
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [activeTab]);
};