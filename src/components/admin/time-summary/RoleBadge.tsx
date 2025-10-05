import { Badge } from '@/components/ui/badge';

interface RoleBadgeProps {
  role?: string | null;
  position?: string | null;
  trade?: string | null;
}

export const RoleBadge = ({ role, position, trade }: RoleBadgeProps) => {
  // Priority: position > trade > role
  const displayText = position || trade || role;
  
  if (!displayText) return null;

  // Determine color based on role/position
  const getVariant = () => {
    const text = displayText.toLowerCase();
    
    if (text.includes('foreman')) return 'default'; // primary blue
    if (text.includes('lead')) return 'secondary'; // yellow/amber
    if (text.includes('framer')) return 'outline'; // green
    if (text.includes('super') || text.includes('admin')) return 'destructive'; // red
    
    return 'outline'; // default gray
  };

  const getBgColor = () => {
    const text = displayText.toLowerCase();
    
    if (text.includes('foreman')) return 'bg-primary/10 text-primary border-primary/20';
    if (text.includes('lead')) return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20';
    if (text.includes('framer')) return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
    if (text.includes('super') || text.includes('admin')) return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20';
    
    return 'bg-muted text-muted-foreground border-muted-foreground/20';
  };

  return (
    <Badge 
      variant={getVariant()} 
      className={`text-xs font-medium ${getBgColor()}`}
    >
      {displayText}
    </Badge>
  );
};
