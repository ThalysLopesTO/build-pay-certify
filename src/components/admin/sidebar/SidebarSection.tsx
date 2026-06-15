
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
        <SidebarGroupLabel className="text-sm font-bold text-slate-900 mb-2 px-2">
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
                      // setActiveTab navigates to /admin/<tabId> (see AdminLayout)
                      setActiveTab(item.id || item.title.toLowerCase().replace(/\s+/g, '-'));
                    }
                  }}
                  className={`
                    relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                    transition-all duration-200
                    ${isActive
                      ? 'bg-orange-50 text-orange-700 font-semibold shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }
                  `}
                >
                  <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-orange-600' : 'text-slate-400'}`} />
                  <span className="truncate">{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
      
      {/* Subtle divider between sections */}
      <div className="mt-3 mx-2 border-b border-slate-200/60"></div>
    </SidebarGroup>
  );
};

export default SidebarSection;
