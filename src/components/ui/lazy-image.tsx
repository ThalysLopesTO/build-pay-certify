import React, { useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { cn } from '@/lib/utils';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: string;
  threshold?: number;
  triggerOnce?: boolean;
  sizes?: string;
  srcSet?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  fallback,
  threshold = 0.1,
  triggerOnce = true,
  className,
  sizes,
  srcSet,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const { ref, inView } = useInView({
    threshold,
    triggerOnce,
  });

  const shouldLoad = inView;

  const handleLoad = () => setIsLoaded(true);
  const handleError = () => setHasError(true);

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)}>
      {/* Placeholder/Skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
          <div className="text-muted-foreground text-sm">Loading...</div>
        </div>
      )}
      
      {/* Main Image */}
      {shouldLoad && !hasError && (
        <img
          src={src}
          alt={alt}
          sizes={sizes}
          srcSet={srcSet}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0",
            className
          )}
          {...props}
        />
      )}
      
      {/* Fallback Image */}
      {hasError && fallback && (
        <img
          src={fallback}
          alt={alt}
          className={cn("transition-opacity duration-300", className)}
          {...props}
        />
      )}
      
      {/* Error State */}
      {hasError && !fallback && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <div className="text-muted-foreground text-sm">Failed to load</div>
        </div>
      )}
    </div>
  );
};

export const LazyAvatar: React.FC<LazyImageProps> = (props) => (
  <LazyImage
    {...props}
    className={cn("rounded-full w-10 h-10", props.className)}
    fallback="/placeholder-avatar.svg"
  />
);