import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, CalendarPlus } from 'lucide-react';
import { SubscriptionUpdate } from '@/hooks/super-admin/useManageSubscription';

interface SubCompany {
  id: string;
  name: string;
  plan?: string | null;
  subscription_status?: string | null;
  status?: string | null;
  expiration_date?: string | null;
  trial_end_date?: string | null;
  employee_limit?: number | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: SubCompany | null;
  onConfirm: (companyId: string, updates: SubscriptionUpdate) => void;
  isProcessing: boolean;
}

const PLAN_OPTIONS = ['Free', 'Starter', 'Pro', 'Enterprise'];
const SUB_STATUS_OPTIONS = ['active', 'trial', 'past_due', 'expired', 'cancelled'];

const toDateInput = (iso?: string | null) => (iso ? new Date(iso).toISOString().slice(0, 10) : '');
const toIso = (d: string) => (d ? new Date(d + 'T00:00:00').toISOString() : null);
const addDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

export const ManageSubscriptionDialog: React.FC<Props> = ({ open, onOpenChange, company, onConfirm, isProcessing }) => {
  const [plan, setPlan] = useState('Free');
  const [subStatus, setSubStatus] = useState('active');
  const [companyStatus, setCompanyStatus] = useState('active');
  const [expiration, setExpiration] = useState('');
  const [trialEnd, setTrialEnd] = useState('');
  const [seatLimit, setSeatLimit] = useState('');

  useEffect(() => {
    if (company) {
      setPlan(company.plan || 'Free');
      setSubStatus(company.subscription_status || 'active');
      setCompanyStatus(company.status || 'active');
      setExpiration(toDateInput(company.expiration_date));
      setTrialEnd(toDateInput(company.trial_end_date));
      setSeatLimit(company.employee_limit != null ? String(company.employee_limit) : '');
    }
  }, [company]);

  if (!company) return null;

  const handleSave = () => {
    onConfirm(company.id, {
      plan,
      subscription_status: subStatus,
      status: companyStatus,
      expiration_date: toIso(expiration),
      trial_end_date: toIso(trialEnd),
      employee_limit: seatLimit ? Number(seatLimit) : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-orange-100">
              <CreditCard className="h-4 w-4 text-orange-600" />
            </span>
            Manage Membership
          </DialogTitle>
          <DialogDescription>{company.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Quick actions */}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" className="h-8 text-xs"
              onClick={() => setExpiration(addDays(30))}>
              <CalendarPlus className="h-3.5 w-3.5 mr-1.5" /> Extend +30d
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-8 text-xs"
              onClick={() => setExpiration(addDays(90))}>
              <CalendarPlus className="h-3.5 w-3.5 mr-1.5" /> +90d
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-8 text-xs"
              onClick={() => { setSubStatus('trial'); setTrialEnd(addDays(14)); }}>
              Start 14-day trial
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-medium text-slate-600">Plan</Label>
              <Select value={plan} onValueChange={setPlan}>
                <SelectTrigger className="mt-1.5 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLAN_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-600">Subscription status</Label>
              <Select value={subStatus} onValueChange={setSubStatus}>
                <SelectTrigger className="mt-1.5 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUB_STATUS_OPTIONS.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-600">Expiry / next billing</Label>
              <Input type="date" value={expiration} onChange={e => setExpiration(e.target.value)} className="mt-1.5 h-9" />
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-600">Trial end</Label>
              <Input type="date" value={trialEnd} onChange={e => setTrialEnd(e.target.value)} className="mt-1.5 h-9" />
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-600">Seat limit</Label>
              <Input type="number" min={0} placeholder="Unlimited" value={seatLimit} onChange={e => setSeatLimit(e.target.value)} className="mt-1.5 h-9" />
            </div>
            <div>
              <Label className="text-xs font-medium text-slate-600">Access</Label>
              <Select value={companyStatus} onValueChange={setCompanyStatus}>
                <SelectTrigger className="mt-1.5 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="revoked">Revoked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>Cancel</Button>
          <Button onClick={handleSave} disabled={isProcessing} className="bg-orange-600 hover:bg-orange-700 text-white">
            {isProcessing ? 'Saving…' : 'Save membership'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageSubscriptionDialog;
