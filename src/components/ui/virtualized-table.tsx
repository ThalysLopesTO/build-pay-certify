import React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Table, TableHeader, TableBody, TableHead, TableRow } from '@/components/ui/table';

interface VirtualizedTableProps {
  data: any[];
  columns: {
    header: string;
    accessor: string;
    cell?: (item: any, index: number) => React.ReactNode;
    width?: number;
  }[];
  rowHeight?: number;
  overscan?: number;
  className?: string;
  onRowClick?: (item: any, index: number) => void;
}

export const VirtualizedTable: React.FC<VirtualizedTableProps> = ({
  data,
  columns,
  rowHeight = 52,
  overscan = 10,
  className,
  onRowClick
}) => {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan
  });

  const items = virtualizer.getVirtualItems();

  return (
    <div className={className}>
      {/* Sticky Header */}
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
          <TableRow>
            {columns.map((column, index) => (
              <TableHead 
                key={index}
                style={{ width: column.width }}
                className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
      </Table>

      {/* Virtualized Body */}
      <div
        ref={parentRef}
        className="max-h-[600px] overflow-auto"
        style={{
          contain: 'strict',
        }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          <Table>
            <TableBody>
              {items.map((virtualRow) => {
                const item = data[virtualRow.index];
                const isEven = virtualRow.index % 2 === 0;
                
                return (
                  <TableRow
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    ref={(node) => virtualizer.measureElement(node)}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className={`
                      border-b transition-colors hover:bg-muted/50 
                      ${isEven ? 'bg-background' : 'bg-muted/25'}
                      ${onRowClick ? 'cursor-pointer' : ''}
                    `}
                    onClick={() => onRowClick?.(item, virtualRow.index)}
                  >
                    {columns.map((column, colIndex) => (
                      <td
                        key={colIndex}
                        className="p-4 align-middle"
                        style={{ width: column.width }}
                      >
                        {column.cell 
                          ? column.cell(item, virtualRow.index)
                          : item[column.accessor]
                        }
                      </td>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};