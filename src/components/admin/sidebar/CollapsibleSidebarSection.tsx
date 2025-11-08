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
          flex items-center justify-between px-3 py-2.5 text-sm font-semibold text-gray-900 
          hover:bg-gray-50 rounded-lg cursor-pointer transition-all duration-200
          hover:shadow-sm active:scale-98
          ${hasActiveItem ? 'text-blue-900 bg-blue-50' : ''}
        `}
        onClick={toggleExpanded}
      >
        <div className="flex items-center gap-2.5">
          {SectionIcon && (
            <SectionIcon className={`h-4 w-4 ${hasActiveItem ? 'text-blue-600' : 'text-gray-500'}`} />
          )}
          <span className="font-medium">{label}</span>
        </div>
        <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </div>
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
                      setActiveTab(item.id || item.title.toLowerCase().replace(/\s+/g, '-'));
                    }
                  }}
                  className={`
                    relative w-full flex items-center gap-3 px-4 py-2.5 ml-2 rounded-lg text-sm
                    transition-all duration-200 hover:bg-white hover:text-black
                    hover:translate-x-1 hover:shadow-sm group
                    ${isActive 
                      ? 'bg-blue-50 text-blue-900 font-medium border-l-4 border-blue-500 shadow-sm translate-x-1' 
                      : 'text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className={`h-4 w-4 flex-shrink-0 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}`} />
                  <span className="truncate font-medium">{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
      
      {/* Subtle divider between sections */}
      <div className="mt-3 mx-2 border-b border-sidebar-border opacity-50"></div>
    </SidebarGroup>
  );
};

export default CollapsibleSidebarSection;