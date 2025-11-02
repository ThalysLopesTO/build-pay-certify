import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 font-medium transition-all duration-200',
  {
    variants: {
      type: {
        'pill-color': 'rounded-full border shadow-sm hover:shadow-md',
        'color': 'rounded-md border shadow-sm hover:shadow-md',
        'modern': 'rounded-lg border shadow-sm hover:shadow-md hover:scale-105',
      },
      color: {
        gray: '',
        blue: '',
        orange: '',
        error: '',
        brand: '',
      },
      size: {
        sm: 'px-2.5 py-1 text-xs',
        md: 'px-3 py-1.5 text-sm',
      },
    },
    compoundVariants: [
      // Gray variants - using semantic tokens
      {
        type: 'pill-color',
        color: 'gray',
        className: 'bg-[hsl(var(--priority-low))] border-[hsl(var(--priority-low-border))] text-[hsl(var(--priority-low-foreground))]',
      },
      {
        type: 'color',
        color: 'gray',
        className: 'bg-[hsl(var(--priority-low))] border-[hsl(var(--priority-low-border))] text-[hsl(var(--priority-low-foreground))]',
      },
      {
        type: 'modern',
        color: 'gray',
        className: 'bg-[hsl(var(--tag-bg))] text-[hsl(var(--tag-foreground))] border-[hsl(var(--tag-border))]',
      },
      // Blue variants - using semantic tokens
      {
        type: 'pill-color',
        color: 'blue',
        className: 'bg-[hsl(var(--priority-medium))] border-[hsl(var(--priority-medium-border))] text-[hsl(var(--priority-medium-foreground))]',
      },
      {
        type: 'color',
        color: 'blue',
        className: 'bg-[hsl(var(--priority-medium))] border-[hsl(var(--priority-medium-border))] text-[hsl(var(--priority-medium-foreground))]',
      },
      {
        type: 'modern',
        color: 'blue',
        className: 'bg-[hsl(var(--priority-medium))] border-[hsl(var(--priority-medium-border))] text-[hsl(var(--priority-medium-foreground))]',
      },
      // Orange variants - using semantic tokens
      {
        type: 'pill-color',
        color: 'orange',
        className: 'bg-[hsl(var(--priority-high))] border-[hsl(var(--priority-high-border))] text-[hsl(var(--priority-high-foreground))]',
      },
      {
        type: 'color',
        color: 'orange',
        className: 'bg-[hsl(var(--priority-high))] border-[hsl(var(--priority-high-border))] text-[hsl(var(--priority-high-foreground))]',
      },
      {
        type: 'modern',
        color: 'orange',
        className: 'bg-[hsl(var(--priority-high))] border-[hsl(var(--priority-high-border))] text-[hsl(var(--priority-high-foreground))]',
      },
      // Error (red) variants - using semantic tokens
      {
        type: 'pill-color',
        color: 'error',
        className: 'bg-[hsl(var(--priority-urgent))] border-[hsl(var(--priority-urgent-border))] text-[hsl(var(--priority-urgent-foreground))]',
      },
      {
        type: 'color',
        color: 'error',
        className: 'bg-[hsl(var(--priority-urgent))] border-[hsl(var(--priority-urgent-border))] text-[hsl(var(--priority-urgent-foreground))]',
      },
      {
        type: 'modern',
        color: 'error',
        className: 'bg-[hsl(var(--priority-urgent))] border-[hsl(var(--priority-urgent-border))] text-[hsl(var(--priority-urgent-foreground))]',
      },
      // Brand variants
      {
        type: 'pill-color',
        color: 'brand',
        className: 'bg-primary/10 border-primary/20 text-primary',
      },
      {
        type: 'color',
        color: 'brand',
        className: 'bg-primary/10 border-primary/20 text-primary',
      },
      {
        type: 'modern',
        color: 'brand',
        className: 'bg-primary/10 border-primary/20 text-primary',
      },
    ],
    defaultVariants: {
      type: 'pill-color',
      color: 'gray',
      size: 'sm',
    },
  }
);

const dotVariants = cva('w-2 h-2 rounded-full shadow-sm', {
  variants: {
    color: {
      gray: 'bg-[hsl(var(--priority-low-foreground))]',
      blue: 'bg-[hsl(var(--priority-medium-foreground))]',
      orange: 'bg-[hsl(var(--priority-high-foreground))]',
      error: 'bg-[hsl(var(--priority-urgent-foreground))]',
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
