import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { InvoiceAttachment } from '@/components/admin/types/invoice';

// invoice_attachments is not in the generated Supabase types yet
const attachmentsTable = () => supabase.from('invoice_attachments' as any) as any;

export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB per file

export const isImageAttachment = (att: Pick<InvoiceAttachment, 'file_type' | 'file_name'>) =>
  (att.file_type || '').startsWith('image/') ||
  /\.(png|jpe?g|gif|webp)$/i.test(att.file_name);

export const formatFileSize = (bytes: number | null | undefined): string => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const fetchInvoiceAttachments = async (invoiceId: string): Promise<InvoiceAttachment[]> => {
  const { data, error } = await attachmentsTable()
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching invoice attachments:', error);
    return [];
  }
  return (data || []) as InvoiceAttachment[];
};

export const uploadInvoiceAttachments = async (
  files: File[],
  invoiceId: string,
  companyId: string
): Promise<InvoiceAttachment[]> => {
  const uploaded: InvoiceAttachment[] = [];

  for (const file of files) {
    const safeName = file.name.replace(/[^\w.\-]+/g, '_');
    const path = `${companyId}/${invoiceId}/${crypto.randomUUID()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from('invoice-attachments')
      .upload(path, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      console.error('Error uploading invoice attachment:', file.name, uploadError);
      throw new Error(`Failed to upload attachment "${file.name}": ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from('invoice-attachments')
      .getPublicUrl(path);

    const { data: row, error: insertError } = await attachmentsTable()
      .insert({
        invoice_id: invoiceId,
        company_id: companyId,
        file_name: file.name,
        file_url: publicUrlData.publicUrl,
        file_type: file.type || null,
        file_size: file.size,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error saving invoice attachment record:', insertError);
      throw new Error(`Failed to save attachment "${file.name}": ${insertError.message}`);
    }

    uploaded.push(row as InvoiceAttachment);
  }

  return uploaded;
};

export const deleteInvoiceAttachment = async (attachment: InvoiceAttachment): Promise<void> => {
  const { error } = await attachmentsTable().delete().eq('id', attachment.id);
  if (error) throw error;

  // Best-effort storage cleanup; the DB record is the source of truth
  const marker = '/invoice-attachments/';
  const idx = attachment.file_url.indexOf(marker);
  if (idx !== -1) {
    const path = decodeURIComponent(attachment.file_url.slice(idx + marker.length));
    const { error: storageError } = await supabase.storage
      .from('invoice-attachments')
      .remove([path]);
    if (storageError) {
      console.warn('Could not remove attachment file from storage:', storageError);
    }
  }
};

export const useInvoiceAttachments = (invoiceId: string | undefined) => {
  return useQuery({
    queryKey: ['invoice-attachments', invoiceId],
    queryFn: () => fetchInvoiceAttachments(invoiceId!),
    enabled: !!invoiceId,
  });
};

export const useDeleteInvoiceAttachment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteInvoiceAttachment,
    onSuccess: (_, attachment) => {
      queryClient.invalidateQueries({ queryKey: ['invoice-attachments', attachment.invoice_id] });
    },
  });
};
