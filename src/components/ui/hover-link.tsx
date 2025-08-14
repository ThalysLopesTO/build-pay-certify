import React from 'react';
import { Link, LinkProps } from 'react-router-dom';
import { usePrefetchRoute } from '@/hooks/usePrefetchRoute';

interface HoverLinkProps extends LinkProps {
  children: React.ReactNode;
  prefetchRoute?: string;
  className?: string;
}

export const HoverLink: React.FC<HoverLinkProps> = ({ 
  children, 
  prefetchRoute, 
  onMouseEnter,
  ...props 
}) => {
  const { prefetchRoute: prefetch } = usePrefetchRoute();

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Prefetch on hover
    if (prefetchRoute) {
      prefetch(prefetchRoute);
    }
    
    // Call original onMouseEnter if provided
    if (onMouseEnter) {
      onMouseEnter(e);
    }
  };

  return (
    <Link {...props} onMouseEnter={handleMouseEnter}>
      {children}
    </Link>
  );
};