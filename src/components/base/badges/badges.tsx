import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Color map – Untitled UI palette                                    */
/* ------------------------------------------------------------------ */

const colorMap = {
  gray: {
    pill: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700',
    outline: 'text-gray-700 border-gray-300 dark:text-gray-300 dark:border-gray-600',
    dot: 'bg-gray-500',
  },
  brand: {
    pill: 'bg-primary/10 text-primary border-primary/20',
    outline: 'text-primary border-primary/30',
    dot: 'bg-primary',
  },
  error: {
    pill: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800',
    outline: 'text-red-700 border-red-300 dark:text-red-400 dark:border-red-700',
    dot: 'bg-red-500',
  },
  warning: {
    pill: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800',
    outline: 'text-amber-700 border-amber-300 dark:text-amber-400 dark:border-amber-700',
    dot: 'bg-amber-500',
  },
  success: {
    pill: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800',
    outline: 'text-green-700 border-green-300 dark:text-green-400 dark:border-green-700',
    dot: 'bg-green-500',
  },
  blue: {
    pill: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800',
    outline: 'text-blue-700 border-blue-300 dark:text-blue-400 dark:border-blue-700',
    dot: 'bg-blue-500',
  },
  indigo: {
    pill: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-400 dark:border-indigo-800',
    outline: 'text-indigo-700 border-indigo-300 dark:text-indigo-400 dark:border-indigo-700',
    dot: 'bg-indigo-500',
  },
  purple: {
    pill: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800',
    outline: 'text-purple-700 border-purple-300 dark:text-purple-400 dark:border-purple-700',
    dot: 'bg-purple-500',
  },
  pink: {
    pill: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950 dark:text-pink-400 dark:border-pink-800',
    outline: 'text-pink-700 border-pink-300 dark:text-pink-400 dark:border-pink-700',
    dot: 'bg-pink-500',
  },
  orange: {
    pill: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800',
    outline: 'text-orange-700 border-orange-300 dark:text-orange-400 dark:border-orange-700',
    dot: 'bg-orange-500',
  },
} as const;

export type BadgeColor = keyof typeof colorMap;
export type BadgeType = 'pill-color' | 'pill-outline' | 'solid';

/* ------------------------------------------------------------------ */
/*  Size variants via CVA                                              */
/* ------------------------------------------------------------------ */

const badgeSizeVariants = cva(
  'inline-flex items-center rounded-full border font-medium transition-colors',
  {
    variants: {
      size: {
        sm: 'px-2 py-0.5 text-xs gap-1',
        md: 'px-2.5 py-0.5 text-xs gap-1.5',
        lg: 'px-3 py-1 text-sm gap-1.5',
      },
    },
    defaultVariants: {
      size: 'sm',
    },
  }
);

const dotSizeMap = {
  sm: 'w-1.5 h-1.5',
  md: 'w-1.5 h-1.5',
  lg: 'w-2 h-2',
} as const;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export interface BadgeWithDotProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeSizeVariants> {
  /** Visual style */
  type?: BadgeType;
  /** Preset color from the Untitled UI palette */
  color?: BadgeColor;
  /**
   * Custom hex color for `type="solid"` badges.
   * Renders a solid background with white text + white dot.
   */
  customColor?: string;
  /** Animate the dot with a pulse */
  pulse?: boolean;
  /** Hide the dot entirely */
  hideDot?: boolean;
}

export const BadgeWithDot = React.forwardRef<HTMLSpanElement, BadgeWithDotProps>(
  (
    {
      type = 'pill-color',
      color = 'gray',
      customColor,
      size = 'sm',
      pulse = false,
      hideDot = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const sizeKey = size ?? 'sm';

    // Solid custom-color badges
    if (type === 'solid' && customColor) {
      return (
        <span
          ref={ref}
          className={cn(
            badgeSizeVariants({ size }),
            'border-transparent text-white',
            className
          )}
          style={{ backgroundColor: customColor }}
          {...props}
        >
          {!hideDot && (
            <span
              className={cn(
                'rounded-full bg-white flex-shrink-0',
                dotSizeMap[sizeKey],
                pulse && 'animate-pulse'
              )}
            />
          )}
          {children}
        </span>
      );
    }

    // Preset color badges
    const palette = colorMap[color];
    const typeKey = type === 'pill-outline' ? 'outline' : 'pill';

    return (
      <span
        ref={ref}
        className={cn(
          badgeSizeVariants({ size }),
          palette[typeKey],
          className
        )}
        {...props}
      >
        {!hideDot && (
          <span
            className={cn(
              'rounded-full flex-shrink-0',
              dotSizeMap[sizeKey],
              palette.dot,
              pulse && 'animate-pulse'
            )}
          />
        )}
        {children}
      </span>
    );
  }
);

BadgeWithDot.displayName = 'BadgeWithDot';
