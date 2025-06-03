
export type RequestStatus = 'pending' | 'ordered' | 'delivered' | 'archived';

export interface MaterialRequest {
  id: string;
  jobsites: {
    name: string;
    address: string;
  } | null;
  delivery_date: string;
  delivery_time: string;
  floor_unit: string;
  material_list: string;
  status: RequestStatus;
  created_at: string;
  submitted_by: string;
}
