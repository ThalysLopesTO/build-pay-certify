import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface TableCardRootProps extends React.HTMLAttributes<HTMLDivElement> {}

const TableCardRoot = React.forwardRef<HTMLDivElement, TableCardRootProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border bg-card text-card-foreground shadow-sm",
        className
      )}
      {...props}
    />
  )
)
TableCardRoot.displayName = "TableCardRoot"

interface TableCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  badge?: string | number
  description?: string
  trailing?: React.ReactNode
}

const TableCardHeader = React.forwardRef<HTMLDivElement, TableCardHeaderProps>(
  ({ className, title, badge, description, trailing, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-start justify-between gap-4 px-6 py-5", className)}
      {...props}
    >
      <div className="flex flex-col gap-1">
        {(title || badge != null) && (
          <div className="flex items-center gap-2">
            {title && <h3 className="text-lg font-semibold leading-7">{title}</h3>}
            {badge != null && (
              <Badge variant="secondary" className="rounded-full text-xs font-medium">
                {badge}
              </Badge>
            )}
          </div>
        )}
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        {children}
      </div>
      {trailing && <div className="flex-shrink-0">{trailing}</div>}
    </div>
  )
)
TableCardHeader.displayName = "TableCardHeader"

interface TableCardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const TableCardFooter = React.forwardRef<HTMLDivElement, TableCardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("border-t px-6 py-4", className)}
      {...props}
    />
  )
)
TableCardFooter.displayName = "TableCardFooter"

export const TableCard = {
  Root: TableCardRoot,
  Header: TableCardHeader,
  Footer: TableCardFooter,
}
