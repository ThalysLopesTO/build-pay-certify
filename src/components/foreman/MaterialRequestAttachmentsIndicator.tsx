import React from 'react';
import { useMaterialRequestAttachments } from '@/hooks/useMaterialRequestAttachments';
import MaterialRequestPhotosViewer from './MaterialRequestPhotosViewer';

interface MaterialRequestAttachmentsIndicatorProps {
  materialRequestId: string;
}

const MaterialRequestAttachmentsIndicator: React.FC<MaterialRequestAttachmentsIndicatorProps> = ({
  materialRequestId,
}) => {
  const { data: attachments = [] } = useMaterialRequestAttachments(materialRequestId);

  if (attachments.length === 0) {
    return null;
  }

  return (
    <MaterialRequestPhotosViewer materialRequestId={materialRequestId} />
  );
};

export default MaterialRequestAttachmentsIndicator;