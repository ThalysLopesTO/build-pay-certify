import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import MaterialRequestFormEnhanced from './MaterialRequestFormEnhanced';
import { AlertTriangle, ArrowRight } from 'lucide-react';

const MaterialRequestForm = () => {
  return (
    <div className="space-y-6">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>
            <strong>Enhanced Material Request System Available!</strong> 
            <br />
            Use the structured catalog-based form for better organization.
          </span>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </AlertDescription>
      </Alert>
      
      <MaterialRequestFormEnhanced />
    </div>
  );
};

export default MaterialRequestForm;