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
    <Sidebar variant="floating" className="transition-colors">

      {/* Header */}
      <SidebarHeader className="p-4 border-b border-slate-200/60">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-md shadow-orange-500/20">
            <Building className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-900 leading-tight">Admin Panel</h2>
            <p className="text-xs text-slate-500">Construction Manager</p>
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
      <SidebarFooter className="p-4 border-t border-slate-200/60 bg-sidebar">
        <div className="text-[11px] font-medium text-slate-400 text-center tracking-wide">
          Construction Payroll Manager
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
