import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Building2, Users, DollarSign, Settings, BarChart3, Bell, Package, CreditCard, FileText, SlidersHorizontal,
} from 'lucide-react';
import { CompanySettingsTab } from './system-settings/CompanySettingsTab';
import { CompanyRulesTab } from './system-settings/CompanyRulesTab';
import { UserRolesTab } from './system-settings/UserRolesTab';
import { FinancialDefaultsTab } from './system-settings/FinancialDefaultsTab';
import { AdvancedControlsTab } from './system-settings/AdvancedControlsTab';
import { AnalyticsControlTab } from './system-settings/AnalyticsControlTab';
import { ReminderLogsTab } from './system-settings/ReminderLogsTab';
import { PaymentsTab } from './system-settings/PaymentsTab';
import MaterialCatalogManagement from './material-catalog/MaterialCatalogManagement';

interface SettingsSection {
  id: string;
  label: string;
  desc: string;
  icon: React.ElementType;
  render: () => React.ReactNode;
}

const SECTION_GROUPS: { group: string; items: SettingsSection[] }[] = [
  {
    group: 'General',
    items: [
      { id: 'company',  label: 'Company Profile', desc: 'Business details, branding, scheduling & tax info', icon: Building2, render: () => <CompanySettingsTab /> },
      { id: 'rules',    label: 'Company Rules',   desc: 'Policies and rules shown to your crew',            icon: FileText,  render: () => <CompanyRulesTab /> },
    ],
  },
  {
    group: 'Finance',
    items: [
      { id: 'financial', label: 'Financial Defaults', desc: 'Pay rates, taxes and invoice defaults',          icon: DollarSign, render: () => <FinancialDefaultsTab /> },
      { id: 'payments',  label: 'Payments',           desc: 'Connect Stripe to accept invoice payments online', icon: CreditCard, render: () => <PaymentsTab /> },
    ],
  },
  {
    group: 'Team',
    items: [
      { id: 'roles', label: 'Roles & Access', desc: 'Control what each role can see and do', icon: Users, render: () => <UserRolesTab /> },
    ],
  },
  {
    group: 'Operations',
    items: [
      { id: 'materials', label: 'Material Catalog', desc: 'Your reusable materials and pricing',   icon: Package, render: () => <MaterialCatalogManagement /> },
      { id: 'reminders', label: 'Reminder Logs',    desc: 'History of automated invoice & quote reminders', icon: Bell, render: () => <ReminderLogsTab /> },
    ],
  },
  {
    group: 'System',
    items: [
      { id: 'analytics', label: 'Analytics', desc: 'Usage analytics controls',          icon: BarChart3,        render: () => <AnalyticsControlTab /> },
      { id: 'advanced',  label: 'Advanced',  desc: 'Webhooks and developer options',     icon: SlidersHorizontal, render: () => <AdvancedControlsTab /> },
    ],
  },
];

const ALL_SECTIONS = SECTION_GROUPS.flatMap(g => g.items);

const SystemSettings = () => {
  const [searchParams] = useSearchParams();
  const [activeId, setActiveId] = useState('company');

  // Auto-select Payments when returning from Stripe onboarding.
  useEffect(() => {
    const stripeParam = searchParams.get('stripe');
    if (stripeParam === 'return' || stripeParam === 'refresh') {
      setActiveId('payments');
    }
  }, [searchParams]);

  const active = ALL_SECTIONS.find(s => s.id === activeId) ?? ALL_SECTIONS[0];
  const ActiveIcon = active.icon;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-orange-100">
          <Settings className="h-6 w-6 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Company Settings</h1>
          <p className="text-slate-500 text-sm">Set up your company, finances, team and automations.</p>
        </div>
      </div>

      {/* Mobile section picker */}
      <div className="lg:hidden mb-4">
        <Select value={activeId} onValueChange={setActiveId}>
          <SelectTrigger className="h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SECTION_GROUPS.map(group => (
              <React.Fragment key={group.group}>
                {group.items.map(item => (
                  <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>
                ))}
              </React.Fragment>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
        {/* Sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-4 space-y-5">
            {SECTION_GROUPS.map(group => (
              <div key={group.group}>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 mb-1.5">{group.group}</p>
                <div className="space-y-0.5">
                  {group.items.map(item => {
                    const Icon = item.icon;
                    const isActive = item.id === activeId;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveId(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                          isActive ? 'bg-orange-50 text-orange-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-orange-600' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Content */}
        <div className="min-w-0">
          <div className="mb-5 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-50 flex-shrink-0">
              <ActiveIcon className="h-5 w-5 text-orange-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-900 leading-tight">{active.label}</h2>
              <p className="text-sm text-slate-500">{active.desc}</p>
            </div>
          </div>
          {active.render()}
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
