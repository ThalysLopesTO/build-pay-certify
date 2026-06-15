import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { MenuItem } from './types';

interface CollapsibleSidebarSectionProps {
  items: MenuItem[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  label: string;
  icon?: React.ComponentType<any>;
  defaultExpanded?: boolean;
  storageKey?: string;
}

const CollapsibleSidebarSection = ({ 
  items, 
  activeTab, 
  setActiveTab, 
  label, 
  icon: SectionIcon,
  defaultExpanded = false,
  storageKey
}: CollapsibleSidebarSectionProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Check if any item in this section is active
  const hasActiveItem = items.some(item => 
    activeTab === (item.id || item.title.toLowerCase().replace(/\s+/g, '-'))
  );

  // Check if we're on mobile/tablet
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize expanded state - mobile defaults to collapsed unless active
  const getInitialExpanded = () => {
    if (storageKey) {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        return JSON.parse(stored);
      }
    }
    
    // On mobile, only expand if there's an active item, otherwise use defaultExpanded for desktop
    if (isMobile) {
      return hasActiveItem;
    }
    
    return hasActiveItem || defaultExpanded;
  };

  const [isExpanded, setIsExpanded] = useState(getInitialExpanded);

  // Update localStorage when expanded state changes
  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(isExpanded));
    }
  }, [isExpanded, storageKey]);

  // Auto-expand if an item becomes active
  useEffect(() => {
    if (hasActiveItem && !isExpanded) {
      setIsExpanded(true);
    }
  }, [hasActiveItem, isExpanded]);

  // Filter items based on user role
  const filteredItems = items.filter(item => {
    if (!item.requiredRoles) return true;
    return user?.role && item.requiredRoles.includes(user.role);
  });

  if (filteredItems.length === 0) return null;

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <SidebarGroup className="mt-2">
      <SidebarGroupLabel
        className={`
          flex items-center justify-between h-auto px-2.5 py-2 text-[11px] font-bold uppercase tracking-wider
          rounded-lg cursor-pointer transition-colors duration-200
          ${hasActiveItem ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600'}
        `}
        onClick={toggleExpanded}
      >
        <div className="flex items-center gap-2">
          {SectionIcon && (
            <SectionIcon className={`h-3.5 w-3.5 ${hasActiveItem ? 'text-orange-500' : 'text-slate-400'}`} />
          )}
          <span>{label}</span>
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'} ${hasActiveItem ? 'text-orange-400' : 'text-slate-300'}`}
        />
      </SidebarGroupLabel>

      <SidebarGroupContent 
        className={`
          transition-all duration-300 ease-in-out overflow-hidden
          ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <SidebarMenu className="space-y-1 mt-1">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === (item.id || item.title.toLowerCase().replace(/\s+/g, '-'));
            
            return (
              <SidebarMenuItem key={item.id || item.title} data-sidebar-item={item.id || item.title.toLowerCase().replace(/\s+/g, '-')}>
                <SidebarMenuButton
                  onClick={() => {
                    if (item.href) {
                      navigate(item.href);
                    } else {
                      // setActiveTab navigates to /admin/<tabId> (see AdminLayout)
                      setActiveTab(item.id || item.title.toLowerCase().replace(/\s+/g, '-'));
                    }
                  }}
                  className={`
                    h-auto w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-sm
                    transition-all duration-200 group
                    ${isActive
                      ? 'bg-white shadow-md text-slate-900 font-semibold'
                      : 'text-slate-500 hover:bg-white/70 hover:text-slate-900'
                    }
                  `}
                >
                  <span className={`flex items-center justify-center h-9 w-9 rounded-xl flex-shrink-0 transition-all ${isActive ? 'bg-gradient-to-br from-orange-500 to-amber-500 shadow-md shadow-orange-500/30' : 'bg-white shadow-sm group-hover:shadow'}`}>
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-orange-500'}`} />
                  </span>
                  <span className="truncate font-medium">{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

export default CollapsibleSidebarSection;