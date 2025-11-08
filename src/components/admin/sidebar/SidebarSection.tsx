
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { MenuItem } from './types';

interface SidebarSectionProps {
  items: MenuItem[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  label?: string;
}

const SidebarSection = ({ items, activeTab, setActiveTab, label }: SidebarSectionProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Filter items based on user role
  const filteredItems = items.filter(item => {
    if (!item.requiredRoles) return true;
    return user?.role && item.requiredRoles.includes(user.role);
  });

  if (filteredItems.length === 0) return null;

  return (
    <SidebarGroup className="mt-4 first:mt-2">
      {label && (
        <SidebarGroupLabel className="text-sm font-bold text-gray-900 mb-2 px-2">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu className="space-y-1">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === (item.id || item.title.toLowerCase().replace(/\s+/g, '-'));
            
            return (
              <SidebarMenuItem key={item.id || item.title}>
                <SidebarMenuButton
                  onClick={() => {
                    if (item.href) {
                      navigate(item.href);
                    } else {
                      setActiveTab(item.id || item.title.toLowerCase().replace(/\s+/g, '-'));
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
                  <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                  <span className="truncate">{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
      
      {/* Subtle divider between sections */}
      <div className="mt-3 mx-2 border-b border-sidebar-border"></div>
    </SidebarGroup>
  );
};

export default SidebarSection;
