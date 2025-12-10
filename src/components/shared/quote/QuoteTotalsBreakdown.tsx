import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/utils/formatters';

interface QuoteTotalsBreakdownProps {
  subtotal: number;
  discount: number;
  discountType?: 'percentage' | 'fixed';
  tax: number;
  total: number;
  taxPercentage?: number;
  hstNumber?: string;
  depositAmount?: number;
}

export const QuoteTotalsBreakdown = ({ 
  subtotal, 
  discount, 
  discountType = 'fixed',
  tax, 
  total,
  taxPercentage,
  hstNumber,
  depositAmount
}: QuoteTotalsBreakdownProps) => {
  // Calculate discount amount based on type
  const discountAmount = discountType === 'percentage'
    ? (subtotal * discount) / 100
    : discount;

  // Calculate tax percentage if not provided
  const calculatedTaxPercentage = taxPercentage ?? (
    subtotal - discountAmount > 0 
      ? (tax / (subtotal - discountAmount)) * 100 
      : 0
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-3">
          {/* Subtotal */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium tabular-nums">{formatCurrency(subtotal)}</span>
          </div>
          
          {/* Discount */}
          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Discount{discountType === 'percentage' ? ` (${discount}%)` : ''}
              </span>
              <span className="font-medium text-green-600 tabular-nums">
                - {formatCurrency(discountAmount)}
              </span>
            </div>
          )}
          
          {/* HST/Tax */}
          {tax > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                HST{hstNumber ? ` ${hstNumber}` : ''} ({calculatedTaxPercentage.toFixed(1)}%)
              </span>
              <span className="font-medium tabular-nums">{formatCurrency(tax)}</span>
            </div>
          )}
          
          <Separator className="my-3" />
          
          {/* Total */}
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold">Total</span>
            <span className="text-2xl font-bold text-primary tabular-nums">
              {formatCurrency(total)}
            </span>
          </div>

          {/* Deposit Required */}
          {depositAmount && depositAmount > 0 && (
            <>
              <Separator className="my-3" />
              <div className="flex justify-between items-center bg-primary/5 -mx-6 px-6 py-3 rounded-b-lg">
                <span className="font-semibold text-primary">Deposit Required</span>
                <span className="text-xl font-bold text-primary tabular-nums">
                  {formatCurrency(depositAmount)}
                </span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
