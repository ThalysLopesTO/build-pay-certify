import { useState, useRef } from 'react';
import { motion, useMotionValue, PanInfo } from 'framer-motion';
import { CheckCircle2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SwipeableTaskItemProps {
  children: React.ReactNode;
  onComplete: () => void;
  onDelete: () => void;
  disabled?: boolean;
  taskStatus?: string;
}

export function SwipeableTaskItem({
  children,
  onComplete,
  onDelete,
  disabled = false,
  taskStatus,
}: SwipeableTaskItemProps) {
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const x = useMotionValue(0);
  const isDraggingRef = useRef(false);

  const SWIPE_THRESHOLD = 100;
  const MAX_SWIPE = 150;

  const handleDragStart = () => {
    isDraggingRef.current = true;
  };

  const handleDrag = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const dragX = info.offset.x;
    
    // Determine swipe direction
    if (dragX > 10) {
      setSwipeDirection('right');
    } else if (dragX < -10) {
      setSwipeDirection('left');
    } else {
      setSwipeDirection(null);
    }
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const dragX = info.offset.x;
    
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 100);
    
    if (dragX > SWIPE_THRESHOLD && taskStatus !== 'done') {
      // Trigger complete action
      onComplete();
    } else if (dragX < -SWIPE_THRESHOLD) {
      // Trigger delete action
      onDelete();
    }
    
    // Always animate back to center
    x.set(0);
    setSwipeDirection(null);
  };

  if (disabled) {
    return <>{children}</>;
  }

  const progress = Math.min(Math.abs(x.get()) / SWIPE_THRESHOLD, 1);

  return (
    <div className="relative overflow-hidden">
      {/* Complete Button (Left Side - Revealed on Right Swipe) */}
      <motion.div
        className={cn(
          'absolute left-0 top-0 bottom-0 flex items-center justify-start pl-6 bg-green-500',
          'transition-opacity duration-200'
        )}
        style={{
          width: '100%',
          opacity: swipeDirection === 'right' && taskStatus !== 'done' ? Math.min(progress * 1.5, 1) : 0,
        }}
      >
        <CheckCircle2 className="w-6 h-6 text-white" />
        <span className="ml-2 text-white font-medium">Complete</span>
      </motion.div>

      {/* Delete Button (Right Side - Revealed on Left Swipe) */}
      <motion.div
        className={cn(
          'absolute right-0 top-0 bottom-0 flex items-center justify-end pr-6 bg-destructive',
          'transition-opacity duration-200'
        )}
        style={{
          width: '100%',
          opacity: swipeDirection === 'left' ? Math.min(progress * 1.5, 1) : 0,
        }}
      >
        <span className="mr-2 text-white font-medium">Delete</span>
        <Trash2 className="w-6 h-6 text-white" />
      </motion.div>

      {/* Task Content (Draggable Layer) */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -MAX_SWIPE, right: MAX_SWIPE }}
        dragElastic={0.2}
        style={{ x }}
        className="relative bg-background touch-pan-y"
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        onClick={(e) => {
          // Prevent click events if we just finished dragging
          if (isDraggingRef.current) {
            e.stopPropagation();
          }
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
