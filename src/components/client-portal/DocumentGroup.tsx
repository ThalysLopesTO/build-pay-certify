import { ReactNode, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DocumentGroupProps {
  title: string;
  count: number;
  color: 'orange' | 'green' | 'red' | 'gray';
  defaultOpen?: boolean;
  children: ReactNode;
}

const colorMap = {
  orange: 'border-orange-500/20 bg-orange-500/5',
  green: 'border-green-500/20 bg-green-500/5',
  red: 'border-red-500/20 bg-red-500/5',
  gray: 'border-gray-500/20 bg-gray-500/5',
};

const badgeColorMap = {
  orange: 'bg-orange-500 hover:bg-orange-600',
  green: 'bg-green-500 hover:bg-green-600',
  red: 'bg-red-500 hover:bg-red-600',
  gray: 'bg-gray-500 hover:bg-gray-600',
};

export function DocumentGroup({ title, count, color, defaultOpen = true, children }: DocumentGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (count === 0) {
    return null;
  }

  return (
    <div className={cn('border rounded-lg overflow-hidden', colorMap[color])}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Badge className={cn('text-white', badgeColorMap[color])}>
            {count}
          </Badge>
        </div>
        <ChevronDown
          className={cn('h-5 w-5 transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <div className="p-4 space-y-4 animate-in slide-in-from-top-2">
          {children}
        </div>
      )}
    </div>
  );
}
