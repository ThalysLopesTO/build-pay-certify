// Bulk-import valid client rows in batches, respecting RLS via company_id.

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { composeAddress, type ParsedClientRow } from '@/lib/clients/importParser';

const BATCH_SIZE = 200;

export interface ImportResult {
  total: number;
  imported: number;
  failed: number;
  errors: string[];
}

const buildPayload = (companyId: string, row: ParsedClientRow) => {
  const email =
    row.email && row.email.trim().length > 0
      ? row.email.trim()
      : `no-email-${crypto.randomUUID()}@import.local`;
  const address = composeAddress(row);
  const notes = row.notes.trim();
  const fullAddress = notes ? [address, `Notes: ${notes}`].filter(Boolean).join(' — ') : address;

  return {
    company_id: companyId,
    client_name: row.name.trim(),
    client_company: row.company.trim() || null,
    client_email: email,
    client_phone: row.phone.trim() || null,
    client_address: fullAddress || null,
  };
};

export const useImportClients = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1

  const importRows = useCallback(
    async (rows: ParsedClientRow[]): Promise<ImportResult> => {
      const result: ImportResult = { total: rows.length, imported: 0, failed: 0, errors: [] };
      if (!user?.companyId || rows.length === 0) return result;

      setIsImporting(true);
      setProgress(0);

      try {
        const companyId = user.companyId;
        const total = rows.length;
        let processed = 0;

        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
          const chunk = rows.slice(i, i + BATCH_SIZE).map((r) => buildPayload(companyId, r));
          const { data, error } = await supabase.from('clients').insert(chunk).select('id');
          if (error) {
            result.failed += chunk.length;
            result.errors.push(error.message);
          } else {
            result.imported += data?.length ?? chunk.length;
          }
          processed += chunk.length;
          setProgress(processed / total);
        }
      } finally {
        await queryClient.invalidateQueries({ queryKey: ['clients'] });
        setIsImporting(false);
      }

      return result;
    },
    [user?.companyId, queryClient]
  );

  return { importRows, isImporting, progress };
};
