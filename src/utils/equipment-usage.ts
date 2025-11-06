export const isAssignedOver24Hours = (startTime: string): boolean => {
  const start = new Date(startTime);
  const now = new Date();
  const hoursDiff = (now.getTime() - start.getTime()) / (1000 * 60 * 60);
  return hoursDiff > 24;
};

export const isAssignedOver7Days = (startTime: string): boolean => {
  const start = new Date(startTime);
  const now = new Date();
  const daysDiff = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  return daysDiff > 7;
};

export const getAssignmentDuration = (startTime: string): { hours: number; days: number } => {
  const start = new Date(startTime);
  const now = new Date();
  const hoursDiff = (now.getTime() - start.getTime()) / (1000 * 60 * 60);
  const daysDiff = hoursDiff / 24;
  return { hours: Math.floor(hoursDiff), days: Math.floor(daysDiff) };
};
