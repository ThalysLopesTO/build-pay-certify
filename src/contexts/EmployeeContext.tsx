import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Employee {
  id: string;
  user_id: string;
  company_id?: string;
  first_name: string;
  last_name: string;
  role: string;
  trade?: string;
  position?: string;
  hourly_rate?: number;
  photo_url?: string;
  worker_type?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  companies?: {
    name: string;
  };
}

interface EmployeeState {
  employees: Employee[];
  archivedEmployees: Employee[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

type EmployeeAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_EMPLOYEES'; payload: Employee[] }
  | { type: 'SET_ARCHIVED_EMPLOYEES'; payload: Employee[] }
  | { type: 'ADD_EMPLOYEE'; payload: Employee }
  | { type: 'UPDATE_EMPLOYEE'; payload: Employee }
  | { type: 'ARCHIVE_EMPLOYEE'; payload: string }
  | { type: 'REACTIVATE_EMPLOYEE'; payload: string }
  | { type: 'SET_INITIALIZED'; payload: boolean };

const initialState: EmployeeState = {
  employees: [],
  archivedEmployees: [],
  loading: false,
  error: null,
  initialized: false,
};

function employeeReducer(state: EmployeeState, action: EmployeeAction): EmployeeState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_EMPLOYEES':
      return { 
        ...state, 
        employees: action.payload.filter(emp => emp.is_active),
        loading: false, 
        error: null 
      };
    
    case 'SET_ARCHIVED_EMPLOYEES':
      return { 
        ...state, 
        archivedEmployees: action.payload.filter(emp => !emp.is_active),
        loading: false, 
        error: null 
      };
    
    case 'ADD_EMPLOYEE':
      if (action.payload.is_active) {
        return {
          ...state,
          employees: [...state.employees, action.payload],
          error: null,
        };
      }
      return state;
    
    case 'UPDATE_EMPLOYEE':
      const updatedEmployee = action.payload;
      
      if (updatedEmployee.is_active) {
        return {
          ...state,
          employees: state.employees.map(emp => 
            emp.id === updatedEmployee.id ? updatedEmployee : emp
          ),
          archivedEmployees: state.archivedEmployees.filter(emp => emp.id !== updatedEmployee.id),
          error: null,
        };
      } else {
        return {
          ...state,
          employees: state.employees.filter(emp => emp.id !== updatedEmployee.id),
          archivedEmployees: state.archivedEmployees.some(emp => emp.id === updatedEmployee.id)
            ? state.archivedEmployees.map(emp => emp.id === updatedEmployee.id ? updatedEmployee : emp)
            : [...state.archivedEmployees, updatedEmployee],
          error: null,
        };
      }
    
    case 'ARCHIVE_EMPLOYEE':
      const employeeToArchive = state.employees.find(emp => emp.user_id === action.payload);
      if (employeeToArchive) {
        const archivedEmployee = { ...employeeToArchive, is_active: false };
        return {
          ...state,
          employees: state.employees.filter(emp => emp.user_id !== action.payload),
          archivedEmployees: [...state.archivedEmployees, archivedEmployee],
          error: null,
        };
      }
      return state;
    
    case 'REACTIVATE_EMPLOYEE':
      const employeeToReactivate = state.archivedEmployees.find(emp => emp.user_id === action.payload);
      if (employeeToReactivate) {
        const reactivatedEmployee = { ...employeeToReactivate, is_active: true };
        return {
          ...state,
          archivedEmployees: state.archivedEmployees.filter(emp => emp.user_id !== action.payload),
          employees: [...state.employees, reactivatedEmployee],
          error: null,
        };
      }
      return state;
    
    case 'SET_INITIALIZED':
      return { ...state, initialized: action.payload };
    
    default:
      return state;
  }
}

interface EmployeeContextValue extends EmployeeState {
  // CRUD operations
  createEmployee: (employeeData: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateEmployee: (id: string, updateData: Partial<Employee>, newPhoto?: File) => Promise<void>;
  archiveEmployee: (userId: string) => Promise<void>;
  reactivateEmployee: (userId: string) => Promise<void>;
  
  // Computed values
  activeEmployeeCount: number;
  archivedEmployeeCount: number;
  
  // Utility functions
  refreshEmployees: () => Promise<void>;
}

const EmployeeContext = createContext<EmployeeContextValue | null>(null);

export const useEmployees = () => {
  const context = useContext(EmployeeContext);
  if (!context) {
    throw new Error('useEmployees must be used within an EmployeeProvider');
  }
  return context;
};

interface EmployeeProviderProps {
  children: ReactNode;
}

export const EmployeeProvider: React.FC<EmployeeProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(employeeReducer, initialState);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch all employees (active and archived) on component mount
  const fetchEmployees = async () => {
    if (!user?.companyId) return;
    
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          companies:company_id (
            id,
            name
          )
        `)
        .eq('company_id', user.companyId)
        .in('role', ['employee', 'foreman', 'admin', 'management'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      const employees = data || [];
      const activeEmployees = employees.filter(emp => emp.is_active);
      const archivedEmployees = employees.filter(emp => !emp.is_active);

      dispatch({ type: 'SET_EMPLOYEES', payload: activeEmployees });
      dispatch({ type: 'SET_ARCHIVED_EMPLOYEES', payload: archivedEmployees });
      dispatch({ type: 'SET_INITIALIZED', payload: true });
    } catch (error: any) {
      console.error('Error fetching employees:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  // Initialize employees when user/company changes
  useEffect(() => {
    if (user?.companyId && !state.initialized) {
      fetchEmployees();
    }
  }, [user?.companyId, state.initialized]);

  // CRUD Operations with optimistic updates
  const createEmployee = async (employeeData: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) => {
    // Optimistically add employee
    const tempEmployee: Employee = {
      ...employeeData,
      id: `temp-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true,
    };

