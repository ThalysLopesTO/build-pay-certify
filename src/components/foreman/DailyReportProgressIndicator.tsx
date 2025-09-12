import React from 'react';
import { CheckCircle, Loader2, Upload, Database, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SubmissionStep {
  key: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  errorMessage?: string;
}

interface DailyReportProgressIndicatorProps {
  isSubmitting: boolean;
  steps: SubmissionStep[];
  currentStep: number;
  overallProgress: number;
}

export const DailyReportProgressIndicator: React.FC<DailyReportProgressIndicatorProps> = ({
  isSubmitting,
  steps,
  currentStep,
  overallProgress
}) => {
  if (!isSubmitting && steps.every(step => step.status === 'pending')) {
    return null;
  }

  const getStepIcon = (step: SubmissionStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'active':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return (
          <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
        );
    }
  };

  const hasError = steps.some(step => step.status === 'error');

  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">
          {hasError ? 'Submission Failed' : isSubmitting ? 'Submitting Report...' : 'Submission Complete'}
        </h4>
        <span className="text-xs text-muted-foreground">
          {Math.round(overallProgress)}%
        </span>
      </div>
      
      <Progress value={overallProgress} className="w-full" />
      
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div key={step.key} className="space-y-1">
            <div className="flex items-center gap-3">
              {getStepIcon(step)}
              <span className={`text-sm ${
                step.status === 'completed' ? 'text-green-600' :
                step.status === 'active' ? 'text-blue-600' :
                step.status === 'error' ? 'text-red-600' :
                'text-muted-foreground'
              }`}>
                {step.label}
              </span>
              {step.status === 'active' && (
                <span className="text-xs text-muted-foreground animate-pulse">
                  Processing...
                </span>
              )}
            </div>
            
            {step.status === 'error' && step.errorMessage && (
              <Alert variant="destructive" className="ml-7">
                <AlertDescription className="text-xs">
                  {step.errorMessage}
                </AlertDescription>
              </Alert>
            )}
          </div>
        ))}
      </div>
      
      {hasError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Submission failed. Please check the errors above and try again.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};