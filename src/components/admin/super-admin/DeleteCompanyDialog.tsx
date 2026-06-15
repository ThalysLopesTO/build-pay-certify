import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';

interface DelCompany {
  id: string;
  name: string;
  member_count?: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: DelCompany | null;
  onConfirm: (companyId: string, confirmName: string) => void;
  isProcessing: boolean;
}

export const DeleteCompanyDialog: React.FC<Props> = ({ open, onOpenChange, company, onConfirm, isProcessing }) => {
  const [typed, setTyped] = useState('');

  useEffect(() => { if (open) setTyped(''); }, [open]);

  if (!company) return null;
  const matches = typed.trim() === company.name.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700">
            <span className="p-1.5 rounded-lg bg-red-100"><AlertTriangle className="h-4 w-4 text-red-600" /></span>
            Delete company permanently
          </DialogTitle>
          <DialogDescription className="sr-only">Permanently delete {company.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="rounded-xl border border-red-200 bg-red-50 p-3.5">
            <p className="text-sm text-red-800 font-medium">This cannot be undone.</p>
            <p className="text-sm text-red-700 mt-1 leading-snug">
              This permanently removes <span className="font-semibold">{company.name}</span>
              {company.member_count != null ? <> and all <span className="font-semibold">{company.member_count}</span> of its members</> : ' and all of its members'},
              including every login account and all company data (jobsites, timesheets, invoices, etc.).
            </p>
          </div>

          <div>
            <Label className="text-xs font-medium text-slate-600">
              Type <span className="font-bold text-slate-800">{company.name}</span> to confirm
            </Label>
            <Input
              value={typed}
              onChange={e => setTyped(e.target.value)}
              placeholder={company.name}
              className="mt-1.5 h-9"
              autoFocus
              autoComplete="off"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>Cancel</Button>
          <Button
            onClick={() => onConfirm(company.id, typed.trim())}
            disabled={!matches || isProcessing}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isProcessing ? 'Deleting…' : 'Delete permanently'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteCompanyDialog;
