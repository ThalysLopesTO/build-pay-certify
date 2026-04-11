import * as React from "react"
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

type TableSize = "sm" | "md"

const TableSizeContext = React.createContext<TableSize>("md")

const useTableSize = () => React.useContext(TableSizeContext)

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement> & { size?: TableSize }
>(({ className, size = "md", ...props }, ref) => (
  <TableSizeContext.Provider value={size}>
    <div className="relative w-full overflow-auto">
      <table
        ref={ref}
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  </TableSizeContext.Provider>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn("bg-secondary sticky top-0 z-10 [&_tr]:border-b", className)}
    {...props}
  />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => {
  const size = useTableSize()
  return (
    <th
      ref={ref}
      className={cn(
        "text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
        size === "sm" ? "h-10 px-5 py-3 text-xs" : "h-12 px-6 py-4 text-xs",
        className
      )}
      {...props}
    />
  )
})
TableHead.displayName = "TableHead"

interface TableHeadSortableProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sorted?: "ascending" | "descending" | false
  onSort?: () => void
}

const TableHeadSortable = React.forwardRef<HTMLTableCellElement, TableHeadSortableProps>(
  ({ className, children, sorted, onSort, ...props }, ref) => {
    const size = useTableSize()
    return (
      <th
        ref={ref}
        className={cn(
          "text-left align-middle font-medium text-muted-foreground cursor-pointer select-none [&:has([role=checkbox])]:pr-0",
          size === "sm" ? "h-10 px-5 py-3 text-xs" : "h-12 px-6 py-4 text-xs",
          className
        )}
        onClick={onSort}
        {...props}
      >
        <div className="flex items-center gap-1">
          {children}
          {sorted === "ascending" ? (
            <ChevronUp className="h-4 w-4" />
          ) : sorted === "descending" ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />
          )}
        </div>
      </th>
    )
  }
)
TableHeadSortable.displayName = "TableHeadSortable"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => {
  const size = useTableSize()
  return (
    <td
      ref={ref}
      className={cn(
        "align-middle [&:has([role=checkbox])]:pr-0",
        size === "sm" ? "px-5 py-3" : "px-6 py-4",
        className
      )}
      {...props}
    />
  )
})
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableHeadSortable,
  TableRow,
  TableCell,
  TableCaption,
}
