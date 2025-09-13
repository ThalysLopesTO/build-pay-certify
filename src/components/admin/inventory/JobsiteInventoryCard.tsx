import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  ChevronDown, 
  ChevronRight, 
  MapPin, 
  Package,
  Edit,
  Trash2,
  Eye,
  ArrowLeftRight
} from 'lucide-react';
import { format } from 'date-fns';
import { InventoryItem } from '@/hooks/useInventory';
import { cn } from '@/lib/utils';

interface JobsiteInventoryCardProps {
  jobsiteName: string;
  jobsiteId: string | null;
  equipment: InventoryItem[];
  canManageInventory: boolean;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (item: InventoryItem) => void;
  onViewItem: (item: InventoryItem) => void;
  onReturnItem: (item: InventoryItem) => void;
  getStatusBadge: (status: string) => React.ReactNode;
  getEquipmentStatus: (item: InventoryItem) => string;
  isReturning: boolean;
}

const JobsiteInventoryCard: React.FC<JobsiteInventoryCardProps> = ({
  jobsiteName,
  jobsiteId,
  equipment,
  canManageInventory,
  onEditItem,
  onDeleteItem,
  onViewItem,
  onReturnItem,
  getStatusBadge,
  getEquipmentStatus,
  isReturning
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Calculate stats for this jobsite
  const totalEquipment = equipment.length;
  const availableEquipment = equipment.filter(item => 
    getEquipmentStatus(item) === 'available'
  ).length;
  const assignedEquipment = equipment.filter(item => 
    getEquipmentStatus(item) === 'assigned'
  ).length;
  const overdueEquipment = equipment.filter(item => 
    getEquipmentStatus(item) === 'overdue'
  ).length;

  const isUnassigned = jobsiteId === null;

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {isUnassigned ? (
                  <Package className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <MapPin className="h-5 w-5 text-primary" />
                )}
                <div>
                  <h3 className="text-lg font-semibold">
                    {isUnassigned ? 'Unassigned Equipment' : jobsiteName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {totalEquipment} {totalEquipment === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Status summary */}
                <div className="flex space-x-2">
                  {availableEquipment > 0 && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {availableEquipment} Available
                    </Badge>
                  )}
                  {assignedEquipment > 0 && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {assignedEquipment} Assigned
                    </Badge>
                  )}
                  {overdueEquipment > 0 && (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      {overdueEquipment} Overdue
                    </Badge>
                  )}
                </div>
                
                {/* Expand/collapse icon */}
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {equipment.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No equipment found for this jobsite.
              </div>
            ) : (
              <div className="rounded-lg overflow-hidden border">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Equipment Name</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Return Date</TableHead>
                      {canManageInventory && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equipment.map((item, index) => {
                      const status = getEquipmentStatus(item);
                      return (
                        <TableRow key={item.id} className={cn(
                          "hover:bg-muted/50 transition-colors",
                          index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                        )}>
                          <TableCell className="font-medium">{item.equipment_name}</TableCell>
                          <TableCell>{item.brand}</TableCell>
                          <TableCell>{item.sku}</TableCell>
                          <TableCell>{getStatusBadge(status)}</TableCell>
                          <TableCell>{format(new Date(item.start_date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>
                            {item.return_date 
                              ? format(new Date(item.return_date), 'MMM dd, yyyy')
                              : <span className="text-muted-foreground text-sm">Not set</span>
                            }
                          </TableCell>
                          {canManageInventory && (
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 transition-all hover:scale-110"
                                        onClick={() => onViewItem(item)}
                                      >
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>View Details</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                {/* Set as Returned button - only show if not already returned */}
                                {!item.return_date && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 transition-all hover:scale-110"
                                          onClick={() => onReturnItem(item)}
                                          disabled={isReturning}
                                        >
                                          <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Set as Returned</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 transition-all hover:scale-110"
                                        onClick={() => onEditItem(item)}
                                      >
                                        <Edit className="h-4 w-4 text-muted-foreground" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Edit Equipment</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 transition-all hover:scale-110 hover:text-destructive"
                                        onClick={() => onDeleteItem(item)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Delete Equipment</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default JobsiteInventoryCard;