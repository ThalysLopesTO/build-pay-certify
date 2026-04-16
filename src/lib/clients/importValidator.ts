// Per-row validation + duplicate detection for the client importer.

import { z } from 'zod';
import type { ParsedClientRow } from './importParser';
import type { Client } from '@/hooks/useClients';

export type RowStatus = 'valid' | 'invalid' | 'duplicate';

export interface ValidatedRow {
  row: ParsedClientRow;
  status: RowStatus;
  errors: string[];
  warnings: string[];
  duplicateReason?: 'in-file' | 'in-database';
  duplicateMatch?: string; // brief description: "email: x@y.com"
}

const emailSchema = z.string().trim().email().max(255);

const norm = (v: string): string => v.trim().toLowerCase();
const normPhone = (v: string): string => v.replace(/[^0-9]/g, '');
const nameCompanyKey = (name: string, company: string): string =>
  `${norm(name)}|${norm(company)}`;

export interface ValidateOptions {
  existingClients: Pick<Client, 'client_email' | 'client_phone' | 'client_name' | 'client_company'>[];
}

export const validateRows = (
  rows: ParsedClientRow[],
  { existingClients }: ValidateOptions
): ValidatedRow[] => {
  // Build DB dedup sets
  const dbEmails = new Set<string>();
  const dbPhones = new Set<string>();
  const dbNameCompany = new Set<string>();
  for (const c of existingClients) {
    if (c.client_email) dbEmails.add(norm(c.client_email));
    if (c.client_phone) {
      const p = normPhone(c.client_phone);
      if (p) dbPhones.add(p);
    }
    dbNameCompany.add(nameCompanyKey(c.client_name || '', c.client_company || ''));
  }

  // Track in-file occurrences
  const seenEmails = new Map<string, number>();
  const seenPhones = new Map<string, number>();
  const seenNameCompany = new Map<string, number>();

  return rows.map((row) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // name required
    if (!row.name) errors.push('Name is required');

    // email format if present
    if (row.email) {
      const r = emailSchema.safeParse(row.email);
      if (!r.success) errors.push('Invalid email format');
    } else {
      warnings.push('No email — a placeholder will be used');
    }

    if (errors.length > 0) {
      return { row, status: 'invalid' as RowStatus, errors, warnings };
    }

    // duplicate detection — DB first
    const e = norm(row.email);
    const p = normPhone(row.phone);
    const nc = nameCompanyKey(row.name, row.company);

    if (e && dbEmails.has(e)) {
      return {
        row,
        status: 'duplicate' as RowStatus,
        errors,
        warnings,
        duplicateReason: 'in-database',
        duplicateMatch: `email: ${row.email}`,
      };
    }
    if (p && dbPhones.has(p)) {
      return {
        row,
        status: 'duplicate' as RowStatus,
        errors,
        warnings,
        duplicateReason: 'in-database',
        duplicateMatch: `phone: ${row.phone}`,
      };
    }
    if (dbNameCompany.has(nc) && row.name && row.company) {
      return {
        row,
        status: 'duplicate' as RowStatus,
        errors,
        warnings,
        duplicateReason: 'in-database',
        duplicateMatch: `name + company`,
      };
    }

    // in-file dedup
    if (e && seenEmails.has(e)) {
      return {
        row,
        status: 'duplicate' as RowStatus,
        errors,
        warnings,
        duplicateReason: 'in-file',
        duplicateMatch: `email: ${row.email}`,
      };
    }
    if (p && seenPhones.has(p)) {
      return {
        row,
        status: 'duplicate' as RowStatus,
        errors,
        warnings,
        duplicateReason: 'in-file',
        duplicateMatch: `phone: ${row.phone}`,
      };
    }
    if (row.name && row.company && seenNameCompany.has(nc)) {
      return {
        row,
        status: 'duplicate' as RowStatus,
        errors,
        warnings,
        duplicateReason: 'in-file',
        duplicateMatch: `name + company`,
      };
    }

    if (e) seenEmails.set(e, row.rowIndex);
    if (p) seenPhones.set(p, row.rowIndex);
    if (row.name && row.company) seenNameCompany.set(nc, row.rowIndex);

    return { row, status: 'valid' as RowStatus, errors, warnings };
  });
};
