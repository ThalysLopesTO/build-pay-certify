// Parses xlsx/xls/csv files into normalized client rows.
// Header matching is case/whitespace-insensitive and accepts common aliases.

import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export interface ParsedClientRow {
  rowIndex: number; // 1-based row number (header excluded) for user-facing messages
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  notes: string;
}

const HEADER_ALIASES: Record<string, keyof Omit<ParsedClientRow, 'rowIndex'>> = {
  // name
  'name': 'name',
  'client name': 'name',
  'client': 'name',
  'full name': 'name',
  'contact name': 'name',
  'contact': 'name',
  // company
  'company': 'company',
  'company name': 'company',
  'business': 'company',
  'business name': 'company',
  'organization': 'company',
  // email
  'email': 'email',
  'email address': 'email',
  'e-mail': 'email',
  'mail': 'email',
  // phone
  'phone': 'phone',
  'phone number': 'phone',
  'telephone': 'phone',
  'mobile': 'phone',
  'cell': 'phone',
  'tel': 'phone',
  // address
  'address': 'address',
  'street': 'address',
  'street address': 'address',
  'address line 1': 'address',
  // city
  'city': 'city',
  'town': 'city',
  // province
  'province': 'province',
  'state': 'province',
  'region': 'province',
  // postal_code
  'postal code': 'postal_code',
  'postal': 'postal_code',
  'zip': 'postal_code',
  'zip code': 'postal_code',
  'postcode': 'postal_code',
  // country
  'country': 'country',
  // notes
  'notes': 'notes',
  'note': 'notes',
  'comments': 'notes',
  'description': 'notes',
};

const normalizeHeader = (h: string): string =>
  String(h ?? '').trim().toLowerCase().replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ');

const buildHeaderMap = (headers: string[]): Record<number, keyof Omit<ParsedClientRow, 'rowIndex'>> => {
  const map: Record<number, keyof Omit<ParsedClientRow, 'rowIndex'>> = {};
  headers.forEach((h, i) => {
    const key = HEADER_ALIASES[normalizeHeader(h)];
    if (key) map[i] = key;
  });
  return map;
};

const emptyRow = (rowIndex: number): ParsedClientRow => ({
  rowIndex,
  name: '',
  company: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  province: '',
  postal_code: '',
  country: '',
  notes: '',
});

const safeStr = (v: unknown): string => {
  if (v === null || v === undefined) return '';
  return String(v).trim();
};

const rowsToParsedClients = (rows: unknown[][]): ParsedClientRow[] => {
  if (rows.length === 0) return [];
  const [headerRow, ...dataRows] = rows;
  const headers = (headerRow as unknown[]).map(safeStr);
  const headerMap = buildHeaderMap(headers);

  return dataRows
    .map((row, idx) => {
      const parsed = emptyRow(idx + 1);
      (row as unknown[]).forEach((cell, colIdx) => {
        const key = headerMap[colIdx];
        if (key) (parsed as unknown as Record<string, string>)[key] = safeStr(cell);
      });
      return parsed;
    })
    .filter((r) =>
      // drop fully empty rows
      [r.name, r.company, r.email, r.phone, r.address].some((v) => v.length > 0)
    );
};

const parseCsv = async (file: File): Promise<ParsedClientRow[]> => {
  const text = await file.text();
  const result = Papa.parse<string[]>(text, {
    skipEmptyLines: 'greedy',
  });
  return rowsToParsedClients(result.data as unknown[][]);
};

const parseXlsx = async (file: File): Promise<ParsedClientRow[]> => {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return [];
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });
  return rowsToParsedClients(rows as unknown[][]);
};

export const parseClientsFile = async (file: File): Promise<ParsedClientRow[]> => {
  const name = file.name.toLowerCase();
  if (name.endsWith('.csv')) return parseCsv(file);
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) return parseXlsx(file);
  // Fallback: try xlsx (it can handle many formats)
  return parseXlsx(file);
};

/** Combine address parts into a single line for the existing client_address column. */
export const composeAddress = (r: ParsedClientRow): string => {
  const parts = [r.address, r.city, r.province, r.postal_code, r.country]
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.join(', ');
};
