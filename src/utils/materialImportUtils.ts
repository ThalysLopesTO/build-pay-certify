import * as XLSX from 'xlsx';
import { MATERIAL_UNITS } from '@/hooks/useMaterialCatalog';

export interface ImportedMaterial {
  name: string;
  category: string;
  unit: string;
  sku?: string;
  notes?: string;
  is_active: boolean;
}

export interface ValidationResult {
  status: 'ok' | 'warning' | 'error';
  messages: string[];
}

export interface ValidatedRow {
  row: number;
  data: ImportedMaterial;
  validation: ValidationResult;
}

export interface ImportSummary {
  toAdd: number;
  toUpdate: number;
  skipped: number;
  errors: string[];
}

// Template headers for Excel/CSV export
export const TEMPLATE_HEADERS = [
  'Name',
  'Category', 
  'Unit',
  'SKU',
  'Notes',
  'Active'
];

// Generate downloadable template
export const generateTemplate = (format: 'excel' | 'csv'): Blob => {
  const sampleData = [
    ['Drywall 5/8" x 9\'', 'Drywall', 'sheet', 'DW-58-9', 'Standard drywall sheet', 'true'],
    ['Metal Stud 3 5/8"', 'Framing', 'pcs', 'MS-358-20G', '20 gauge metal stud', 'true'],
    ['Joint Compound 4.5L', 'Taping', 'pail', 'JC-45L', 'Ready-mix joint compound', 'true']
  ];

  if (format === 'excel') {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, ...sampleData]);
    XLSX.utils.book_append_sheet(wb, ws, 'Material Catalog');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  } else {
    const csvContent = [TEMPLATE_HEADERS, ...sampleData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    return new Blob([csvContent], { type: 'text/csv' });
  }
};

// Parse uploaded file
export const parseFile = async (file: File): Promise<any[][]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        let workbook: XLSX.WorkBook;

        if (file.name.endsWith('.csv')) {
          workbook = XLSX.read(data, { type: 'binary' });
        } else {
          workbook = XLSX.read(data, { type: 'array' });
        }

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        
        resolve(jsonData as any[][]);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));

    if (file.name.endsWith('.csv')) {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
};

// Map columns to our expected format
export const mapColumns = (headers: string[], data: any[][], validCategories: string[] = []): ValidatedRow[] => {
  const headerMap: Record<string, number> = {};
  
  // Auto-detect column mapping (case-insensitive)
  headers.forEach((header, index) => {
    const normalizedHeader = header.toLowerCase().trim();
    if (normalizedHeader.includes('name')) headerMap.name = index;
    else if (normalizedHeader.includes('category')) headerMap.category = index;
    else if (normalizedHeader.includes('unit')) headerMap.unit = index;
    else if (normalizedHeader.includes('sku')) headerMap.sku = index;
    else if (normalizedHeader.includes('note')) headerMap.notes = index;
    else if (normalizedHeader.includes('active')) headerMap.active = index;
  });

  return data.slice(1).map((row, index) => {
    const material: ImportedMaterial = {
      name: String(row[headerMap.name] || '').trim(),
      category: String(row[headerMap.category] || '').trim(),
      unit: String(row[headerMap.unit] || '').trim().toLowerCase(),
      sku: headerMap.sku !== undefined ? String(row[headerMap.sku] || '').trim() : undefined,
      notes: headerMap.notes !== undefined ? String(row[headerMap.notes] || '').trim() : undefined,
      is_active: parseBoolean(row[headerMap.active])
    };

    const validation = validateMaterial(material, validCategories);

    return {
      row: index + 2, // +2 because we sliced headers and arrays are 0-indexed
      data: material,
      validation
    };
  });
};

// Validate individual material
export const validateMaterial = (material: ImportedMaterial, validCategories: string[] = []): ValidationResult => {
  const messages: string[] = [];
  let status: 'ok' | 'warning' | 'error' = 'ok';

  // Required fields
  if (!material.name) {
    messages.push('Name is required');
    status = 'error';
  }

  if (!material.category) {
    messages.push('Category is required');
    status = 'error';
  } else if (validCategories.length > 0 && !validCategories.includes(material.category)) {
    messages.push(`Category "${material.category}" will be created as it doesn't exist yet`);
    if (status === 'ok') status = 'warning';
  }

  if (!material.unit) {
    messages.push('Unit is required');
    status = 'error';
  } else if (!MATERIAL_UNITS.includes(material.unit)) {
    // Try to find a close match (case-insensitive)
    const matchedUnit = MATERIAL_UNITS.find(unit => 
      unit.toLowerCase() === material.unit.toLowerCase()
    );
    if (matchedUnit) {
      material.unit = matchedUnit; // Auto-correct
      messages.push(`Unit auto-corrected to "${matchedUnit}"`);
      if (status === 'ok') status = 'warning';
    } else {
      messages.push(`Invalid unit. Must be one of: ${MATERIAL_UNITS.join(', ')}`);
      status = 'error';
    }
  }

  // Optional validations
  if (material.sku && material.sku.length > 50) {
    messages.push('SKU too long (max 50 characters)');
    if (status === 'ok') status = 'warning';
  }

  if (material.name && material.name.length > 255) {
    messages.push('Name too long (max 255 characters)');
    status = 'error';
  }

  return { status, messages };
};

// Parse boolean values from various formats
const parseBoolean = (value: any): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  
  const str = String(value).toLowerCase().trim();
  return ['true', 'yes', '1', 'active', 'y'].includes(str);
};

// Generate import summary
export const generateImportSummary = (
  validatedRows: ValidatedRow[],
  existingItems: any[]
): ImportSummary => {
  const validRows = validatedRows.filter(row => row.validation.status !== 'error');
  const errorRows = validatedRows.filter(row => row.validation.status === 'error');
  
  let toAdd = 0;
  let toUpdate = 0;
  
  validRows.forEach(row => {
    const { sku, name, category, unit } = row.data;
    
    // Check if item exists (by SKU first, then by name+category+unit)
    const existing = existingItems.find(item => {
      if (sku && item.sku) {
        return item.sku === sku;
      }
      return item.name === name && item.category === category && item.unit === unit;
    });
    
    if (existing) {
      toUpdate++;
    } else {
      toAdd++;
    }
  });
  
  return {
    toAdd,
    toUpdate,
    skipped: errorRows.length,
    errors: errorRows.map(row => `Row ${row.row}: ${row.validation.messages.join(', ')}`)
  };
};