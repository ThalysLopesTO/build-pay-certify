// Generates a downloadable .xlsx template for client import.

import * as XLSX from 'xlsx';

export const TEMPLATE_HEADERS = [
  'name',
  'company',
  'email',
  'phone',
  'address',
  'city',
  'province',
  'postal_code',
  'country',
  'notes',
] as const;

const EXAMPLE_ROW = [
  'John Smith',
  'Smith Construction Ltd.',
  'john@smithconstruction.com',
  '+1 416 555 0142',
  '123 Main Street',
  'Toronto',
  'ON',
  'M5V 2T6',
  'Canada',
  'Preferred contact: email',
];

export const downloadClientTemplate = () => {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS as unknown as string[], EXAMPLE_ROW]);
  // Set reasonable column widths
  ws['!cols'] = TEMPLATE_HEADERS.map(() => ({ wch: 22 }));
  XLSX.utils.book_append_sheet(wb, ws, 'Clients');
  XLSX.writeFile(wb, 'clients-import-template.xlsx');
};
