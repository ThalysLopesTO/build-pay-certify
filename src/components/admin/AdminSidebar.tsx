import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Building } from 'lucide-react';
import SidebarSection from './sidebar/SidebarSection';
import { groupedMenuItems } from './sidebar/menuData';
import { AdminSidebarProps } from './sidebar/types';

const AdminSidebar = ({ activeTab, setActiveTab }: AdminSidebarProps) => {
  return (
    <Sidebar className="border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111827]">
      
      {/* Header */}
      <SidebarHeader className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
            <Building className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-gray-900 dark:text-white">Admin Panel</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Construction Manager</p>
          </div>
        </div>
      </SidebarHeader>

      {/* Scrollable Content */}
      <SidebarContent className="overflow-y-auto px-2 py-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent dark:scrollbar-thumb-gray-600">
        
        <SidebarSection
          items={groupedMenuItems.main}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <SidebarSection
          items={groupedMenuItems.management}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          label="Project Management"
        />

        <SidebarSection
          items={groupedMenuItems.employees}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          label="Employee Management"
        />

        <SidebarSection
          items={groupedMenuItems.payroll}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          label="Payroll Management"
        />

        <SidebarSection
          items={groupedMenuItems.invoices}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          label="Financial"
        />

        <SidebarSection
          items={groupedMenuItems.reports}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          label="Reports"
        />

        <SidebarSection
          items={groupedMenuItems.system}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          label="System Settings"
        />
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-4 border-t border-gray-100 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Construction Payroll Manager
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
