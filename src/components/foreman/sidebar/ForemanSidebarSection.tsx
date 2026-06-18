import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { menuTitle } from '@/i18n/menuT';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

interface MenuItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  id: string;
}

interface ForemanSidebarSectionProps {
  items: MenuItem[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const ForemanSidebarSection = ({ items, activeTab, setActiveTab }: ForemanSidebarSectionProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  return (
    <SidebarGroup className="mt-2 first:mt-0">
      <SidebarGroupContent>
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

export default ForemanSidebarSection;