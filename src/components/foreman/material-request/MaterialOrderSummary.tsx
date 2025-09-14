import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OrderLineItem } from './MaterialOrderTable';
import { useHierarchicalMaterialCategories } from '@/hooks/useHierarchicalMaterialCategories';

interface MaterialOrderSummaryProps {
  lineItems: OrderLineItem[];
}

export const MaterialOrderSummary: React.FC<MaterialOrderSummaryProps> = ({
  lineItems,
}) => {
  const { getCategoryDisplay } = useHierarchicalMaterialCategories();
  
  // Group by category
  const groupedByCategory = lineItems.reduce((acc, item) => {
    const categoryKey = item.category || (item.isCustom ? 'Custom Items' : 'Other');
    const categoryDisplay = item.category ? getCategoryDisplay(item.category) : categoryKey;
    
    if (!acc[categoryDisplay]) {
      acc[categoryDisplay] = [];
    }
    acc[categoryDisplay].push(item);
    return acc;
  }, {} as Record<string, OrderLineItem[]>);

  const totalLines = lineItems.length;
  const categoriesCount = Object.keys(groupedByCategory).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Order Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Items:</span>
            <span className="font-medium">{totalLines}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Categories:</span>
            <span className="font-medium">{categoriesCount}</span>
          </div>
          
          <div className="border-t pt-3">
            <h4 className="text-sm font-medium mb-2">By Category:</h4>
            <div className="space-y-2">
              {Object.entries(groupedByCategory).map(([category, items]) => (
                <div key={category} className="flex justify-between items-center">
                  <Badge variant="secondary" className="text-xs">
                    {category}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {items.length} item{items.length !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};