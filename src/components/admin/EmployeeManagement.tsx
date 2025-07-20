import React from 'react';
import ImprovedEmployeeManagement from './employee-management/ImprovedEmployeeManagement';

const EmployeeManagement = ({ onNavigateToRegistration }: { onNavigateToRegistration?: () => void }) => {
  return <ImprovedEmployeeManagement onNavigateToRegistration={onNavigateToRegistration} />;
};

export default EmployeeManagement;
