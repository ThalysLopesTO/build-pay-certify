import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Trash2, Copy } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';

interface InvoiceMobileLineItemProps {
  index: number;
  form: UseFormReturn<any>;
  onRemove: () => void;
  onDuplicate: () => void;
  canRemove: boolean;
}

const InvoiceMobileLineItem: React.FC<InvoiceMobileLineItemProps> = ({
  index,
  form,
  onRemove,
  onDuplicate,
  canRemove,
}) => {
  const quantity = form.watch(`line_items.${index}.quantity`) || 0;
  const unitPrice = form.watch(`line_items.${index}.unit_price`) || 0;
  const total = quantity * unitPrice;

  return (
    <Card className="p-4 bg-muted/30 border border-border/50">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Item {index + 1}</span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onDuplicate}
              aria-label="Duplicate item"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <Copy className="h-4 w-4" />
            </Button>
            {canRemove && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <FormField
          control={form.control}
          name={`line_items.${index}.name`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-muted-foreground">Item Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Item name"
                  className="h-11 bg-background"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`line_items.${index}.description`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-muted-foreground">Description</FormLabel>
              <FormControl>
                <Input
                  placeholder="Description"
                  className="h-11 bg-background"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name={`line_items.${index}.quantity`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground">Quantity</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="1"
                    min="1"
                    className="h-11 bg-background"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`line_items.${index}.unit_price`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground">Unit Price</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    className="h-11 bg-background"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-base font-semibold text-foreground">
            ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </Card>
  );
};

export default InvoiceMobileLineItem;
