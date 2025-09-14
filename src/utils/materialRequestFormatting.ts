import { MaterialRequestLineItem } from '@/hooks/useMaterialRequestLineItems';

export const formatLineItemsForDisplay = (lineItems: MaterialRequestLineItem[]): string => {
  if (!lineItems || lineItems.length === 0) {
    return 'No materials specified';
  }

  return lineItems.map(item => {
    const quantity = item.quantity;
    const unit = item.unit;
    const materialName = item.material_name;
    const specOverride = item.spec_override;
    
    // Format: "10 pcs - Drywall 1/2 in. x 4 ft. x 8 ft"
    let formattedItem = `${quantity} ${unit} - ${materialName}`;
    
    if (specOverride && specOverride.trim()) {
      formattedItem += ` (${specOverride})`;
    }
    
    if (item.notes && item.notes.trim()) {
      formattedItem += ` | Notes: ${item.notes}`;
    }
    
    return formattedItem;
  }).join('\n');
};