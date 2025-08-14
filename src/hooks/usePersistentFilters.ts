import { useSearchParams } from 'react-router-dom';
import { useCallback, useEffect } from 'react';

interface FilterState {
  [key: string]: string | null;
}

export const usePersistentFilters = <T extends FilterState>(
  initialFilters: T,
  paramsMap?: { [K in keyof T]?: string }
) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize filters from URL on mount
  const initializeFromURL = useCallback(() => {
    const urlFilters = { ...initialFilters } as T;
    
    Object.keys(initialFilters).forEach((key) => {
      const paramKey = paramsMap?.[key] || key;
      const urlValue = searchParams.get(paramKey);
      if (urlValue) {
        (urlFilters as any)[key] = urlValue;
      }
    });
    
    return urlFilters;
  }, [initialFilters, paramsMap, searchParams]);

  // Update URL when filters change
  const updateFilters = useCallback((newFilters: Partial<T>) => {
    const params = new URLSearchParams(searchParams);
    
    Object.entries(newFilters).forEach(([key, value]) => {
      const paramKey = paramsMap?.[key] || key;
      
      if (value && value !== 'all' && value !== '') {
        params.set(paramKey, value);
      } else {
        params.delete(paramKey);
      }
    });
    
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams, paramsMap]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    const params = new URLSearchParams();
    
    // Keep non-filter params
    searchParams.forEach((value, key) => {
      const isFilterParam = Object.values(paramsMap || {}).includes(key) || 
                           Object.keys(initialFilters).includes(key);
      if (!isFilterParam) {
        params.set(key, value);
      }
    });
    
    setSearchParams(params, { replace: true });
  }, [initialFilters, paramsMap, searchParams, setSearchParams]);

  // Get current filter values from URL
  const getCurrentFilters = useCallback(() => {
    return initializeFromURL();
  }, [initializeFromURL]);

  return {
    updateFilters,
    clearFilters,
    getCurrentFilters,
    searchParams
  };
};
