import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Building } from 'lucide-react';
import SidebarSection from './sidebar/SidebarSection';
import CollapsibleSidebarSection from './sidebar/CollapsibleSidebarSection';
import { groupedMenuItems, sectionConfigs } from './sidebar/menuData';
import { AdminSidebarProps } from './sidebar/types';
import { useScrollToActiveSection } from '@/hooks/useScrollToActiveSection';

const AdminSidebar = ({ activeTab, setActiveTab }: AdminSidebarProps) => {
  // Auto-scroll to active section
  useScrollToActiveSection(activeTab);

  return (
    <Sidebar className="border-r border-border bg-sidebar transition-colors">
      
      {/* Header */}
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Building className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-gray-900">Admin Panel</h2>
            <p className="text-xs text-gray-500">Construction Manager</p>
          </div>
        </div>
      </SidebarHeader>

      {/* Scrollable Content */}
      <SidebarContent className="overflow-y-auto px-2 py-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent bg-sidebar">
        
        {/* Dashboard - Always visible */}
        <SidebarSection
          items={groupedMenuItems.main}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* Collapsible Sections */}
        <CollapsibleSidebarSection
          items={groupedMenuItems.management}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          label={sectionConfigs.management.label}
          icon={sectionConfigs.management.icon}
          defaultExpanded={sectionConfigs.management.defaultExpanded}
          storageKey={sectionConfigs.management.storageKey}
        />

        <CollapsibleSidebarSection
          items={groupedMenuItems.employees}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          label={sectionConfigs.employees.label}
          icon={sectionConfigs.employees.icon}
          defaultExpanded={sectionConfigs.employees.defaultExpanded}
          storageKey={sectionConfigs.employees.storageKey}
        />

        <CollapsibleSidebarSection
          items={groupedMenuItems.managementOps}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          label={sectionConfigs.managementOps.label}
          icon={sectionConfigs.managementOps.icon}
          defaultExpanded={sectionConfigs.managementOps.defaultExpanded}
          storageKey={sectionConfigs.managementOps.storageKey}
        />

        <CollapsibleSidebarSection
          items={groupedMenuItems.invoices}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          label={sectionConfigs.invoices.label}
          icon={sectionConfigs.invoices.icon}
          defaultExpanded={sectionConfigs.invoices.defaultExpanded}
          storageKey={sectionConfigs.invoices.storageKey}
        />

        <CollapsibleSidebarSection
          items={groupedMenuItems.reports}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          label={sectionConfigs.reports.label}
          icon={sectionConfigs.reports.icon}
          defaultExpanded={sectionConfigs.reports.defaultExpanded}
          storageKey={sectionConfigs.reports.storageKey}
        />

        <CollapsibleSidebarSection
          items={groupedMenuItems.system}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          label={sectionConfigs.system.label}
          icon={sectionConfigs.system.icon}
          defaultExpanded={sectionConfigs.system.defaultExpanded}
          storageKey={sectionConfigs.system.storageKey}
        />
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-4 border-t border-sidebar-border bg-sidebar">
        <div className="text-xs text-gray-500 text-center">
          Construction Payroll Manager
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
