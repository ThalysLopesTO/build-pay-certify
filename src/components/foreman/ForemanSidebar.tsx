
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
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { HardHat } from 'lucide-react';
import { groupedForemanItems } from './sidebar/foremanMenuData';

interface ForemanSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const ForemanSidebar = ({ activeTab, setActiveTab }: ForemanSidebarProps) => {
  const renderSidebarGroup = (items: any[], label: string) => (
    <SidebarGroup className="mt-4 first:mt-2">
      <SidebarGroupLabel className="text-sm font-bold text-gray-900 dark:text-white mb-2 px-2">
        {label}
      </SidebarGroupLabel>
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
      
      {/* Subtle divider between sections */}
      <div className="mt-3 mx-2 border-b border-sidebar-border"></div>
    </SidebarGroup>
  );

  return (
    <Sidebar className="border-r border-border bg-sidebar transition-colors">
      <SidebarHeader className="p-4 border-b border-sidebar-border bg-sidebar">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
            <HardHat className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-gray-900 dark:text-white">Foreman Panel</h2>
            <p className="text-xs text-gray-500 dark:text-gray-300">Team Management</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="overflow-y-auto px-2 py-2 bg-sidebar">
        {renderSidebarGroup(groupedForemanItems.timesheet, "Timesheet Management")}
        {renderSidebarGroup(groupedForemanItems.materials, "Material Management")}
        {renderSidebarGroup(groupedForemanItems.team, "Team Management")}
        {renderSidebarGroup(groupedForemanItems.reports, "Reports")}
        {renderSidebarGroup(groupedForemanItems.company, "Company Information")}
        {renderSidebarGroup(groupedForemanItems.account, "Account")}
      </SidebarContent>
      
      <SidebarFooter className="p-4 border-t border-sidebar-border bg-sidebar">
        <div className="text-xs text-gray-500 dark:text-gray-300 text-center">
          Construction Payroll Manager
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default ForemanSidebar;
