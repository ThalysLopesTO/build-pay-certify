import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OptimisticButtonProps extends React.ComponentProps<typeof Button> {
  onOptimisticAction?: () => void;
  optimisticContent?: React.ReactNode;
  originalContent?: React.ReactNode;
  isLoading?: boolean;
}

export const OptimisticButton: React.FC<OptimisticButtonProps> = ({
  onOptimisticAction,
  optimisticContent,
  originalContent,
  isLoading = false,
  onClick,
  children,
  className,
  disabled,
  ...props
}) => {
  const [showOptimistic, setShowOptimistic] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onOptimisticAction) {
      setShowOptimistic(true);
      onOptimisticAction();
      
      // Reset optimistic state after a delay
      setTimeout(() => setShowOptimistic(false), 2000);
    }
    
    if (onClick) {
      onClick(e);
    }
  };

  const content = showOptimistic && optimisticContent 
    ? optimisticContent 
    : originalContent || children;

  return (
    <Button
      {...props}
      className={cn(
        showOptimistic && "bg-green-500 hover:bg-green-600 text-white",
        className
      )}
      disabled={disabled || isLoading}
      onClick={handleClick}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : (
        content
      )}
    </Button>
  );
};