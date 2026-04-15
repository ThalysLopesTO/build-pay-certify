
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { QuoteLineItem } from '@/hooks/quotes';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableLineItem from './SortableLineItem';

interface QuoteEditorLineItemsSectionProps {
  lineItems: (Partial<QuoteLineItem> & { _tempId?: string })[];
  handleLineItemChange: (index: number, field: string, value: string | number) => void;
  addLineItem: () => void;
  removeLineItem: (index: number) => void;
  onReorderLineItems: (startIndex: number, endIndex: number) => void;
}

const QuoteEditorLineItemsSection: React.FC<QuoteEditorLineItemsSectionProps> = ({
  lineItems,
  handleLineItemChange,
  addLineItem,
  removeLineItem,
  onReorderLineItems,
}) => {
  const isMobile = useIsMobile();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    const getStableId = (item: any, i: number) => item._tempId || item.id || `line-item-${i}`;
    const oldIndex = lineItems.findIndex((item, i) => getStableId(item, i) === active.id);
    const newIndex = lineItems.findIndex((item, i) => getStableId(item, i) === over.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      onReorderLineItems(oldIndex, newIndex);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3 px-4 md:px-6">
        <CardTitle className="text-lg">Products & Services</CardTitle>
      </CardHeader>
      <CardContent className="px-3 md:px-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={lineItems.map((item) => (item as any)._tempId || item.id || crypto.randomUUID())}
            strategy={verticalListSortingStrategy}
          >
            {/* Desktop Table View - Hidden on mobile */}
            <div className="hidden md:block">
              {/* Table Header */}
              <div className="grid grid-cols-[40px_1fr_100px_120px_120px_40px] gap-3 pb-3 border-b text-sm font-semibold text-muted-foreground">
                <div></div>
                <div>Product / Service</div>
                <div className="text-right">Qty.</div>
                <div className="text-right">Unit Price</div>
                <div className="text-right">Total</div>
                <div></div>
              </div>

              {/* Line Items */}
              <div className="space-y-0">
                {lineItems.map((item, index) => {
                  const stableId = (item as any)._tempId || item.id || `line-item-${index}`;
                  return (
                    <SortableLineItem
                      key={stableId}
                      id={stableId}
                      index={index}
                      item={item}
                      isMobile={false}
                      handleLineItemChange={handleLineItemChange}
                      removeLineItem={removeLineItem}
                      showRemoveButton={lineItems.length > 1}
                    />
                  );
                })}
              </div>
            </div>

            {/* Mobile Card View - Visible only on mobile */}
            <div className="md:hidden space-y-4">
              {lineItems.map((item, index) => {
                const stableId = (item as any)._tempId || item.id || `line-item-${index}`;
                return (
                  <SortableLineItem
                    key={stableId}
                    id={stableId}
                    index={index}
                    item={item}
                    isMobile={true}
                    handleLineItemChange={handleLineItemChange}
                    removeLineItem={removeLineItem}
                    showRemoveButton={lineItems.length > 1}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>

        {/* Add Item Buttons */}
        <div className="flex gap-2 pt-4 border-t mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={addLineItem}
            className="flex-1"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Line Item
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuoteEditorLineItemsSection;
