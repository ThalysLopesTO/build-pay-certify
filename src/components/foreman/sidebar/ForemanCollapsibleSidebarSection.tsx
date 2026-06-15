import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

interface MenuItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  id: string;
}

interface ForemanCollapsibleSidebarSectionProps {
  items: MenuItem[];
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  defaultExpanded?: boolean;
  storageKey?: string;
}

const ForemanCollapsibleSidebarSection = ({
  items,
  label,
  icon: Icon,
  activeTab,
  setActiveTab,
  defaultExpanded = false,
  storageKey,
}: ForemanCollapsibleSidebarSectionProps) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(() => {
    if (storageKey) {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        return JSON.parse(stored);
      }
    }
    return defaultExpanded;
  });

  // Auto-expand if any item in this section is active
  const hasActiveItem = items.some(item => item.id === activeTab);
  
  useEffect(() => {
    if (hasActiveItem && !isExpanded) {
      setIsExpanded(true);
    }
  }, [hasActiveItem, isExpanded]);

  const toggleExpanded = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(newState));
    }
  };

  return (
    <SidebarGroup className="mt-4 first:mt-2">
      <SidebarGroupLabel
        onClick={toggleExpanded}
        className={`h-auto text-[11px] font-bold uppercase tracking-wider mb-1 px-2.5 py-2 cursor-pointer rounded-lg transition-colors duration-200 flex items-center justify-between ${hasActiveItem ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}
      >
        <div className="flex items-center gap-2">
          <Icon className={`h-3.5 w-3.5 ${hasActiveItem ? 'text-orange-500' : 'text-slate-400'}`} />
          <span>{label}</span>
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'} ${hasActiveItem ? 'text-orange-400' : 'text-slate-300'}`}
        />
      </SidebarGroupLabel>
      
      {isExpanded && (
        <SidebarGroupContent className="animate-accordion-down">
          <SidebarMenu className="space-y-1">
            {items.map((item) => {
              const isActive = activeTab === item.id;
              
              return (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => {
                      if ((item as any).href) {
                        navigate((item as any).href);
                      } else {
                        setActiveTab(item.id);
                      }
                    }}
                    className={`
                      h-auto w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-sm
                      transition-all duration-200
                      ${isActive
                        ? 'bg-white shadow-md text-slate-900 font-semibold'
                        : 'text-slate-500 hover:bg-white/70 hover:text-slate-900'
                      }
                    `}
                  >
                    <span className={`flex items-center justify-center h-9 w-9 rounded-xl flex-shrink-0 transition-all ${isActive ? 'bg-gradient-to-br from-orange-500 to-amber-500 shadow-md shadow-orange-500/30' : 'bg-white shadow-sm'}`}>
                      <item.icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-orange-500'}`} />
                    </span>
                    <span className="truncate">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      )}
      
    </SidebarGroup>
  );
};

export default ForemanCollapsibleSidebarSection;