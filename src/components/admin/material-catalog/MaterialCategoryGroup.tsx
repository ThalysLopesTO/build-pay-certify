import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { MaterialCatalogItem, useMaterialCatalogMutations } from '@/hooks/useMaterialCatalog';
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
  const { updateItem, deleteItem, isUpdating, isDeleting } = useMaterialCatalogMutations();

  const handleToggleActive = (item: MaterialCatalogItem) => {
    updateItem({
      id: item.id,
      is_active: !item.is_active,
    });
  };

  const handleDelete = (item: MaterialCatalogItem) => {
    deleteItem(item.id);
  };

  const activeCount = items.filter(item => item.is_active).length;

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
              {activeCount} of {items.length} active
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors"
              >
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
                    onClick={() => handleToggleActive(item)}
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
                          onClick={() => handleDelete(item)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};