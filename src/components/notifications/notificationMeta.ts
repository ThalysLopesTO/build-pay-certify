import {
  AlertTriangle,
  Award,
  Bell,
  Building2,
  ClipboardList,
  DollarSign,
  FileText,
  Package,
  Upload,
} from 'lucide-react';

export type NotificationTypeMeta = {
  icon: React.ElementType;
  bg: string;
  text: string;
  label: string;
};

/** Shared icon / colour / label per notification type — used by every
 *  notification dropdown so they look identical across roles. */
export const NOTIFICATION_TYPE_META: Record<string, NotificationTypeMeta> = {
  certificate:      { icon: Award,         bg: 'bg-amber-50',   text: 'text-amber-600',   label: 'Certificate' },
  jobsite:          { icon: Building2,      bg: 'bg-blue-50',    text: 'text-blue-600',    label: 'Jobsite' },
  material_request: { icon: Package,        bg: 'bg-purple-50',  text: 'text-purple-600',  label: 'Material Request' },
  attention_report: { icon: AlertTriangle,  bg: 'bg-red-50',     text: 'text-red-600',     label: 'Attention' },
  daily_report:     { icon: ClipboardList,  bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Daily Report' },
  bill_due_soon:    { icon: DollarSign,     bg: 'bg-amber-50',   text: 'text-amber-600',   label: 'Bill Due Soon' },
  bill_overdue:     { icon: DollarSign,     bg: 'bg-red-50',     text: 'text-red-600',     label: 'Bill Overdue' },
  invoice_due_soon: { icon: FileText,       bg: 'bg-orange-50',  text: 'text-orange-600',  label: 'Invoice Due' },
  invoice_overdue:  { icon: FileText,       bg: 'bg-red-50',     text: 'text-red-600',     label: 'Invoice Overdue' },
  progress:         { icon: Upload,         bg: 'bg-blue-50',    text: 'text-blue-600',    label: 'Progress' },
};

export const metaFor = (type: string): NotificationTypeMeta =>
  NOTIFICATION_TYPE_META[type] ?? { icon: Bell, bg: 'bg-slate-100', text: 'text-slate-500', label: 'Notification' };
