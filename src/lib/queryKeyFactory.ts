// Centralized query key factory for consistent caching and invalidation
export const queryKeys = {
  // Company-related queries
  company: {
    all: ['company'] as const,
    settings: (companyId: string) => [...queryKeys.company.all, 'settings', companyId] as const,
    phones: (companyId: string) => [...queryKeys.company.all, 'phones', companyId] as const,
  },
  
  // User-related queries
  user: {
    all: ['user'] as const,
    profile: (userId: string) => [...queryKeys.user.all, 'profile', userId] as const,
    profiles: (companyId: string) => [...queryKeys.user.all, 'profiles', companyId] as const,
    certificates: (employeeId: string) => [...queryKeys.user.all, 'certificates', employeeId] as const,
  },
  
  // Jobsite-related queries
  jobsite: {
    all: ['jobsite'] as const,
    list: (companyId: string) => [...queryKeys.jobsite.all, 'list', companyId] as const,
    detail: (jobsiteId: string) => [...queryKeys.jobsite.all, 'detail', jobsiteId] as const,
    tasks: (jobsiteId: string) => [...queryKeys.jobsite.all, 'tasks', jobsiteId] as const,
    tasksAdvanced: (jobsiteId: string, filters?: any) => 
      [...queryKeys.jobsite.all, 'tasks-advanced', jobsiteId, filters] as const,
    taskTags: (companyId: string) => [...queryKeys.jobsite.all, 'task-tags', companyId] as const,
    foremen: (jobsiteId: string) => [...queryKeys.jobsite.all, 'foremen', jobsiteId] as const,
  },
  
  // Timesheet-related queries
  timesheet: {
    all: ['timesheet'] as const,
    employee: (userId: string, date?: string) => date 
      ? [...queryKeys.timesheet.all, 'employee', userId, date] as const
      : [...queryKeys.timesheet.all, 'employee', userId] as const,
    weekly: (companyId: string, filters?: any) => 
      [...queryKeys.timesheet.all, 'weekly', companyId, filters] as const,
    dashboard: (companyId: string) => [...queryKeys.timesheet.all, 'dashboard', companyId] as const,
  },
  
  // Material-related queries
  material: {
    all: ['material'] as const,
    requests: (companyId: string, filters?: any) => 
      [...queryKeys.material.all, 'requests', companyId, filters] as const,
    catalog: (companyId: string) => [...queryKeys.material.all, 'catalog', companyId] as const,
    takeoff: (projectId: string) => [...queryKeys.material.all, 'takeoff', projectId] as const,
  },
  
  // Financial-related queries
  finance: {
    all: ['finance'] as const,
    invoices: (companyId: string, filters?: any) => 
      [...queryKeys.finance.all, 'invoices', companyId, filters] as const,
    quotes: (companyId: string, filters?: any) => 
      [...queryKeys.finance.all, 'quotes', companyId, filters] as const,
    expenses: (companyId: string, filters?: any) => 
      [...queryKeys.finance.all, 'expenses', companyId, filters] as const,
  },
  
  // Change orders
  changeOrder: {
    all: ['change-order'] as const,
    list: (companyId: string) => [...queryKeys.changeOrder.all, 'list', companyId] as const,
    detail: (orderId: string) => [...queryKeys.changeOrder.all, 'detail', orderId] as const,
  },
  
  // Notifications
  notification: {
    all: ['notification'] as const,
    list: (companyId: string, role: string) => 
      [...queryKeys.notification.all, 'list', companyId, role] as const,
  },
  
  // Dashboard stats
  dashboard: {
    all: ['dashboard'] as const,
    stats: (companyId: string) => [...queryKeys.dashboard.all, 'stats', companyId] as const,
    enhanced: (companyId: string) => [...queryKeys.dashboard.all, 'enhanced', companyId] as const,
  },
  
  // Reports
  report: {
    all: ['report'] as const,
    daily: (companyId: string, filters?: any) => 
      [...queryKeys.report.all, 'daily', companyId, filters] as const,
    attention: (companyId: string, filters?: any) => 
      [...queryKeys.report.all, 'attention', companyId, filters] as const,
  },
} as const;

// Helper function to invalidate related queries efficiently
export const getRelatedQueryKeys = (baseKey: readonly string[]) => {
  const [entity, ...rest] = baseKey;
  
  switch (entity) {
    case 'company':
      return [queryKeys.company.all];
    case 'user':
      return [queryKeys.user.all];
    case 'jobsite':
      return [queryKeys.jobsite.all, queryKeys.timesheet.all];
    case 'timesheet':
      return [queryKeys.timesheet.all, queryKeys.dashboard.all];
    case 'material':
      return [queryKeys.material.all];
    case 'finance':
      return [queryKeys.finance.all, queryKeys.dashboard.all];
    case 'change-order':
      return [queryKeys.changeOrder.all];
    case 'notification':
      return [queryKeys.notification.all];
    default:
      return [baseKey];
  }
};