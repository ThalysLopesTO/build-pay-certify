import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2, Check, X, CheckCircle } from 'lucide-react';
import { ChangeOrder } from '@/hooks/useChangeOrders';

interface UnifiedChangeOrdersTableProps {
  orders: ChangeOrder[];
  jobsites: any[];
  onApprove: (order: ChangeOrder) => void;
  onReject: (order: ChangeOrder) => void;
  onComplete: (order: ChangeOrder) => void;
  onViewDetails: (order: ChangeOrder) => void;
  onEdit: (order: ChangeOrder) => void;
  onDelete: (order: ChangeOrder) => void;
  canEdit: (order: ChangeOrder) => boolean;
  canDelete: (order: ChangeOrder) => boolean;
  canApprove: (order: ChangeOrder) => boolean;
  isAdmin: boolean;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  submitted: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  completed: 'bg-blue-100 text-blue-800',
};

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Pending',
  approved: 'Approved',
  rejected: 'Declined',
  completed: 'Completed',
};

const formatCurrency = (amount?: number) => {
  if (!amount) return 'N/A';
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(amount);
};

const UnifiedChangeOrdersTable = ({
  orders,
  jobsites,
  onApprove,
  onReject,
  onComplete,
  onViewDetails,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
  canApprove,
  isAdmin,
}: UnifiedChangeOrdersTableProps) => {
  const getJobsiteName = (projectId: string) => {
    const jobsite = jobsites.find(j => j.id === projectId);
    return jobsite?.name || 'Unknown Jobsite';
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Jobsite</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Cost</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Creator</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                No change orders found.
              </TableCell>
            </TableRow>
          ) : (
            orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.title}</TableCell>
                <TableCell>{getJobsiteName(order.project_id)}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {order.type === 'admin' ? 'Official' : 'Request'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[order.status] || statusColors.draft}>
                    {statusLabels[order.status] || order.status}
                  </Badge>
                </TableCell>
                <TableCell>{formatCurrency(order.cost)}</TableCell>
                <TableCell>
                  {new Date(order.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {order.creator ? `${order.creator.first_name} ${order.creator.last_name}` : 'Unknown'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails(order)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {canEdit(order) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(order)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}

                    {canApprove(order) && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onApprove(order)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onReject(order)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}

                    {isAdmin && order.status === 'approved' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onComplete(order)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}

                    {canDelete(order) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(order)}
                        className="text-red-600 hover:text-red-700"
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
  );
};

export default UnifiedChangeOrdersTable;