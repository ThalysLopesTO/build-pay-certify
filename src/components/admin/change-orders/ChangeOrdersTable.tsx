import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Eye, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  CheckCircle, 
  Search,
  Filter
} from 'lucide-react';
import { ChangeOrder } from '@/hooks/useChangeOrders';
import { format } from 'date-fns';

interface ChangeOrdersTableProps {
  orders: ChangeOrder[];
  onApprove?: (order: ChangeOrder) => void;
  onReject?: (order: ChangeOrder) => void;
  onComplete?: (order: ChangeOrder) => void;
  onViewDetails: (order: ChangeOrder) => void;
  onEdit?: (order: ChangeOrder) => void;
  onDelete?: (id: string) => void;
  canEdit?: (order: ChangeOrder) => boolean;
  canDelete?: (order: ChangeOrder) => boolean;
  showAllActions?: boolean;
  showApprovalActions?: boolean;
  showRequestActions?: boolean;
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  submitted: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  completed: 'bg-purple-100 text-purple-800',
};

const ChangeOrdersTable = ({
  orders,
  onApprove,
  onReject,
  onComplete,
  onViewDetails,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
  showAllActions,
  showApprovalActions,
  showRequestActions,
}: ChangeOrdersTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesProject = projectFilter === 'all' || order.project_id === projectFilter;
    
    return matchesSearch && matchesStatus && matchesProject;
  });

  const uniqueProjects = Array.from(new Set(orders.map(order => order.project?.name).filter(Boolean)));

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search change orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {uniqueProjects.map((project) => (
              <SelectItem key={project} value={project!}>
                {project}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No change orders found
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id}>
                   <TableCell>
                     <div>
                       <p className="font-medium">{order.title}</p>
                       <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                         {order.description}
                       </p>
                       {order.type === 'foreman_request' && (order.start_date || order.end_date) && (
                         <p className="text-xs text-muted-foreground mt-1">
                           {order.start_date && format(new Date(order.start_date), 'MMM d')}
                           {order.start_date && order.end_date && ' - '}
                           {order.end_date && format(new Date(order.end_date), 'MMM d, yyyy')}
                         </p>
                       )}
                       {order.attachments && order.attachments.length > 0 && (
                         <p className="text-xs text-blue-600 mt-1">
                           📎 {order.attachments.length} attachment{order.attachments.length > 1 ? 's' : ''}
                         </p>
                       )}
                     </div>
                   </TableCell>
                  <TableCell>{order.project?.name || 'Unknown'}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[order.status]}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(order.cost)}</TableCell>
                  <TableCell>
                    {format(new Date(order.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    {order.creator ? 
                      `${order.creator.first_name} ${order.creator.last_name}` : 
                      'Unknown'
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onViewDetails(order)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {onEdit && (!canEdit || canEdit(order)) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEdit(order)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}

                      {/* Approval actions for pending foreman requests */}
                      {showApprovalActions && order.status === 'submitted' && (
                        <>
                          {onApprove && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => onApprove(order)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          {onReject && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => onReject(order)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}

                      {/* Complete action for approved orders */}
                      {showAllActions && onComplete && order.status === 'approved' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-purple-600 hover:text-purple-700"
                          onClick={() => onComplete(order)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}

                      {onDelete && (!canDelete || canDelete(order)) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => onDelete(order.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ChangeOrdersTable;