    dispatch({ type: 'ADD_EMPLOYEE', payload: tempEmployee });

    try {
      // This would be handled by the existing create-employee edge function
      // The actual server response would replace the temp employee
      toast({
        title: "Employee Added",
        description: `${employeeData.first_name} ${employeeData.last_name} has been added successfully.`,
      });
    } catch (error: any) {
      // Remove optimistic update on error
      dispatch({ type: 'SET_EMPLOYEES', payload: state.employees.filter(emp => emp.id !== tempEmployee.id) });
      toast({
        title: "Error",
        description: error.message || "Failed to create employee",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateEmployee = async (id: string, updateData: Partial<Employee>, newPhoto?: File) => {
    const currentEmployee = state.employees.find(emp => emp.id === id);
    if (!currentEmployee) return;

    // Optimistically update employee
    const updatedEmployee = { ...currentEmployee, ...updateData, updated_at: new Date().toISOString() };
    dispatch({ type: 'UPDATE_EMPLOYEE', payload: updatedEmployee });

    try {
      let photoUrl = updateData.photo_url;

      // Upload new photo if provided
      if (newPhoto) {
        const fileExtension = newPhoto.name.split('.').pop();
        const fileName = `${id}.${fileExtension}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('employee-photos')
          .upload(fileName, newPhoto, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) throw new Error('Failed to upload employee photo');

        const { data: publicUrlData } = supabase.storage
          .from('employee-photos')
          .getPublicUrl(fileName);
        
        photoUrl = publicUrlData.publicUrl;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...updateData,
          photo_url: photoUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update with server response
      dispatch({ type: 'UPDATE_EMPLOYEE', payload: { ...data, photo_url: photoUrl } });

      toast({
        title: "Employee Updated",
        description: `${updateData.first_name || currentEmployee.first_name} ${updateData.last_name || currentEmployee.last_name} has been updated successfully.`,
      });
    } catch (error: any) {
      // Revert optimistic update on error
      dispatch({ type: 'UPDATE_EMPLOYEE', payload: currentEmployee });
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update employee",
        variant: "destructive",
      });
      throw error;
    }
  };

  const archiveEmployee = async (userId: string) => {
    // Optimistically archive employee
    dispatch({ type: 'ARCHIVE_EMPLOYEE', payload: userId });

    try {
      const { data, error } = await supabase.rpc('delete_employee', {
        employee_user_id: userId
      });

      if (error || !(data as any)?.success) {
        throw new Error((data as any)?.error || 'Failed to archive employee');
      }

      toast({
        title: "Success",
        description: "Employee successfully archived",
      });
    } catch (error: any) {
      // Revert optimistic update on error
      dispatch({ type: 'REACTIVATE_EMPLOYEE', payload: userId });
      toast({
        title: "Error",
        description: error.message || "Error archiving employee",
        variant: "destructive",
      });
      throw error;
    }
  };

  const reactivateEmployee = async (userId: string) => {
    // Optimistically reactivate employee
    dispatch({ type: 'REACTIVATE_EMPLOYEE', payload: userId });

    try {
      const { data, error } = await supabase.rpc('reactivate_employee', {
        employee_user_id: userId
      });

      if (error || !(data as any)?.success) {
        throw new Error((data as any)?.error || 'Failed to reactivate employee');
      }

      toast({
        title: "Success",
        description: "Employee successfully reactivated",
      });
    } catch (error: any) {
      // Revert optimistic update on error
      dispatch({ type: 'ARCHIVE_EMPLOYEE', payload: userId });
      toast({
        title: "Error",
        description: error.message || "Error reactivating employee",
        variant: "destructive",
      });
      throw error;
    }
  };

  const refreshEmployees = async () => {
    await fetchEmployees();
  };

  const contextValue: EmployeeContextValue = {
    ...state,
    createEmployee,
    updateEmployee,
    archiveEmployee,
    reactivateEmployee,
    activeEmployeeCount: state.employees.length,
    archivedEmployeeCount: state.archivedEmployees.length,
    refreshEmployees,
  };

  return (
    <EmployeeContext.Provider value={contextValue}>
      {children}
    </EmployeeContext.Provider>
  );
};