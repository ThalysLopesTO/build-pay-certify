import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import MaterialRequestDetailsBody from './MaterialRequestDetailsBody';
import { EnrichedMaterialRequest } from '@/hooks/useMaterialRequests';

interface Props {
  request: EnrichedMaterialRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (request: EnrichedMaterialRequest) => void;
  onDuplicate?: (request: EnrichedMaterialRequest) => void;
}

const MaterialRequestDetailsDrawer: React.FC<Props> = ({ request, isOpen, onClose, onEdit, onDuplicate }) => {
  if (!request) return null;

  const canEdit = Boolean(request.canEdit);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Material Request Details</SheetTitle>
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close details">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <MaterialRequestDetailsBody request={request} />
        </div>

        <div className="sticky bottom-0 bg-background border-t mt-6 pt-4 pb-4 flex gap-2">
          <Button variant="secondary" onClick={onClose} className="ml-auto">Close</Button>
          <Button variant="outline" onClick={() => onDuplicate?.(request)}>Duplicate</Button>
          <Button disabled={!canEdit} onClick={() => onEdit?.(request)} title={!canEdit ? 'Edit period expired (24h after creation)' : undefined}>
            Edit Request
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MaterialRequestDetailsDrawer;
