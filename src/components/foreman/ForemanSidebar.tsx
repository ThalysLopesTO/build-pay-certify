
import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import ForemanSidebarSection from './sidebar/ForemanSidebarSection';
import ForemanCollapsibleSidebarSection from './sidebar/ForemanCollapsibleSidebarSection';
import { groupedForemanItems, sectionConfigs } from './sidebar/foremanMenuData';
import { useScrollToActiveSection } from '@/hooks/useScrollToActiveSection';
import { useIsSevenStars } from '@/hooks/useSevenStarsFeature';

interface ForemanSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const ForemanSidebar = ({ activeTab, setActiveTab }: ForemanSidebarProps) => {
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
            Foreman
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto px-2 py-2 scrollbar-hide bg-sidebar">
        
        {/* Dashboard - Always visible at top */}
        <ForemanSidebarSection
          items={gate(groupedForemanItems.dashboard)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* Timesheet - Always visible */}
        <ForemanSidebarSection
          items={gate(groupedForemanItems.timesheet)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* Collapsible Sections */}
        <ForemanCollapsibleSidebarSection
          items={gate(groupedForemanItems.materials)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          label={sectionConfigs.materials.label}
          icon={sectionConfigs.materials.icon}
          defaultExpanded={sectionConfigs.materials.defaultExpanded}
          storageKey={sectionConfigs.materials.storageKey}
        />

        <ForemanCollapsibleSidebarSection
          items={gate(groupedForemanItems.team)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          label={sectionConfigs.team.label}
          icon={sectionConfigs.team.icon}
          defaultExpanded={sectionConfigs.team.defaultExpanded}
          storageKey={sectionConfigs.team.storageKey}
        />

        <ForemanCollapsibleSidebarSection
          items={gate(groupedForemanItems.reports)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          label={sectionConfigs.reports.label}
          icon={sectionConfigs.reports.icon}
          defaultExpanded={sectionConfigs.reports.defaultExpanded}
          storageKey={sectionConfigs.reports.storageKey}
        />

        <ForemanCollapsibleSidebarSection
          items={gate(groupedForemanItems.company)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          label={sectionConfigs.company.label}
          icon={sectionConfigs.company.icon}
          defaultExpanded={sectionConfigs.company.defaultExpanded}
          storageKey={sectionConfigs.company.storageKey}
        />

        <ForemanCollapsibleSidebarSection
          items={gate(groupedForemanItems.account)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          label={sectionConfigs.account.label}
          icon={sectionConfigs.account.icon}
          defaultExpanded={sectionConfigs.account.defaultExpanded}
          storageKey={sectionConfigs.account.storageKey}
        />
      </SidebarContent>
      
      <SidebarFooter className="p-4 border-t border-slate-200/60 bg-sidebar">
        <div className="text-[11px] font-medium text-slate-400 text-center tracking-wide">
          Construction Payroll Manager
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default ForemanSidebar;
