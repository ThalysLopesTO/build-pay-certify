import React, { useCallback, useEffect, useState, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MobileChartWrapperProps {
  children: React.ReactNode[];
  titles: string[];
  className?: string;
}

export const MobileChartWrapper: React.FC<MobileChartWrapperProps> = ({
  children,
  titles,
  className
}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: false,
    align: 'start',
    containScroll: 'trimSnaps'
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [scale, setScale] = useState(1);
  const [isPinching, setIsPinching] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const initialDistanceRef = useRef<number>(0);
  const initialScaleRef = useRef<number>(1);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  // Pinch-to-zoom handlers
  const getDistance = (touches: React.TouchList) => {
    const touch1 = touches[0];
    const touch2 = touches[1];
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      setIsPinching(true);
      initialDistanceRef.current = getDistance(e.touches);
      initialScaleRef.current = scale;
      e.preventDefault();
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isPinching && e.touches.length === 2) {
      const currentDistance = getDistance(e.touches);
      const scaleChange = currentDistance / initialDistanceRef.current;
      const newScale = Math.min(Math.max(initialScaleRef.current * scaleChange, 0.8), 2.5);
      setScale(newScale);
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      setIsPinching(false);
    }
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 2.5));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.8));
  };

  const resetZoom = () => {
    setScale(1);
  };

  return (
    <div className={cn("relative", className)}>
      {/* Chart Navigation Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-slate-700 min-w-[140px] text-center">
            {titles[selectedIndex]}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={scrollNext}
            disabled={!canScrollNext}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={zoomOut}
            disabled={scale <= 0.8}
            className="h-8 w-8 p-0"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <button
            onClick={resetZoom}
            className="text-xs font-medium text-slate-600 px-2 hover:text-primary transition-colors"
          >
            {Math.round(scale * 100)}%
          </button>
          <Button
            variant="outline"
            size="sm"
            onClick={zoomIn}
            disabled={scale >= 2.5}
            className="h-8 w-8 p-0"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Dot Indicators */}
      <div className="flex justify-center gap-1.5 mb-3">
        {children.map((_, index) => (
          <button
            key={index}
            onClick={() => emblaApi?.scrollTo(index)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              index === selectedIndex
                ? "w-6 bg-primary"
                : "w-1.5 bg-slate-300 hover:bg-slate-400"
            )}
            aria-label={`Go to ${titles[index]}`}
          />
        ))}
      </div>

      {/* Swipeable Chart Container */}
      <div 
        className="overflow-hidden" 
        ref={emblaRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex touch-pan-y">
          {children.map((child, index) => (
            <div
              key={index}
              className="flex-[0_0_100%] min-w-0 px-1"
              ref={index === selectedIndex ? chartRef : null}
            >
              <div
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: 'center center',
                  transition: isPinching ? 'none' : 'transform 0.2s ease-out',
                }}
                className="w-full"
              >
                {child}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Touch Interaction Hint (shows briefly on first render) */}
      {scale === 1 && selectedIndex === 0 && (
        <div className="mt-2 text-center">
          <p className="text-xs text-slate-500 animate-pulse">
            Swipe to view charts • Pinch to zoom
          </p>
        </div>
      )}
    </div>
  );
};
