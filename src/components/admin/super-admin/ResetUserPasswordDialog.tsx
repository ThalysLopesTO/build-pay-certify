import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Key } from 'lucide-react';

interface TargetUser {
  user_id: string;
  email: string | null;
  name: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: TargetUser | null;
  onConfirm: (userId: string, password: string, email: string, name: string) => void;
  isProcessing: boolean;
}

export const ResetUserPasswordDialog: React.FC<Props> = ({ open, onOpenChange, user, onConfirm, isProcessing }) => {
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (open) setPassword('');
  }, [open]);

  if (!user) return null;

  const valid = password.trim().length >= 8;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-orange-100">
              <Key className="h-4 w-4 text-orange-600" />
            </span>
            Reset Password
          </DialogTitle>
          <DialogDescription>
            Set a new password for <span className="font-medium text-slate-700">{user.name}</span>
            {user.email ? ` (${user.email})` : ''}.
          </DialogDescription>
        </DialogHeader>

        <div className="py-1">
          <Label className="text-xs font-medium text-slate-600">New password</Label>
          <Input
            type="text"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="mt-1.5 h-9"
            autoFocus
          />
          {password.length > 0 && !valid && (
            <p className="text-xs text-red-500 mt-1.5">Password must be at least 8 characters.</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>Cancel</Button>
          <Button
            onClick={() => onConfirm(user.user_id, password.trim(), user.email ?? '', user.name)}
            disabled={!valid || isProcessing}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {isProcessing ? 'Resetting…' : 'Reset password'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ResetUserPasswordDialog;
