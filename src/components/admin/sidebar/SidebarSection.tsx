
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
import { useTranslation } from 'react-i18next';
import { menuTitle, sectionTitle } from '@/i18n/menuT';
import { MenuItem } from './types';

interface SidebarSectionProps {
  items: MenuItem[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  label?: string;
}

const SidebarSection = ({ items, activeTab, setActiveTab, label }: SidebarSectionProps) => {
  const { user } = useAuth();
  const { t } = useTranslation();
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
          {sectionTitle(t, label)}
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
                    h-auto w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-sm
                    transition-all duration-200
                    ${isActive
                      ? 'bg-white shadow-md text-slate-900 font-semibold'
                      : 'text-slate-500 hover:bg-white/70 hover:text-slate-900'
                    }
                  `}
                >
                  <span className={`flex items-center justify-center h-9 w-9 rounded-xl flex-shrink-0 transition-all ${isActive ? 'bg-gradient-to-br from-orange-500 to-amber-500 shadow-md shadow-orange-500/30' : 'bg-white shadow-sm'}`}>
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-orange-500'}`} />
                  </span>
                  <span className="truncate">{menuTitle(t, item.id, item.title)}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

export default SidebarSection;
