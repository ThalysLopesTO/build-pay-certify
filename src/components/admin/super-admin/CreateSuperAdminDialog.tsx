import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import { useCreateSuperAdmin } from '@/hooks/super-admin/useCreateSuperAdmin';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const genPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  return Array.from({ length: 14 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

export const CreateSuperAdminDialog: React.FC<Props> = ({ open, onOpenChange }) => {
  const create = useCreateSuperAdmin();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (open) {
      setFirstName(''); setLastName(''); setEmail(''); setPassword(genPassword());
    }
  }, [open]);

  const valid = /\S+@\S+\.\S+/.test(email) && password.trim().length >= 8;

  const handleCreate = () => {
    create.mutate(
      { email: email.trim(), password: password.trim(), firstName: firstName.trim(), lastName: lastName.trim() },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-violet-100"><ShieldCheck className="h-4 w-4 text-violet-600" /></span>
            New Super Admin
          </DialogTitle>
          <DialogDescription>
            Creates a platform owner with full access. They can sign in at <span className="font-medium">/super-admin/login</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium text-slate-600">First name</Label>
              <Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jane" className="mt-1.5 h-9" />
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-600">Last name</Label>
              <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Doe" className="mt-1.5 h-9" />
            </div>
          </div>
          <div>
            <Label className="text-xs font-medium text-slate-600">Email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@stackbuild.ca" className="mt-1.5 h-9" autoComplete="off" />
          </div>
          <div>
            <Label className="text-xs font-medium text-slate-600">Temporary password</Label>
            <div className="flex gap-2 mt-1.5">
              <Input type="text" value={password} onChange={e => setPassword(e.target.value)} className="h-9 font-mono text-sm" autoComplete="off" />
              <Button type="button" variant="outline" size="sm" className="h-9 px-2.5" onClick={() => setPassword(genPassword())} title="Generate">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Share this securely — they can change it after signing in.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={create.isPending}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!valid || create.isPending} className="bg-violet-600 hover:bg-violet-700 text-white">
            {create.isPending ? 'Creating…' : 'Create Super Admin'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSuperAdminDialog;
