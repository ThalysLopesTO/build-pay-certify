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
        className="text-sm font-bold text-gray-900 mb-2 px-2 cursor-pointer hover:bg-gray-100 rounded-md py-1 transition-colors duration-200 flex items-center justify-between group"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-gray-600" />
          <span>{label}</span>
        </div>
        <ChevronDown 
          className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
            isExpanded ? 'rotate-0' : '-rotate-90'
          }`} 
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
                      relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                      transition-colors duration-200 hover:bg-white hover:text-black
                      ${isActive 
                        ? 'bg-blue-50 text-blue-900 font-medium border-l-4 border-blue-500 shadow-sm' 
                        : 'text-gray-700'
                      }
                    `}
                  >
                    <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                    <span className="truncate">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      )}
      
      {/* Subtle divider between sections */}
      <div className="mt-3 mx-2 border-b border-sidebar-border"></div>
    </SidebarGroup>
  );
};

export default ForemanCollapsibleSidebarSection;