import React from 'react';
import { BadgeWithDot, type BadgeColor, type BadgeType } from '@/components/base/badges/badges';

// Map status strings to BadgeWithDot props
type StatusConfig = { color: BadgeColor; type?: BadgeType; customColor?: string };

const materialStatusMap: Record<string, StatusConfig> = {
  pending: { color: 'warning' },
  ordered: { color: 'blue' },
  delivered: { color: 'success' },
  archived: { color: 'gray' },
};

const punchStatusMap: Record<string, StatusConfig & { pulse?: boolean }> = {
  in: { color: 'success', pulse: true },
  'clocked in': { color: 'success', pulse: true },
  active: { color: 'success', pulse: true },
  out: { color: 'success' },
  'clocked out': { color: 'success' },
  completed: { color: 'success' },
  edited: { color: 'orange' },
  missed: { color: 'error' },
};

const invoiceStatusMap: Record<string, StatusConfig> = {
  pending: { color: 'warning' },
  sent: { color: 'blue' },
  paid: { color: 'success' },
  overdue: { color: 'error' },
};

const reportStatusMap: Record<string, StatusConfig> = {
  pending: { color: 'warning' },
  reviewed: { color: 'success' },
};

const typeMaps = {
  material: materialStatusMap,
  punch: punchStatusMap,
  timesheet: punchStatusMap,
  invoice: invoiceStatusMap,
  report: reportStatusMap,
} as const;

export const StatusBadge: React.FC<{
  status: string;
  type?: 'material' | 'punch' | 'timesheet' | 'invoice' | 'report';
  className?: string;
}> = ({ status, type = 'material', className }) => {
  const map = typeMaps[type] as Record<string, StatusConfig & { pulse?: boolean }>;
  const config = map[status.toLowerCase().trim()] ?? { color: 'gray' as BadgeColor };

  return (
    <BadgeWithDot
      color={config.color}
      type={config.type ?? 'pill-color'}
      customColor={config.customColor}
      pulse={(config as any).pulse}
      size="sm"
      className={className}
    >
      {status}
    </BadgeWithDot>
  );
};

// Convenience components
export const MaterialStatusBadge: React.FC<{ status: string; className?: string }> = ({ status, className }) => (
  <StatusBadge status={status} type="material" className={className} />
);

export const PunchStatusBadge: React.FC<{ status: string; className?: string }> = ({ status, className }) => (
  <StatusBadge status={status} type="punch" className={className} />
);

export const TimesheetStatusBadge: React.FC<{ status: string; className?: string }> = ({ status, className }) => (
  <StatusBadge status={status} type="timesheet" className={className} />
);

export const InvoiceStatusBadge: React.FC<{ status: string; className?: string }> = ({ status, className }) => (
  <StatusBadge status={status} type="invoice" className={className} />
);

export const ReportStatusBadge: React.FC<{ status: string; className?: string }> = ({ status, className }) => (
  <StatusBadge status={status} type="report" className={className} />
);
