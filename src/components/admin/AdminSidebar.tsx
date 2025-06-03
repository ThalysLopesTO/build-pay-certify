import React from 'react';
import { useLocation } from 'react-router-dom';
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
import { 
  DollarSign, 
  Users, 
  Building, 
  Settings, 
  Inbox, 
  MapPin, 
  UserPlus,
  Clock,
  Award,
  Home,
  FileText
} from 'lucide-react';

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const AdminSidebar = ({ activeTab, setActiveTab }: AdminSidebarProps) => {
  const adminMenuItems = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: Home,
      section: 'main'
    },
    {
      id: 'payroll',
      title: 'Weekly Timesheets',
      icon: Clock,
      section: 'payroll'
    },
    {
      id: 'jobsites',
      title: 'Job Sites',
      icon: MapPin,
      section: 'operations'
    },
    {
      id: 'invoices',
      title: 'Invoice Management',
      icon: FileText,
      section: 'operations'
    },
    {
      id: 'register',
      title: 'Add New Employee',
      icon: UserPlus,
      section: 'employees'
    },
    {
      id: 'employees',
      title: 'Employee Directory',
      icon: Users,
      section: 'employees'
    },
    {
      id: 'materials',
      title: 'Material Request Inbox',
      icon: Inbox,
      section: 'operations'
    },
    {
      id: 'certificates',
      title: 'Certificate Tracker',
      icon: Award,
      section: 'employees'
    },
    {
      id: 'projects',
      title: 'Projects',
      icon: Building,
      section: 'operations'
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: Settings,
      section: 'system'
    }
  ];

  const groupedItems = {
    main: adminMenuItems.filter(item => item.section === 'main'),
    payroll: adminMenuItems.filter(item => item.section === 'payroll'),
    employees: adminMenuItems.filter(item => item.section === 'employees'),
    operations: adminMenuItems.filter(item => item.section === 'operations'),
    system: adminMenuItems.filter(item => item.section === 'system')
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center space-x-2">
          <Building className="h-6 w-6 text-orange-600" />
          <div>
            <h2 className="font-bold text-sm">Admin Panel</h2>
            <p className="text-xs text-muted-foreground">Construction Manager</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {groupedItems.main.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activeTab === item.id}
                    onClick={() => setActiveTab(item.id)}
                    className="w-full justify-start"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Payroll Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {groupedItems.payroll.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activeTab === item.id}
                    onClick={() => setActiveTab(item.id)}
                    className="w-full justify-start"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Employee Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {groupedItems.employees.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activeTab === item.id}
                    onClick={() => setActiveTab(item.id)}
                    className="w-full justify-start"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {groupedItems.operations.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activeTab === item.id}
                    onClick={() => setActiveTab(item.id)}
                    className="w-full justify-start"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {groupedItems.system.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activeTab === item.id}
                    onClick={() => setActiveTab(item.id)}
                    className="w-full justify-start"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
