import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface RoleTileProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  ctaLabel: string;
  href: string;
  colorVariant: 'orange' | 'blue';
  'aria-label': string;
}

const RoleTile: React.FC<RoleTileProps> = ({
  icon: Icon,
  title,
  subtitle,
  ctaLabel,
  href,
  colorVariant,
  'aria-label': ariaLabel
}) => {
  const navigate = useNavigate();
  
  const iconBgColor = colorVariant === 'orange' 
    ? 'bg-orange-100 text-orange-600' 
    : 'bg-blue-100 text-blue-600';
  
  const buttonColor = colorVariant === 'orange'
    ? 'bg-orange-600 hover:bg-orange-700'
    : 'bg-blue-600 hover:bg-blue-700';

  const handleClick = () => {
    navigate(href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className="group cursor-pointer border border-slate-200 rounded-xl bg-white/80 backdrop-blur-sm p-6 hover:border-slate-300 transition-all duration-200 hover:-translate-y-0.5 focus-within:ring-2 focus-within:ring-orange-500 focus-within:ring-opacity-50"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={ariaLabel}
    >
      <div className="flex items-start space-x-4 mb-6">
        <div className={`p-3 rounded-xl ${iconBgColor}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-800 mb-1">{title}</h3>
          <p className="text-sm text-slate-600">{subtitle}</p>
        </div>
      </div>
      <Button 
        className={`w-full ${buttonColor} text-white font-semibold shadow-lg transition-all duration-200 hover:shadow-xl h-12`}
        aria-label={ctaLabel}
      >
        {ctaLabel}
      </Button>
    </div>
  );
};

export default RoleTile;