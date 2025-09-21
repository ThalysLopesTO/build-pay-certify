import * as React from "react"
import { cn } from "@/lib/utils"

interface RadioCardProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
  title: string
  description?: string
}

const RadioCard = React.forwardRef<HTMLInputElement, RadioCardProps>(
  ({ className, icon, title, description, checked, ...props }, ref) => {
    return (
      <label
        className={cn(
          "relative flex cursor-pointer rounded-lg border border-border p-4 transition-all duration-200 hover:bg-muted/50",
          checked
            ? "border-primary bg-primary/5 ring-2 ring-primary ring-offset-2"
            : "",
          className
        )}
      >
        <input
          type="radio"
          ref={ref}
          checked={checked}
          className="sr-only"
          {...props}
        />
        <div className="flex items-center space-x-3">
          {icon && (
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md",
              checked ? "text-primary" : "text-muted-foreground"
            )}>
              {icon}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className={cn(
              "text-sm font-medium",
              checked ? "text-primary" : "text-foreground"
            )}>
              {title}
            </div>
            {description && (
              <div className="text-xs text-muted-foreground mt-1">
                {description}
              </div>
            )}
          </div>
        </div>
        {checked && (
          <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
        )}
      </label>
    )
  }
)

RadioCard.displayName = "RadioCard"

export { RadioCard }