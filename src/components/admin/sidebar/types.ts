
import { LucideIcon } from 'lucide-react';

export interface AdminMenuItem {
  id: string;
  title: string;
  icon: LucideIcon;
  section: 'main' | 'payroll' | 'management' | 'employees' | 'operations' | 'system';
}

export interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}
