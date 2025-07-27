import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Calculator } from 'lucide-react';
import ManagementSidebarSection from './sidebar/ManagementSidebarSection';
import ManagementCollapsibleSidebarSection from './sidebar/ManagementCollapsibleSidebarSection';
import { managementMenuItems, sectionConfigs } from './sidebar/managementMenuData';
import { useScrollToActiveSection } from '@/hooks/useScrollToActiveSection';

interface ManagementSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const ManagementSidebar = ({ activeTab, setActiveTab }: ManagementSidebarProps) => {
  // Auto-scroll to active section
  useScrollToActiveSection(activeTab);

  return (
    <Sidebar className="border-r border-border bg-sidebar transition-colors">
      <SidebarHeader className="p-4 border-b border-sidebar-border bg-sidebar">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Calculator className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-gray-900">Management Panel</h2>
            <p className="text-xs text-gray-500">Operations Management</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="overflow-y-auto px-2 py-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent bg-sidebar">
        
        {/* Dashboard - Always visible */}
        <ManagementSidebarSection
          items={managementMenuItems.main}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* Collapsible Sections */}
        <ManagementCollapsibleSidebarSection
          items={managementMenuItems.operations}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          label={sectionConfigs.operations.label}
          icon={sectionConfigs.operations.icon}
          defaultExpanded={sectionConfigs.operations.defaultExpanded}
          storageKey={sectionConfigs.operations.storageKey}
        />

        <ManagementCollapsibleSidebarSection
          items={managementMenuItems.employees}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          label={sectionConfigs.employees.label}
          icon={sectionConfigs.employees.icon}
          defaultExpanded={sectionConfigs.employees.defaultExpanded}
          storageKey={sectionConfigs.employees.storageKey}
        />

        <ManagementCollapsibleSidebarSection
          items={managementMenuItems.inventory}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          label={sectionConfigs.inventory.label}
          icon={sectionConfigs.inventory.icon}
          defaultExpanded={sectionConfigs.inventory.defaultExpanded}
          storageKey={sectionConfigs.inventory.storageKey}
        />

        <ManagementCollapsibleSidebarSection
          items={managementMenuItems.financial}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          label={sectionConfigs.financial.label}
          icon={sectionConfigs.financial.icon}
          defaultExpanded={sectionConfigs.financial.defaultExpanded}
          storageKey={sectionConfigs.financial.storageKey}
        />

        <ManagementCollapsibleSidebarSection
          items={managementMenuItems.reports}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          label={sectionConfigs.reports.label}
          icon={sectionConfigs.reports.icon}
          defaultExpanded={sectionConfigs.reports.defaultExpanded}
          storageKey={sectionConfigs.reports.storageKey}
        />

        <ManagementCollapsibleSidebarSection
          items={managementMenuItems.account}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          label={sectionConfigs.account.label}
          icon={sectionConfigs.account.icon}
          defaultExpanded={sectionConfigs.account.defaultExpanded}
          storageKey={sectionConfigs.account.storageKey}
        />
      </SidebarContent>
      
      <SidebarFooter className="p-4 border-t border-sidebar-border bg-sidebar">
        <div className="text-xs text-gray-500 text-center">
          Construction Management System
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default ManagementSidebar;