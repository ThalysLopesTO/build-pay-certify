
import React from 'react';
import { Button } from '@/components/ui/button';

interface JobsiteTaskFormActionsProps {
  isEditing: boolean;
  isLoading: boolean;
  onCancel: () => void;
  onReset: () => void;
}

const JobsiteTaskFormActions: React.FC<JobsiteTaskFormActionsProps> = ({
  isEditing,
  isLoading,
  onCancel,
  onReset
}) => {
  return (
    <div className="flex space-x-2">
      <Button 
        type="submit" 
        disabled={isLoading}
      >
        {isLoading 
          ? (isEditing ? 'Updating...' : 'Adding...')
          : (isEditing ? 'Update Task' : 'Add Task')
        }
      </Button>
      <Button 
        type="button" 
        variant="outline" 
        onClick={() => {
          onCancel();
          onReset();
        }}
      >
        Cancel
      </Button>
    </div>
  );
};

export default JobsiteTaskFormActions;
