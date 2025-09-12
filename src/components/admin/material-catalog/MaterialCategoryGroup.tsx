import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { MaterialCatalogItem, useMaterialCatalogMutations } from '@/hooks/useMaterialCatalog';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { DraggableItem } from './DraggableItem';

interface MaterialCategoryGroupProps {
  category: string;
  items: MaterialCatalogItem[];
  onEdit: (item: MaterialCatalogItem) => void;
  defaultExpanded?: boolean;
}

export const MaterialCategoryGroup: React.FC<MaterialCategoryGroupProps> = ({
  category,
  items,
  onEdit,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [localItems, setLocalItems] = useState(items);
  const { updateItem, deleteItem, reorderItem, isUpdating, isDeleting } = useMaterialCatalogMutations();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update local items when props change
  React.useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const handleToggleActive = (item: MaterialCatalogItem) => {
    updateItem({
      id: item.id,
      is_active: !item.is_active,
    });
  };

  const handleDelete = (item: MaterialCatalogItem) => {
    deleteItem(item.id);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = localItems.findIndex((item) => item.id === active.id);
      const newIndex = localItems.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(localItems, oldIndex, newIndex);
      setLocalItems(newItems);

      // Update sort_order for all affected items
      newItems.forEach((item, index) => {
        const newSortOrder = (index + 1) * 10;
        if (item.sort_order !== newSortOrder) {
          reorderItem({ itemId: item.id, newSortOrder });
        }
      });
    }
  };

  const activeCount = localItems.filter(item => item.is_active).length;

  return (
    <Card className="mb-4">
      <CardHeader 
        className="py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <h3 className="text-lg font-semibold">{category}</h3>
            <Badge variant="outline" className="text-xs">
              {activeCount} of {localItems.length} active
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localItems.map(item => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {localItems.map((item) => (
                  <DraggableItem
                    key={item.id}
                    item={item}
                    onEdit={onEdit}
                    onToggleActive={handleToggleActive}
                    onDelete={handleDelete}
                    isUpdating={isUpdating}
                    isDeleting={isDeleting}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </CardContent>
      )}
    </Card>
  );
};