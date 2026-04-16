import { useEffect, useMemo, useState } from 'react';
import { Download, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ImportDropzone } from './import/ImportDropzone';
import { ImportPreviewTable } from './import/ImportPreviewTable';
import { ImportResultSummary } from './import/ImportResultSummary';
import { parseClientsFile, type ParsedClientRow } from '@/lib/clients/importParser';
import { validateRows, type ValidatedRow } from '@/lib/clients/importValidator';
import { downloadClientTemplate, TEMPLATE_HEADERS } from '@/lib/clients/importTemplate';
import { useImportClients } from '@/hooks/useImportClients';
import { useClients } from '@/hooks/useClients';

interface ImportClientsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'upload' | 'preview' | 'result';

interface FinalResult {
  total: number;
  imported: number;
  skippedDuplicates: number;
  skippedInvalid: number;
  failed: number;
}

export function ImportClientsModal({ isOpen, onClose }: ImportClientsModalProps) {
  const [step, setStep] = useState<Step>('upload');
  const [parsing, setParsing] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedClientRow[]>([]);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [skipInvalid, setSkipInvalid] = useState(true);
  const [finalResult, setFinalResult] = useState<FinalResult | null>(null);

  const { data: existingClients } = useClients();
  const { importRows, isImporting, progress } = useImportClients();

  const validated: ValidatedRow[] = useMemo(() => {
    if (parsedRows.length === 0) return [];
    return validateRows(parsedRows, { existingClients: existingClients ?? [] });
  }, [parsedRows, existingClients]);

  const counts = useMemo(() => {
    let valid = 0,
      duplicate = 0,
      invalid = 0;
    for (const r of validated) {
      if (r.status === 'valid') valid++;
      else if (r.status === 'duplicate') duplicate++;
      else invalid++;
    }
    return { valid, duplicate, invalid };
  }, [validated]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => {
        setStep('upload');
        setParsedRows([]);
        setFinalResult(null);
        setSkipDuplicates(true);
        setSkipInvalid(true);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const handleFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Max 10 MB.');
      return;
    }
    setParsing(true);
    try {
      const rows = await parseClientsFile(file);
      if (rows.length === 0) {
        toast.error('No data rows found. Check that your file has headers in the first row.');
        return;
      }
      setParsedRows(rows);
      setStep('preview');
    } catch (err) {
      console.error('Parse error:', err);
      toast.error('Could not parse the file. Please verify the format.');
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    const toImport: ParsedClientRow[] = [];
    let skippedDuplicates = 0;
    let skippedInvalid = 0;
    for (const v of validated) {
      if (v.status === 'invalid') {
        if (skipInvalid) skippedInvalid++;
        else toImport.push(v.row); // user opted in, but DB will likely reject — counted as failed
      } else if (v.status === 'duplicate') {
        if (skipDuplicates) skippedDuplicates++;
        else toImport.push(v.row);
      } else {
        toImport.push(v.row);
      }
    }

    if (toImport.length === 0) {
      toast.error('Nothing to import with the current options.');
      return;
    }

    const result = await importRows(toImport);
    const final: FinalResult = {
      total: validated.length,
      imported: result.imported,
      skippedDuplicates,
      skippedInvalid,
      failed: result.failed,
    };
    setFinalResult(final);
    setStep('result');

    if (result.imported > 0) {
      toast.success(`Imported ${result.imported} client${result.imported === 1 ? '' : 's'}.`);
    }
    if (result.failed > 0) {
      toast.error(`${result.failed} row${result.failed === 1 ? '' : 's'} failed to import.`);
    }
  };

  const canImport = counts.valid > 0 || (!skipDuplicates && counts.duplicate > 0);

  const handleOpenChange = (open: boolean) => {
    if (!open && !isImporting && !parsing) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Clients</DialogTitle>
          <DialogDescription>
            Upload a spreadsheet (.xlsx, .xls, or .csv) to bulk-import your client list.
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <ImportDropzone onFile={handleFile} disabled={parsing} />

            {parsing && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Parsing file…
              </div>
            )}

            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Need a starting point?</p>
                  <p className="text-xs text-muted-foreground">
                    Download a sample template with the correct headers.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={downloadClientTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>

              <div className="text-xs space-y-1">
                <p className="font-medium">Required column:</p>
                <p className="text-muted-foreground">name</p>
                <p className="font-medium mt-2">Optional columns:</p>
                <p className="text-muted-foreground">
                  {TEMPLATE_HEADERS.filter((h) => h !== 'name').join(', ')}
                </p>
                <p className="text-muted-foreground mt-2">
                  Headers are matched flexibly — "Client Name", "Full Name", "Phone Number", etc. all work.
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <ImportPreviewTable rows={validated} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="skip-dup" className="text-sm">Skip duplicates</Label>
                <Switch id="skip-dup" checked={skipDuplicates} onCheckedChange={setSkipDuplicates} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="skip-inv" className="text-sm">Skip invalid rows</Label>
                <Switch id="skip-inv" checked={skipInvalid} onCheckedChange={setSkipInvalid} />
              </div>
            </div>

            {isImporting && (
              <div className="space-y-2">
                <Progress value={progress * 100} />
                <p className="text-xs text-muted-foreground text-center">
                  Importing… {Math.round(progress * 100)}%
                </p>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => setStep('upload')} disabled={isImporting}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={isImporting || !canImport}>
                {isImporting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importing…</>
                ) : (
                  <><Upload className="h-4 w-4 mr-2" /> Import {counts.valid + (skipDuplicates ? 0 : counts.duplicate)} clients</>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'result' && finalResult && (
          <div className="space-y-4">
            <ImportResultSummary {...finalResult} />
            <DialogFooter>
              <Button onClick={onClose}>Done</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
