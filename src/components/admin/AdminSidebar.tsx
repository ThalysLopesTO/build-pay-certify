import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import SidebarSection from './sidebar/SidebarSection';
import CollapsibleSidebarSection from './sidebar/CollapsibleSidebarSection';
import { groupedMenuItems, sectionConfigs } from './sidebar/menuData';
import { AdminSidebarProps } from './sidebar/types';
import { useScrollToActiveSection } from '@/hooks/useScrollToActiveSection';
import { useIsSevenStars } from '@/hooks/useSevenStarsFeature';

const AdminSidebar = ({ activeTab, setActiveTab }: AdminSidebarProps) => {
  // Auto-scroll to active section
  useScrollToActiveSection(activeTab);
  const isSevenStars = useIsSevenStars();
  const gate = <T extends { id?: string }>(items: T[]) =>
    items.filter(i => i.id !== 'site-inspections' || isSevenStars);


  return (
    <Sidebar variant="floating" className="transition-colors">

      {/* Header */}
      <SidebarHeader className="p-4 border-b border-slate-200/60">
        <div className="flex items-center gap-2.5">
          <img
            src="/lovable-uploads/3496e725-3945-4e97-9e3b-23e2b57ac36b.png"
            alt="StackBuild"
            className="h-7 w-auto object-contain"
          />
          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 border border-orange-100 rounded-md px-1.5 py-0.5">
            Admin
          </span>
        </div>
      </SidebarHeader>

      {/* Scrollable Content */}
      <SidebarContent className="overflow-y-auto px-2 py-2 scrollbar-hide bg-sidebar">
        
        {/* Dashboard - Always visible */}
        <SidebarSection
          items={gate(groupedMenuItems.main)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* Collapsible Sections */}
        <CollapsibleSidebarSection
          items={gate(groupedMenuItems.management)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          label={sectionConfigs.management.label}
          icon={sectionConfigs.management.icon}
          defaultExpanded={sectionConfigs.management.defaultExpanded}
          storageKey={sectionConfigs.management.storageKey}
        />

        <CollapsibleSidebarSection
          items={gate(groupedMenuItems.employees)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          label={sectionConfigs.employees.label}
          icon={sectionConfigs.employees.icon}
          defaultExpanded={sectionConfigs.employees.defaultExpanded}
          storageKey={sectionConfigs.employees.storageKey}
        />

        <CollapsibleSidebarSection
          items={gate(groupedMenuItems.managementOps)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          label={sectionConfigs.managementOps.label}
          icon={sectionConfigs.managementOps.icon}
          defaultExpanded={sectionConfigs.managementOps.defaultExpanded}
          storageKey={sectionConfigs.managementOps.storageKey}
        />

        <CollapsibleSidebarSection
          items={gate(groupedMenuItems.invoices)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          label={sectionConfigs.invoices.label}
          icon={sectionConfigs.invoices.icon}
          defaultExpanded={sectionConfigs.invoices.defaultExpanded}
          storageKey={sectionConfigs.invoices.storageKey}
        />

        <CollapsibleSidebarSection
          items={gate(groupedMenuItems.reports)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          label={sectionConfigs.reports.label}
          icon={sectionConfigs.reports.icon}
          defaultExpanded={sectionConfigs.reports.defaultExpanded}
          storageKey={sectionConfigs.reports.storageKey}
        />

        <CollapsibleSidebarSection
          items={gate(groupedMenuItems.system)}
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
