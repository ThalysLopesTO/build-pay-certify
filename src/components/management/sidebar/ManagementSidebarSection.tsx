import React from 'react';
import { useNavigate } from 'react-router-dom';
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

interface ManagementSidebarSectionProps {
  items: MenuItem[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const ManagementSidebarSection = ({ items, activeTab, setActiveTab }: ManagementSidebarSectionProps) => {
  const navigate = useNavigate();
  
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
                      navigate(`?tab=${item.id}`, { replace: true });
                    }
                  }}
                  className={`
                    relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                    transition-colors duration-200 hover:bg-white hover:text-black
                    ${isActive 
                      ? 'bg-blue-50 text-blue-900 font-medium border-l-4 border-blue-500 shadow-sm' 
                      : 'text-gray-900 font-medium'
                    }
                  `}
                >
                  <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-700'}`} />
                  <span className="truncate">{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

export default ManagementSidebarSection;