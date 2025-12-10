import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye, RotateCcw, Camera } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { InventoryItem } from '@/hooks/useInventory';
import { motion } from 'framer-motion';
import EquipmentPhotoGallery from '../EquipmentPhotoGallery';

interface EquipmentCardProps {
  item: InventoryItem;
  status: string;
  canManageInventory: boolean;
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
  onView: (item: InventoryItem) => void;
  onReturn: (item: InventoryItem) => void;
  isReturning: boolean;
  photoCount?: number;
}

const EquipmentCard: React.FC<EquipmentCardProps> = ({
  item,
  status,
  canManageInventory,
  onEdit,
  onDelete,
  onView,
  onReturn,
  isReturning,
  photoCount = 0,
}) => {
  const [swipeX, setSwipeX] = useState(0);
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const isAssigned = status === 'assigned' || status === 'overdue';

  const getStatusColor = () => {
    switch (status) {
      case 'available':
        return 'border-l-4 border-l-green-500';
      case 'assigned':
        return 'border-l-4 border-l-blue-500';
      case 'overdue':
        return 'border-l-4 border-l-red-500';
      case 'returned':
        return 'border-l-4 border-l-gray-500';
      default:
        return '';
    }
  };

  const getStatusBadge = () => {
    const configs = {
      available: 'bg-green-100 text-green-800 border-green-200',
      assigned: 'bg-blue-100 text-blue-800 border-blue-200',
      overdue: 'bg-red-100 text-red-800 border-red-200',
      returned: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    
    const config = configs[status as keyof typeof configs] || configs.returned;
    const label = status.charAt(0).toUpperCase() + status.slice(1);
    
    return (
      <Badge variant="outline" className={`${config} border text-xs`}>
        {label}
      </Badge>
    );
  };

  const getDaysInfo = () => {
    if (!item.return_date) return null;
    
    const returnDate = new Date(item.return_date);
    const today = new Date();
    const days = differenceInDays(returnDate, today);
    
    if (days < 0) {
      return (
        <span className="text-xs text-red-600 font-medium">
          {Math.abs(days)} days overdue
        </span>
      );
    } else if (days === 0) {
      return <span className="text-xs text-amber-600 font-medium">Due today</span>;
    } else if (days <= 3) {
      return <span className="text-xs text-amber-600 font-medium">Due in {days} days</span>;
    }
    return null;
  };

  return (
    <motion.div
      drag={isAssigned && canManageInventory ? "x" : false}
      dragConstraints={{ left: -120, right: 0 }}
      dragElastic={0.1}
      onDragEnd={(_, info) => {
        if (info.offset.x < -80) {
          onReturn(item);
          setSwipeX(0);
        }
      }}
      className="relative"
    >
      {isAssigned && canManageInventory && (
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-blue-500 rounded-r-lg flex items-center justify-center">
          <RotateCcw className="h-5 w-5 text-white" />
          <span className="text-white text-xs font-medium ml-1">Return</span>
        </div>
      )}
      
      <Card className={`${getStatusColor()} shadow-sm hover:shadow-md transition-all`}>
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-base line-clamp-1">
                  {item.equipment_name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.brand} • {item.sku}
                </p>
              </div>
              {getStatusBadge()}
            </div>

            {/* Jobsite */}
            {item.jobsites && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {item.jobsites.name}
                </Badge>
              </div>
            )}

            {/* Dates */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div>
                <span className="font-medium">Start:</span>{' '}
                {format(new Date(item.start_date), 'MMM dd, yyyy')}
              </div>
              {item.return_date && (
                <div>
                  <span className="font-medium">Return:</span>{' '}
                  {format(new Date(item.return_date), 'MMM dd, yyyy')}
                </div>
              )}
            </div>

            {/* Days info */}
            {getDaysInfo() && (
              <div className="flex justify-end">
                {getDaysInfo()}
              </div>
            )}

            {/* Actions */}
            {canManageInventory && (
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPhotoGallery(true)}
                  className="flex-1 h-8 relative"
                >
                  <Camera className="h-3.5 w-3.5 mr-1" />
                  Photos
                  {photoCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-4 px-1 text-[10px] bg-primary text-primary-foreground"
                    >
                      {photoCount}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onView(item)}
                  className="flex-1 h-8"
                >
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  View
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(item)}
                  className="flex-1 h-8"
                >
                  <Edit className="h-3.5 w-3.5 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(item)}
                  className="flex-1 h-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Photo Gallery */}
      <EquipmentPhotoGallery
        isOpen={showPhotoGallery}
        onClose={() => setShowPhotoGallery(false)}
        inventoryId={item.id}
        equipmentName={item.equipment_name}
        canManage={canManageInventory}
      />
    </motion.div>
  );
};

export default EquipmentCard;
