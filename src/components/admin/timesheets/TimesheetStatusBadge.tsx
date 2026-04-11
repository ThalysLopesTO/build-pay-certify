import { BadgeWithDot, type BadgeColor } from '@/components/base/badges/badges';

interface TimesheetStatusBadgeProps {
  status: string;
}

const statusMap: Record<string, { color: BadgeColor; label: string }> = {
  approved: { color: 'success', label: 'Approved' },
  pending: { color: 'gray', label: 'Pending' },
  rejected: { color: 'error', label: 'Rejected' },
  manual_entry: { color: 'blue', label: 'Manual Entry' },
};

const TimesheetStatusBadge: React.FC<TimesheetStatusBadgeProps> = ({ status }) => {
  const config = statusMap[status.toLowerCase()] ?? { color: 'gray' as BadgeColor, label: status };

  return (
    <BadgeWithDot color={config.color} size="sm">
      {config.label}
    </BadgeWithDot>
  );
};

export default TimesheetStatusBadge;
