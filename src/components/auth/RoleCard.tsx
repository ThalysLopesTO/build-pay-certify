import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RoleCardProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  ctaLabel: string;
  onClick: () => void;
  colorVariant: 'orange' | 'blue';
  'aria-label': string;
}

const RoleCard: React.FC<RoleCardProps> = ({
  icon: Icon,
  title,
  subtitle,
  ctaLabel,
  onClick,
  colorVariant,
  'aria-label': ariaLabel
}) => {
  const iconBgColor = colorVariant === 'orange' 
    ? 'bg-orange-100 text-orange-600' 
    : 'bg-blue-100 text-blue-600';
  
  const buttonColor = colorVariant === 'orange'
    ? 'bg-orange-600 hover:bg-orange-700'
    : 'bg-blue-600 hover:bg-blue-700';

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <motion.div
      className="group cursor-pointer"
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div
        className="p-6 border-2 border-slate-200 rounded-2xl hover:border-slate-300 transition-all duration-300 bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-xl focus-within:ring-2 focus-within:ring-orange-500 focus-within:ring-opacity-50"
        onClick={onClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={ariaLabel}
      >
        <div className="flex items-center mb-4 gap-2">
          <div className={`p-3 rounded-full ${iconBgColor}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
            <p className="text-sm text-slate-600">{subtitle}</p>
          </div>
        </div>
        <Button 
          className={`w-full ${buttonColor} text-white font-semibold transition-colors`}
          aria-label={ctaLabel}
        >
          {ctaLabel}
        </Button>
      </div>
    </motion.div>
  );
};

export default RoleCard;