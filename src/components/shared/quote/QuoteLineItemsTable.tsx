import { QuoteLineItem } from '@/hooks/quotes/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/utils/formatters';

interface QuoteLineItemsTableProps {
  lineItems: QuoteLineItem[];
  isMobile?: boolean;
}

export const QuoteLineItemsTable = ({ lineItems, isMobile }: QuoteLineItemsTableProps) => {
  if (!lineItems || lineItems.length === 0) {
    return null;
  }

  if (isMobile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Line Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {lineItems.map((item) => (
            <div key={item.id} className="border-b border-border pb-4 last:border-0">
              <div className="font-medium">{item.description}</div>
              {item.vendor && (
                <div className="text-sm text-muted-foreground">Vendor: {item.vendor}</div>
              )}
              <div className="flex justify-between mt-2 text-sm">
                <span>Qty: {item.quantity}</span>
                <span>Unit Price: {formatCurrency(item.unit_price)}</span>
              </div>
              <div className="text-right font-medium mt-1 tabular-nums">
                {formatCurrency(item.amount)}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Line Items</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 font-medium">Description</th>
                <th className="text-right py-3 px-2 font-medium w-24">Quantity</th>
                <th className="text-right py-3 px-2 font-medium w-32">Unit Price</th>
                <th className="text-right py-3 px-2 font-medium w-32">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-0">
                  <td className="py-3 px-2">
                    <div className="font-medium">{item.description}</div>
                    {item.vendor && (
                      <div className="text-sm text-muted-foreground">Vendor: {item.vendor}</div>
                    )}
                  </td>
                  <td className="text-right py-3 px-2 tabular-nums">{item.quantity}</td>
                  <td className="text-right py-3 px-2 tabular-nums">{formatCurrency(item.unit_price)}</td>
                  <td className="text-right py-3 px-2 font-medium tabular-nums">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
