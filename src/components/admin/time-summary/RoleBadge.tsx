import { BadgeWithDot, type BadgeColor } from '@/components/base/badges/badges';

interface RoleBadgeProps {
  role?: string | null;
  position?: string | null;
  trade?: string | null;
}

export const RoleBadge = ({ role, position, trade }: RoleBadgeProps) => {
  const displayText = position || trade || role;
  if (!displayText) return null;

  const getColor = (): BadgeColor => {
    const text = displayText.toLowerCase();
    if (text.includes('foreman')) return 'brand';
    if (text.includes('lead')) return 'warning';
    if (text.includes('framer')) return 'success';
    if (text.includes('super') || text.includes('admin')) return 'error';
    return 'gray';
  };

  return (
    <BadgeWithDot color={getColor()} size="sm" hideDot>
      {displayText}
    </BadgeWithDot>
  );
};
