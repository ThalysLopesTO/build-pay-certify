import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, ToggleLeft, ToggleRight, GripVertical } from 'lucide-react';
import { MaterialCatalogItem } from '@/hooks/useMaterialCatalog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DraggableItemProps {
  item: MaterialCatalogItem;
  onEdit: (item: MaterialCatalogItem) => void;
  onToggleActive: (item: MaterialCatalogItem) => void;
  onDelete: (item: MaterialCatalogItem) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

export const DraggableItem: React.FC<DraggableItemProps> = ({
  item,
  onEdit,
  onToggleActive,
  onDelete,
  isUpdating,
  isDeleting,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors ${
        isDragging ? 'shadow-lg z-50' : ''
      }`}
    >
      <div className="flex items-center gap-3 flex-1">
        <div
          {...attributes}
          {...listeners}
          className="flex items-center justify-center w-6 h-6 cursor-grab hover:bg-muted rounded p-1 transition-colors"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-3">
            <span className="font-medium">{item.name}</span>
            {item.sku && (
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {item.sku}
              </code>
            )}
          </div>
          {item.notes && (
            <p className="text-sm text-muted-foreground">{item.notes}</p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Badge 
          variant={item.is_active ? "default" : "secondary"}
          className="text-xs"
        >
          {item.is_active ? "Active" : "Inactive"}
        </Badge>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleActive(item)}
          disabled={isUpdating}
        >
          {item.is_active ? (
            <ToggleRight className="h-4 w-4 text-green-600" />
          ) : (
            <ToggleLeft className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(item)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Material Item</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{item.name}"? This action cannot be undone.
                Any existing material requests referencing this item will keep their data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(item)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};