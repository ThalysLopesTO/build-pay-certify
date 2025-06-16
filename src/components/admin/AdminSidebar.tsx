
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
import { useCompanyLogo } from '@/hooks/useCompanyLogo';

const AdminSidebar = ({ activeTab, setActiveTab }: AdminSidebarProps) => {
  const { logoUrl, isLoading } = useCompanyLogo();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center space-x-2">
          {!isLoading && logoUrl ? (
            <img
              src={logoUrl}
              alt="Company Logo"
              className="h-6 w-auto object-contain rounded"
            />
          ) : (
            <Building className="h-6 w-6 text-orange-600" />
          )}
          <div>
            <h2 className="font-bold text-sm">Admin Panel</h2>
            <p className="text-xs text-muted-foreground">Construction Manager</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarSection
          items={groupedMenuItems.main}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <SidebarSection
          items={groupedMenuItems.management}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          label="Management"
        />

        <SidebarSection
          items={groupedMenuItems.payroll}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          label="Payroll Management"
        />

        <SidebarSection
          items={groupedMenuItems.employees}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          label="Employee Management"
        />

        <SidebarSection
          items={groupedMenuItems.invoices}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          label="Invoices"
        />

        <SidebarSection
          items={groupedMenuItems.system}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          label="System"
        />
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        <div className="text-xs text-muted-foreground">
          Construction Payroll Manager
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
