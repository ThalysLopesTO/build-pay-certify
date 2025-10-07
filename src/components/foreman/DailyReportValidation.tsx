import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface DailyReportValidationProps {
  hasJobsite: boolean;
  hasSummary: boolean;
  summaryLength: number;
  hasValidDate: boolean;
  photoCount: number;
}

export const DailyReportValidation: React.FC<DailyReportValidationProps> = ({
  hasJobsite,
  hasSummary,
  summaryLength,
  hasValidDate,
  photoCount
}) => {
  const { user } = useAuth();
  
  const validations = [
    {
      key: 'auth',
      label: 'Authentication',
      valid: !!user?.id && !!user?.companyId,
      message: user?.id ? 'Logged in' : 'Not authenticated',
      critical: true
    },
    {
      key: 'permissions',
      label: 'Permissions',
      valid: user?.role && ['foreman', 'admin', 'super_admin'].includes(user.role),
      message: user?.role ? `Role: ${user.role}` : 'Insufficient permissions',
      critical: true
    },
    {
      key: 'jobsite',
      label: 'Jobsite Selected',
      valid: hasJobsite,
      message: hasJobsite ? 'Jobsite selected' : 'Please select a jobsite',
      critical: true
    },
    {
      key: 'date',
      label: 'Report Date',
      valid: hasValidDate,
      message: hasValidDate ? 'Date selected' : 'Please select a report date',
      critical: true
    },
    {
      key: 'summary',
      label: 'Summary',
      valid: hasSummary && summaryLength >= 10,
      message: hasSummary 
        ? summaryLength >= 10 
          ? `${summaryLength} characters` 
          : `Need ${10 - summaryLength} more characters`
        : 'Please enter a summary',
      critical: true
    },
    {
      key: 'photos',
      label: 'Photos',
      valid: true, // Photos are optional
      message: photoCount > 0 ? `${photoCount} photo${photoCount > 1 ? 's' : ''} selected` : 'No photos (optional)',
      critical: false
    }
  ];

  const criticalIssues = validations.filter(v => v.critical && !v.valid);
  const canSubmit = criticalIssues.length === 0;

  if (canSubmit) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          All requirements met. Ready to submit daily report.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please resolve the following issues before submitting:
        </AlertDescription>
      </Alert>
      
      <div className="grid grid-cols-1 gap-2">
        {validations.map((validation) => (
          <div key={validation.key} className="flex items-center justify-between py-2 px-3 rounded-lg border">
            <div className="flex items-center gap-3">
              {validation.valid ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm font-medium">{validation.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{validation.message}</span>
              <Badge variant={validation.valid ? "default" : "destructive"} className="text-xs">
                {validation.valid ? "✓" : "!"}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};