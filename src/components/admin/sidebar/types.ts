
export interface MenuItem {
  id?: string;
  title: string;
  href?: string;
  icon: React.ComponentType<any>;
  items?: MenuItem[];
}

export interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}
