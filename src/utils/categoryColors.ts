// Persistent category color mapping system
// Based on the original Bills/Expenses page design

export const CATEGORY_COLORS = [
  'hsl(221, 83%, 53%)', // Primary blue
  'hsl(262, 83%, 58%)', // Purple
  'hsl(142, 76%, 36%)', // Green
  'hsl(346, 77%, 49%)', // Pink
  'hsl(24, 95%, 53%)',  // Orange
  'hsl(38, 92%, 50%)',  // Yellow
  'hsl(199, 89%, 48%)', // Cyan
  'hsl(158, 64%, 52%)', // Teal
];

// Global category color map for persistence across sessions
const categoryColorMap = new Map<string, string>();

export const getCategoryColor = (categoryId: string, categoryName: string): string => {
  // Try to get existing color first
  if (categoryColorMap.has(categoryId)) {
    return categoryColorMap.get(categoryId)!;
  }
  
  // Assign a new color based on current map size
  const colorIndex = categoryColorMap.size % CATEGORY_COLORS.length;
  const color = CATEGORY_COLORS[colorIndex];
  
  // Store the mapping
  categoryColorMap.set(categoryId, color);
  
  return color;
};

// Generate lighter shades for subcategories
export const getSubcategoryColor = (parentColor: string, opacity: number = 0.7): string => {
  // Extract HSL values and reduce saturation/lightness for subcategory shades
  const hslMatch = parentColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (hslMatch) {
    const [, h, s, l] = hslMatch;
    const newSaturation = Math.max(20, parseInt(s) * 0.8);
    const newLightness = Math.min(80, parseInt(l) * 1.2);
    return `hsl(${h}, ${newSaturation}%, ${newLightness}%)`;
  }
  return parentColor;
};

// Reset color map (useful for testing or company changes)
export const resetCategoryColors = () => {
  categoryColorMap.clear();
};

// Get all current color mappings
export const getCategoryColorMappings = (): Map<string, string> => {
  return new Map(categoryColorMap);
};