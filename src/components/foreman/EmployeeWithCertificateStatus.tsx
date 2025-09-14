import React from 'react';
import { useEmployeeCertificateStatus } from '@/hooks/useEmployeeCertificateStatus';

interface Employee {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  photo_url?: string;
  trade?: string;
  position?: string;
  role: string;
  is_active: boolean;
}

interface EmployeeWithCertificateStatusProps {
  employee: Employee;
  certificateFilter: string;
  children: (employee: Employee, certificateStatus: string | undefined, shouldShow: boolean) => React.ReactNode;
}

export const EmployeeWithCertificateStatus: React.FC<EmployeeWithCertificateStatusProps> = ({
  employee,
  certificateFilter,
  children
}) => {
  const { data: certificateStatus } = useEmployeeCertificateStatus(employee.user_id);

  const shouldShow = React.useMemo(() => {
    if (certificateFilter === 'all') return true;
    if (!certificateStatus) return certificateFilter === 'no-certificates';
    return certificateStatus === certificateFilter;
  }, [certificateFilter, certificateStatus]);

  return <>{children(employee, certificateStatus, shouldShow)}</>;
};