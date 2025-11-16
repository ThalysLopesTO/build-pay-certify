import React from 'react';
import { Eye, Edit, CheckCircle, RotateCcw, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

interface Jobsite {
  id: string;
  name: string;
  status?: string;
}

interface JobsiteMobileActionsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobsite: Jobsite;
  onViewDetails: () => void;
  onEdit: () => void;
  onComplete?: () => void;
  onReactivate?: () => void;
  onDelete: () => void;
}

const JobsiteMobileActions: React.FC<JobsiteMobileActionsProps> = ({
  open,
  onOpenChange,
  jobsite,
  onViewDetails,
  onEdit,
  onComplete,
  onReactivate,
  onDelete,
}) => {
  const isCompleted = jobsite.status === 'completed';

  const handleAction = (action: () => void) => {
    action();
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{jobsite.name}</DrawerTitle>
          <DrawerDescription>Choose an action</DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-6 space-y-2">
          <Button
            variant="outline"
            className="w-full h-14 justify-start text-base"
            onClick={() => handleAction(onViewDetails)}
          >
            <Eye className="h-5 w-5 mr-3" />
            View Details
          </Button>

          <Button
            variant="outline"
            className="w-full h-14 justify-start text-base"
            onClick={() => handleAction(onEdit)}
          >
            <Edit className="h-5 w-5 mr-3" />
            Edit Jobsite
          </Button>

          {isCompleted ? (
            onReactivate && (
              <Button
                variant="outline"
                className="w-full h-14 justify-start text-base text-blue-600 border-blue-200 hover:bg-blue-50"
                onClick={() => handleAction(onReactivate)}
              >
                <RotateCcw className="h-5 w-5 mr-3" />
                Reactivate Jobsite
              </Button>
            )
          ) : (
            onComplete && (
              <Button
                variant="outline"
                className="w-full h-14 justify-start text-base text-green-600 border-green-200 hover:bg-green-50"
                onClick={() => handleAction(onComplete)}
              >
                <CheckCircle className="h-5 w-5 mr-3" />
                Mark as Complete
              </Button>
            )
          )}

          <Button
            variant="outline"
            className="w-full h-14 justify-start text-base text-destructive border-destructive/20 hover:bg-destructive/10"
            onClick={() => handleAction(onDelete)}
          >
            <Trash2 className="h-5 w-5 mr-3" />
            Delete Jobsite
          </Button>
        </div>

        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="ghost" className="h-12">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default JobsiteMobileActions;
