import React from 'react';
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
  return (
    <SidebarGroup className="mt-2 first:mt-0">
      <SidebarGroupContent>
        <SidebarMenu className="space-y-1">
          {items.map((item) => {
            const isActive = activeTab === item.id;
            
            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  onClick={() => setActiveTab(item.id)}
                  className={`
                    relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                    transition-colors duration-200 hover:bg-white hover:text-black dark:hover:bg-white dark:hover:text-black
                    ${isActive 
                      ? 'bg-blue-50 text-blue-900 font-medium border-l-4 border-blue-500 shadow-sm dark:bg-blue-900 dark:text-blue-100' 
                      : 'text-gray-700 dark:text-white'
                    }
                  `}
                >
                  <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-300' : 'text-gray-500 dark:text-gray-300'}`} />
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

export default ForemanSidebarSection;