import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Circle, X, Rocket, Compass, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';

interface SetupStep {
  id: string;
  label: string;
  hint: string;
  done: boolean;
  href: string;
}

/**
 * First-run setup checklist shown on the admin dashboard until the company is
 * configured. Completion is derived from real data; each step deep-links to the
 * right place, and "Take the tour" launches the guided settings tour.
 */
export const GettingStartedCard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useCompanySettings();
  const { logoUrl } = useCompanyLogo();

  const storageKey = `getting-started-dismissed-${user?.companyId ?? 'x'}`;
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(storageKey) === '1'; } catch { return false; }
  });

  const { data: employeeCount = 0 } = useQuery({
    queryKey: ['getting-started-employees', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) return 0;
      const { count } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', user.companyId)
        .in('role', ['employee', 'foreman', 'management']);
      return count ?? 0;
    },
    enabled: !!user?.companyId,
    staleTime: 5 * 60 * 1000,
  });

  const steps: SetupStep[] = [
    { id: 'company',   label: 'Add your company details', hint: 'Name, address, contact & tax info',     done: !!settings?.company_name && !!settings?.company_address, href: '/admin/company-settings?section=company' },
    { id: 'logo',      label: 'Upload your logo',          hint: 'Appears on invoices & quotes',           done: !!logoUrl,                                              href: '/admin/company-settings?section=company' },
    { id: 'financial', label: 'Set financial defaults',    hint: 'Tax rates & pay/invoice defaults',       done: !!settings?.hst_number,                                  href: '/admin/company-settings?section=financial' },
    { id: 'payments',  label: 'Connect Stripe to get paid', hint: 'Let clients pay invoices by card',      done: !!(settings as any)?.stripe_verified,                    href: '/admin/company-settings?section=payments' },
    { id: 'team',      label: 'Add your team',             hint: 'Invite employees & foremen',             done: employeeCount > 0,                                       href: '/admin/employee-registration' },
  ];

  const completed = steps.filter(s => s.done).length;
  const allDone = completed === steps.length;
  const pct = Math.round((completed / steps.length) * 100);

  if (dismissed || allDone) return null;

  const dismiss = () => {
    try { localStorage.setItem(storageKey, '1'); } catch { /* ignore */ }
    setDismissed(true);
  };

  return (
    <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50/60 shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-md shadow-orange-500/20">
              <Rocket className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Get StackBuild set up</h3>
              <p className="text-xs text-slate-500">{completed} of {steps.length} done · finish these to be ready</p>
            </div>
          </div>
          <button onClick={dismiss} className="text-slate-400 hover:text-slate-600" title="Dismiss" aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress */}
        <div className="mt-3 h-2 rounded-full bg-white/70 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>

        {/* Steps */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {steps.map(step => (
            <button
              key={step.id}
              onClick={() => navigate(step.href)}
              className={`group flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                step.done ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 bg-white hover:border-orange-300 hover:bg-orange-50/40'
              }`}
            >
              {step.done
                ? <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                : <Circle className="h-5 w-5 text-slate-300 flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${step.done ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{step.label}</p>
                <p className="text-[11px] text-slate-400 truncate">{step.hint}</p>
              </div>
              {!step.done && <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />}
            </button>
          ))}
        </div>

        {/* Tour CTA */}
        <button
          onClick={() => navigate('/admin/company-settings?tour=1')}
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-orange-700 hover:text-orange-800"
        >
          <Compass className="h-4 w-4" /> Take the 1-minute setup tour
        </button>
      </div>
    </div>
  );
};

export default GettingStartedCard;
