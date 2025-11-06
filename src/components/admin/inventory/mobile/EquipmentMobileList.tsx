import React from 'react';
import PullToRefresh from 'react-simple-pull-to-refresh';
import { InventoryItem } from '@/hooks/useInventory';
import EquipmentCard from './EquipmentCard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Package } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface GroupedEquipment {
  jobsiteName: string;
  jobsiteId: string | null;
  equipment: InventoryItem[];
}

interface EquipmentMobileListProps {
  groupedEquipment: Array<[string, GroupedEquipment]>;
  getEquipmentStatus: (item: InventoryItem) => string;
  canManageInventory: boolean;
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
  onView: (item: InventoryItem) => void;
  onReturn: (item: InventoryItem) => void;
  isReturning: boolean;
  onRefresh: () => Promise<void>;
  isLoading: boolean;
}

const EquipmentMobileList: React.FC<EquipmentMobileListProps> = ({
  groupedEquipment,
  getEquipmentStatus,
  canManageInventory,
  onEdit,
  onDelete,
  onView,
  onReturn,
  isReturning,
  onRefresh,
  isLoading,
}) => {
  const [openSections, setOpenSections] = React.useState<Set<string>>(
    new Set(groupedEquipment.map(([key]) => key))
  );

  const toggleSection = (key: string) => {
    const newOpenSections = new Set(openSections);
    if (newOpenSections.has(key)) {
      newOpenSections.delete(key);
    } else {
      newOpenSections.add(key);
    }
    setOpenSections(newOpenSections);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (groupedEquipment.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardContent className="p-8 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
          <p className="text-muted-foreground">No equipment items found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your filters or add new equipment
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <PullToRefresh onRefresh={onRefresh} pullingContent="">
      <div className="space-y-4 pb-20">
        {groupedEquipment.map(([key, group]) => (
          <Collapsible
            key={key}
            open={openSections.has(key)}
            onOpenChange={() => toggleSection(key)}
          >
            <Card className="shadow-sm">
              <CollapsibleTrigger className="w-full">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {openSections.has(key) ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <h3 className="font-semibold text-base">
                        {group.jobsiteName}
                      </h3>
                    </div>
                    <Badge variant="secondary">
                      {group.equipment.length}
                    </Badge>
                  </div>
                </CardContent>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="px-4 pb-4 pt-0 space-y-3">
                  {group.equipment.map((item) => (
                    <EquipmentCard
                      key={item.id}
                      item={item}
                      status={getEquipmentStatus(item)}
                      canManageInventory={canManageInventory}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onView={onView}
                      onReturn={onReturn}
                      isReturning={isReturning}
                    />
                  ))}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </div>
    </PullToRefresh>
  );
};

export default EquipmentMobileList;
