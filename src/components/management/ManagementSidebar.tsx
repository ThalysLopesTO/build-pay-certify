import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import ManagementSidebarSection from './sidebar/ManagementSidebarSection';
import ManagementCollapsibleSidebarSection from './sidebar/ManagementCollapsibleSidebarSection';
import { managementMenuItems, sectionConfigs } from './sidebar/managementMenuData';
import { useScrollToActiveSection } from '@/hooks/useScrollToActiveSection';
import { useIsSevenStars } from '@/hooks/useSevenStarsFeature';

interface ManagementSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const ManagementSidebar = ({ activeTab, setActiveTab }: ManagementSidebarProps) => {
  // Auto-scroll to active section
  useScrollToActiveSection(activeTab);
  const isSevenStars = useIsSevenStars();
  const gate = <T extends { id: string }>(items: T[]) =>
    items.filter(i => i.id !== 'site-inspections' || isSevenStars);


  return (
    <Sidebar variant="floating" className="transition-colors">
      <SidebarHeader className="p-4 border-b border-slate-200/60 bg-sidebar">
        <div className="flex items-center gap-2.5">
          <img
            src="/lovable-uploads/3496e725-3945-4e97-9e3b-23e2b57ac36b.png"
            alt="StackBuild"
            className="h-7 w-auto object-contain"
          />
          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 border border-orange-100 rounded-md px-1.5 py-0.5">
            Manager
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto px-2 py-2 scrollbar-hide bg-sidebar">
        
        {/* Dashboard - Always visible */}
        <ManagementSidebarSection
          items={gate(managementMenuItems.main)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* Collapsible Sections — mirrors the Admin sidebar order */}
        <ManagementCollapsibleSidebarSection
          items={gate(managementMenuItems.projects)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          label={sectionConfigs.projects.label}
          icon={sectionConfigs.projects.icon}
          defaultExpanded={sectionConfigs.projects.defaultExpanded}
          storageKey={sectionConfigs.projects.storageKey}
        />

        <ManagementCollapsibleSidebarSection
          items={gate(managementMenuItems.employees)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          label={sectionConfigs.employees.label}
          icon={sectionConfigs.employees.icon}
          defaultExpanded={sectionConfigs.employees.defaultExpanded}
          storageKey={sectionConfigs.employees.storageKey}
        />

        <ManagementCollapsibleSidebarSection
          items={gate(managementMenuItems.operations)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          label={sectionConfigs.operations.label}
          icon={sectionConfigs.operations.icon}
          defaultExpanded={sectionConfigs.operations.defaultExpanded}
          storageKey={sectionConfigs.operations.storageKey}
        />

        <ManagementCollapsibleSidebarSection
          items={gate(managementMenuItems.financial)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          label={sectionConfigs.financial.label}
          icon={sectionConfigs.financial.icon}
          defaultExpanded={sectionConfigs.financial.defaultExpanded}
          storageKey={sectionConfigs.financial.storageKey}
        />

        <ManagementCollapsibleSidebarSection
          items={gate(managementMenuItems.reports)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          label={sectionConfigs.reports.label}
          icon={sectionConfigs.reports.icon}
          defaultExpanded={sectionConfigs.reports.defaultExpanded}
          storageKey={sectionConfigs.reports.storageKey}
        />

        <ManagementCollapsibleSidebarSection
          items={gate(managementMenuItems.personal)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          label={sectionConfigs.personal.label}
          icon={sectionConfigs.personal.icon}
          defaultExpanded={sectionConfigs.personal.defaultExpanded}
          storageKey={sectionConfigs.personal.storageKey}
        />

        <ManagementCollapsibleSidebarSection
          items={gate(managementMenuItems.system)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          label={sectionConfigs.system.label}
          icon={sectionConfigs.system.icon}
          defaultExpanded={sectionConfigs.system.defaultExpanded}
          storageKey={sectionConfigs.system.storageKey}
        />
      </SidebarContent>
      
      <SidebarFooter className="p-4 border-t border-slate-200/60 bg-sidebar">
        <div className="text-[11px] font-medium text-slate-400 text-center tracking-wide">
          Construction Management System
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default ManagementSidebar;