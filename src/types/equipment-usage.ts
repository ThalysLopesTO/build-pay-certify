export type UsageStatus = 'in_use' | 'returned' | 'damaged' | 'lost';

export interface EquipmentUsageLog {
  id: string;
  company_id: string;
  equipment_id: string;
  employee_id: string;
  jobsite_id: string;
  assigned_by: string;
  start_time: string;
  return_time: string | null;
  status: UsageStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  
  equipment?: {
    equipment_name: string;
    brand: string;
    sku: string;
  };
  employee?: {
    first_name: string;
    last_name: string;
    photo_url: string | null;
  };
  jobsite?: {
    name: string;
  };
  assigner?: {
    first_name: string;
    last_name: string;
  };
}

export interface AssignEquipmentInput {
  equipment_id: string;
  employee_id: string;
  jobsite_id: string;
  start_time?: string;
  notes?: string;
}

export interface ReturnEquipmentInput {
  usage_id: string;
  status: 'returned' | 'damaged' | 'lost';
  return_time?: string;
  notes?: string;
}

export interface UsageFilters {
  search?: string;
  status?: UsageStatus | 'all';
  jobsite_id?: string;
  employee_id?: string;
  date_from?: string;
  date_to?: string;
}

export interface UsageStats {
  currently_assigned: number;
  returned_today: number;
  pending_return: number;
  damaged_lost_today: number;
}
