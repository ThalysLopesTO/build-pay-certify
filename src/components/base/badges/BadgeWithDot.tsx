import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 font-medium transition-colors',
  {
    variants: {
      type: {
        'pill-color': 'rounded-full border',
        'color': 'rounded-md border',
        'modern': 'rounded-md border border-border/50',
      },
      color: {
        gray: '',
        blue: '',
        orange: '',
        error: '',
        brand: '',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm',
      },
    },
    compoundVariants: [
      // Gray variants
      {
        type: 'pill-color',
        color: 'gray',
        className: 'bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-900/30 dark:border-gray-800 dark:text-gray-300',
      },
      {
        type: 'color',
        color: 'gray',
        className: 'bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-900/30 dark:border-gray-800 dark:text-gray-300',
      },
      {
        type: 'modern',
        color: 'gray',
        className: 'bg-muted/50 text-muted-foreground',
      },
      // Blue variants
      {
        type: 'pill-color',
        color: 'blue',
        className: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400',
      },
      {
        type: 'color',
        color: 'blue',
        className: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400',
      },
      {
        type: 'modern',
        color: 'blue',
        className: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400',
      },
      // Orange variants
      {
        type: 'pill-color',
        color: 'orange',
        className: 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950/30 dark:border-orange-800 dark:text-orange-400',
      },
      {
        type: 'color',
        color: 'orange',
        className: 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950/30 dark:border-orange-800 dark:text-orange-400',
      },
      {
        type: 'modern',
        color: 'orange',
        className: 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950/30 dark:border-orange-800 dark:text-orange-400',
      },
      // Error (red) variants
      {
        type: 'pill-color',
        color: 'error',
        className: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400',
      },
      {
        type: 'color',
        color: 'error',
        className: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400',
      },
      {
        type: 'modern',
        color: 'error',
        className: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400',
      },
      // Brand variants
      {
        type: 'pill-color',
        color: 'brand',
        className: 'bg-primary/10 border-primary/20 text-primary dark:bg-primary/20 dark:border-primary/30',
      },
      {
        type: 'color',
        color: 'brand',
        className: 'bg-primary/10 border-primary/20 text-primary dark:bg-primary/20 dark:border-primary/30',
      },
      {
        type: 'modern',
        color: 'brand',
        className: 'bg-primary/10 border-primary/20 text-primary dark:bg-primary/20 dark:border-primary/30',
      },
    ],
    defaultVariants: {
      type: 'pill-color',
      color: 'gray',
      size: 'sm',
    },
  }
);

const dotVariants = cva('w-1.5 h-1.5 rounded-full', {
  variants: {
    color: {
      gray: 'bg-gray-500 dark:bg-gray-400',
      blue: 'bg-blue-500',
      orange: 'bg-orange-500',
      error: 'bg-red-500',
      brand: 'bg-primary',
    },
  },
  defaultVariants: {
    color: 'gray',
  },
});

export interface BadgeWithDotProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'color'>,
    VariantProps<typeof badgeVariants> {
  showDot?: boolean;
}

export const BadgeWithDot = React.forwardRef<HTMLSpanElement, BadgeWithDotProps>(
  ({ className, type, color, size, showDot = true, children, ...props }, ref) => {
    const badgeColor = color || 'gray';
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ type, color: badgeColor as any, size }), className)}
        {...props}
      >
        {showDot && <span className={cn(dotVariants({ color: badgeColor as any }))} />}
        {children}
      </span>
    );
  }
);

BadgeWithDot.displayName = 'BadgeWithDot';
