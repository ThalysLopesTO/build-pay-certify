
import React from 'react';
import { 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { groupedForemanItems } from './sidebar/foremanMenuData';

interface ForemanSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const ForemanSidebar = ({ activeTab, setActiveTab }: ForemanSidebarProps) => {
  const sections = [
    { title: 'Timesheet', items: groupedForemanItems.timesheet },
    { title: 'Materials', items: groupedForemanItems.materials },
    { title: 'Team', items: groupedForemanItems.team },
    { title: 'Company', items: groupedForemanItems.company },
    { title: 'Reports', items: groupedForemanItems.reports },
    { title: 'Account', items: groupedForemanItems.account },
  ];

  return (
    <Sidebar className="sidebar-modern">
      <SidebarContent>
        {sections.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              {section.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const IconComponent = item.icon;
                  const isActive = activeTab === item.id;
                  
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => setActiveTab(item.id)}
                        className={`sidebar-item rounded-md ${isActive ? 'sidebar-item-active' : ''}`}
                      >
                        <IconComponent className="h-5 w-5" />
                        <span className="font-medium">{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
};

export default ForemanSidebar;
