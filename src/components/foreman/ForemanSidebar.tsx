
import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { HardHat } from 'lucide-react';
import ForemanSidebarSection from './sidebar/ForemanSidebarSection';
import ForemanCollapsibleSidebarSection from './sidebar/ForemanCollapsibleSidebarSection';
import { groupedForemanItems, sectionConfigs } from './sidebar/foremanMenuData';
import { useScrollToActiveSection } from '@/hooks/useScrollToActiveSection';

interface ForemanSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const ForemanSidebar = ({ activeTab, setActiveTab }: ForemanSidebarProps) => {
  // Auto-scroll to active section
  useScrollToActiveSection(activeTab);

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
      
      <SidebarContent className="overflow-y-auto px-2 py-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent dark:scrollbar-thumb-gray-600 bg-sidebar">
        
        {/* Timesheet - Always visible */}
        <ForemanSidebarSection
          items={groupedForemanItems.timesheet}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* Collapsible Sections */}
        <ForemanCollapsibleSidebarSection
          items={groupedForemanItems.materials}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          label={sectionConfigs.materials.label}
          icon={sectionConfigs.materials.icon}
          defaultExpanded={sectionConfigs.materials.defaultExpanded}
          storageKey={sectionConfigs.materials.storageKey}
        />

        <ForemanCollapsibleSidebarSection
          items={groupedForemanItems.team}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          label={sectionConfigs.team.label}
          icon={sectionConfigs.team.icon}
          defaultExpanded={sectionConfigs.team.defaultExpanded}
          storageKey={sectionConfigs.team.storageKey}
        />

        <ForemanCollapsibleSidebarSection
          items={groupedForemanItems.reports}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          label={sectionConfigs.reports.label}
          icon={sectionConfigs.reports.icon}
          defaultExpanded={sectionConfigs.reports.defaultExpanded}
          storageKey={sectionConfigs.reports.storageKey}
        />

        <ForemanCollapsibleSidebarSection
          items={groupedForemanItems.company}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          label={sectionConfigs.company.label}
          icon={sectionConfigs.company.icon}
          defaultExpanded={sectionConfigs.company.defaultExpanded}
          storageKey={sectionConfigs.company.storageKey}
        />

        <ForemanCollapsibleSidebarSection
          items={groupedForemanItems.account}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          label={sectionConfigs.account.label}
          icon={sectionConfigs.account.icon}
          defaultExpanded={sectionConfigs.account.defaultExpanded}
          storageKey={sectionConfigs.account.storageKey}
        />
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
