
import React from 'react';
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
  Clock, 
  Users, 
  Package,
  Inbox,
  HardHat
} from 'lucide-react';

interface ForemanSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const ForemanSidebar = ({ activeTab, setActiveTab }: ForemanSidebarProps) => {
  const foremanMenuItems = [
    {
      id: 'timesheet',
      title: 'Submit Timesheet',
      icon: Clock,
      section: 'timesheet'
    },
    {
      id: 'materials',
      title: 'Request Material',
      icon: Package,
      section: 'materials'
    },
    {
      id: 'material-requests',
      title: 'My Material Requests',
      icon: Inbox,
      section: 'materials'
    },
    {
      id: 'employees',
      title: 'Employee Directory',
      icon: Users,
      section: 'team'
    }
  ];

  const groupedItems = {
    timesheet: foremanMenuItems.filter(item => item.section === 'timesheet'),
    materials: foremanMenuItems.filter(item => item.section === 'materials'),
    team: foremanMenuItems.filter(item => item.section === 'team')
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center space-x-2">
          <HardHat className="h-6 w-6 text-orange-600" />
          <div>
            <h2 className="font-bold text-sm">Foreman Panel</h2>
            <p className="text-xs text-muted-foreground">Team Management</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Timesheet Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {groupedItems.timesheet.map((item) => (
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
          <SidebarGroupLabel>Material Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {groupedItems.materials.map((item) => (
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
          <SidebarGroupLabel>Team Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {groupedItems.team.map((item) => (
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

export default ForemanSidebar;
