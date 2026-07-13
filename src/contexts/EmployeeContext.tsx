import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { getSupabase } from '@/integrations/supabase/client';
import { getActiveCompanyId } from '@/lib/auth/activeCompany';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export interface Employee {
  id: string;
  user_id: string;
  company_id?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
  role: string;
  trade?: string;
  position?: string;
  hourly_rate?: number;
  photo_url?: string;
  worker_type?: string;
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
  // CRUD operations with immediate UI updates
  createEmployee: (newEmployee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateEmployee: (id: string, updates: Partial<Employee>, newPhoto?: File) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>; // Archives employee (soft delete)
  
  // Additional operations
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
  const { toast } = useToast();
  const supabase = getSupabase();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Get auth info asynchronously when needed instead of during initialization
  const getAuthInfo = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  };

  // Fetch all employees (active and archived) on component mount
  const fetchEmployees = async () => {
    const session = await getAuthInfo();
    if (!session?.user) {
      console.log('No authenticated user, skipping employee fetch');
      return;
    }
    
    // Resolve the user's ACTIVE company (multi-company aware)
    const activeCompanyId = await getActiveCompanyId();

    if (!activeCompanyId) {
      console.log('No company ID found for user');
      return;
    }
    
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
        .eq('company_id', activeCompanyId)
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

  // Initialize employees when component mounts
  useEffect(() => {
    if (!state.initialized) {
      fetchEmployees();
    }
  }, [state.initialized]);

  // CRUD Operations with immediate UI updates (optimistic updates)
  const createEmployee = async (newEmployee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) => {
    console.log('🚀 Adding employee to context:', newEmployee.first_name, newEmployee.last_name);
    
    // Create the employee object with proper structure
    const employee: Employee = {
      ...newEmployee,
      id: newEmployee.user_id || `emp-${Date.now()}`, // Use user_id if available, fallback to generated ID
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true,
    };

    // Add to state immediately
    dispatch({ type: 'ADD_EMPLOYEE', payload: employee });

    console.log('✅ Employee added to context successfully');
  };

  // Helper function to add timeout to promises
  const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
      )
    ]);
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>, newPhoto?: File) => {
    console.log('🔄 Updating employee optimistically:', id, updates);
    
    const currentEmployee = state.employees.find(emp => emp.id === id);
    if (!currentEmployee) {
      console.error('❌ Employee not found for update:', id);
      return;
    }

    // Check if this is a temporary ID and fetch the real employee data
    if (id.startsWith('temp-')) {
      console.error('❌ Cannot update employee with temporary ID:', id);
      toast({
        title: "Update Failed",
        description: "Cannot update employee with temporary ID. Please refresh the page and try again.",
        variant: "destructive",
      });
      return;
    }

    // Immediately update UI with optimistic update
    const updatedEmployee = { 
      ...currentEmployee, 
      ...updates, 
      updated_at: new Date().toISOString() 
    };
    dispatch({ type: 'UPDATE_EMPLOYEE', payload: updatedEmployee });

    try {
      let photoUrl = updates.photo_url;

      // Step 1: Handle photo upload first (if provided) - with timeout
      if (newPhoto) {
        console.log('📸 Step 1: Uploading new photo...');
        const fileExtension = newPhoto.name.split('.').pop();
        const fileName = `${id}.${fileExtension}`;
        
        const uploadResult = await withTimeout(
          supabase.storage
            .from('employee-photos')
            .upload(fileName, newPhoto, {
              cacheControl: '3600',
              upsert: true
            }) as any, 
          15000, 
          'Photo upload timed out after 15 seconds'
        );
        const { data: uploadData, error: uploadError } = uploadResult as any;
        if (uploadError) {
          console.error('❌ Photo upload failed:', uploadError);
          throw new Error('Failed to upload employee photo');
        }

        const { data: publicUrlData } = supabase.storage
          .from('employee-photos')
          .getPublicUrl(fileName);
        
        photoUrl = publicUrlData.publicUrl;
        console.log('✅ Photo uploaded successfully:', photoUrl);
      }

      // Step 2: Update database with new photo URL - increased timeout for complex operations
      console.log('📝 Step 2: Updating database...');
      const updateResult = await withTimeout(
        supabase
          .from('user_profiles')
          .update({
            ...updates,
            photo_url: photoUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .maybeSingle() as any, 
        25000, 
        'Database update timed out after 25 seconds'
      );
      const { data, error } = updateResult as any;

      if (error) {
        console.error('❌ Database update failed:', error);
        throw new Error(`Database update failed: ${error.message || 'Unknown error'}`);
      }

      if (!data) {
        console.warn('⚠️ No data returned from update, employee may not exist');
        throw new Error('Employee not found or update failed - no data returned');
      }

      // Update with final server response
      const finalEmployee = { ...data, photo_url: photoUrl };
      dispatch({ type: 'UPDATE_EMPLOYEE', payload: finalEmployee });

      console.log('✅ Step 2 completed: Database updated successfully');

      // Step 3: Handle auth email update last (if email is being changed)
      if (updates.email && updates.email !== currentEmployee.email) {
        console.log('📧 Step 3: Updating auth email...');
        const { data: emailUpdateData, error: emailUpdateError } = await supabase.functions.invoke(
          'update-user-email',
          {
            body: {
              userId: currentEmployee.user_id,
              newEmail: updates.email
            }
          }
        );

        if (emailUpdateError || !emailUpdateData?.success) {
          console.warn('⚠️ Email update failed, but database update succeeded');
          const errorMessage = emailUpdateError?.message || emailUpdateData?.error || 'Failed to update login email';
          // Don't throw here - database update already succeeded
          toast({
            title: "Partial Update",
            description: "Employee profile updated, but login email update failed. Contact support.",
            variant: "destructive",
          });
          return; // Exit early
        }
        
        console.log('✅ Auth email updated successfully');
      }

      console.log('✅ All steps completed successfully', { 
        employeeId: finalEmployee.id,
        updatedFields: Object.keys(updates),
        hasNewPhoto: !!newPhoto,
        emailUpdated: !!(updates.email && updates.email !== currentEmployee.email)
      });
      
      // Invalidate user auth queries to refresh hourly rate in real-time
      await queryClient.invalidateQueries({ 
        queryKey: ['user-profile', finalEmployee.user_id] 
      });
      
      // Also invalidate auth state if the current user was updated
      if (finalEmployee.user_id === user?.id) {
        await queryClient.invalidateQueries({ 
          queryKey: ['auth-user'] 
        });
      }
      
      toast({
        title: "Employee Updated",
        description: `${updates.first_name || currentEmployee.first_name} ${updates.last_name || currentEmployee.last_name} has been updated successfully.`,
      });
      
    } catch (error: any) {
      console.error('❌ Error updating employee:', error);
      
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

  // New deleteEmployee function (soft delete - archives the employee)
  const deleteEmployee = async (id: string) => {
    console.log('🗑️ Deleting (archiving) employee optimistically:', id);
    
    const employeeToDelete = state.employees.find(emp => emp.id === id);
    if (!employeeToDelete) {
      console.error('❌ Employee not found for deletion:', id);
      return;
    }

    // Immediately remove from UI (move to archived)
    dispatch({ type: 'ARCHIVE_EMPLOYEE', payload: employeeToDelete.user_id });

    try {
      // Call archive function (soft delete)
      const { data, error } = await supabase.rpc('delete_employee', {
        employee_user_id: employeeToDelete.user_id
      });

      if (error || !(data as any)?.success) {
        throw new Error((data as any)?.error || 'Failed to delete employee');
      }

      console.log('✅ Employee deleted successfully');
      toast({
        title: "Success",
        description: `${employeeToDelete.first_name} ${employeeToDelete.last_name} has been archived successfully`,
      });
      
    } catch (error: any) {
      console.error('❌ Error deleting employee:', error);
      
      // Revert optimistic update on error
      dispatch({ type: 'REACTIVATE_EMPLOYEE', payload: employeeToDelete.user_id });
      
      toast({
        title: "Error",
        description: error.message || "Error deleting employee",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Archive employee function (same as delete but more explicit naming)
  const archiveEmployee = async (userId: string) => {
    console.log('📦 Archiving employee optimistically:', userId);
    
    // Immediately archive in UI
    dispatch({ type: 'ARCHIVE_EMPLOYEE', payload: userId });

    try {
      const { data, error } = await supabase.rpc('delete_employee', {
        employee_user_id: userId
      });

      if (error || !(data as any)?.success) {
        throw new Error((data as any)?.error || 'Failed to archive employee');
      }

      console.log('✅ Employee archived successfully');
      toast({
        title: "Success",
        description: "Employee successfully archived",
      });
      
    } catch (error: any) {
      console.error('❌ Error archiving employee:', error);
      
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
    console.log('🔄 Reactivating employee optimistically:', userId);
    
    // Immediately reactivate in UI
    dispatch({ type: 'REACTIVATE_EMPLOYEE', payload: userId });

    try {
      const { data, error } = await supabase.rpc('reactivate_employee', {
        employee_user_id: userId
      });

      if (error || !(data as any)?.success) {
        throw new Error((data as any)?.error || 'Failed to reactivate employee');
      }

      console.log('✅ Employee reactivated successfully');
      toast({
        title: "Success",
        description: "Employee successfully reactivated",
      });
      
    } catch (error: any) {
      console.error('❌ Error reactivating employee:', error);
      
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

  // Refresh employees function
  const refreshEmployees = async () => {
    console.log('🔄 Refreshing employees...');
    await fetchEmployees();
  };

  const contextValue: EmployeeContextValue = {
    ...state,
    createEmployee,
    updateEmployee,
    deleteEmployee,
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