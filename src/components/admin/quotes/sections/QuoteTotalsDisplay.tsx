
import React from 'react';
import { Input } from '@/components/ui/input';

interface QuoteTotalsDisplayProps {
  subtotal: number;
  formData: {
    discount: number;
    tax: number;
  };
  discountAmount: number;
  taxAmount: number;
  total: number;
  handleInputChange: (field: string, value: number) => void;
}

const QuoteTotalsDisplay: React.FC<QuoteTotalsDisplayProps> = ({
  subtotal,
  formData,
  discountAmount,
  taxAmount,
  total,
  handleInputChange,
}) => {
  return (
    <div className="mt-6 flex justify-end">
      <div className="w-80 space-y-2">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span>Discount:</span>
          <div className="flex items-center gap-2">
            <span>$</span>
            <Input
              type="number"
              value={formData.discount}
              onChange={(e) => handleInputChange('discount', Number(e.target.value))}
              min="0"
              step="0.01"
              className="w-24"
              placeholder="0.00"
              autoComplete="off"
            />
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span>Tax:</span>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={formData.tax}
              onChange={(e) => handleInputChange('tax', Number(e.target.value))}
              min="0"
              max="100"
              step="0.01"
              className="w-20"
              autoComplete="off"
            />
            <span>%</span>
            <span>${taxAmount.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="flex justify-between font-bold text-lg border-t pt-2">
          <span>Total:</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default QuoteTotalsDisplay;
