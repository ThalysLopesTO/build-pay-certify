import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface QuoteTotalsBreakdownProps {
  subtotal: number;
  discount: number;
  discountType?: 'percentage' | 'fixed';
  tax: number;
  total: number;
  taxPercentage?: number;
}

export const QuoteTotalsBreakdown = ({ 
  subtotal, 
  discount, 
  discountType = 'fixed',
  tax, 
  total,
  taxPercentage 
}: QuoteTotalsBreakdownProps) => {
  // Calculate discount amount based on type
  const discountAmount = discountType === 'percentage'
    ? (subtotal * discount) / 100
    : discount;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal:</span>
            <span className="font-medium">${subtotal.toFixed(2)}</span>
          </div>
          
          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Discount{discountType === 'percentage' ? ` (${discount}%)` : ''}:
              </span>
              <span className="font-medium text-green-600">-${discountAmount.toFixed(2)}</span>
            </div>
          )}
          
          {tax > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Tax{taxPercentage ? ` (${taxPercentage}%)` : ''}:
              </span>
              <span className="font-medium">${tax.toFixed(2)}</span>
            </div>
          )}
          
          <Separator />
          
          <div className="flex justify-between text-lg font-bold">
            <span>Total:</span>
            <span className="text-primary">${total.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
