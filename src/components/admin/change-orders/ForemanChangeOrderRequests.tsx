import React, { useState } from 'react';
import { useForemanChangeOrderRequests } from '@/hooks/useChangeOrders';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import ChangeOrdersTable from './ChangeOrdersTable';
import ChangeOrderForm from './ChangeOrderForm';
import ChangeOrderDetails from './ChangeOrderDetails';
import { ChangeOrder } from '@/hooks/useChangeOrders';

const ForemanChangeOrderRequests = () => {
  const { user } = useAuth();
  const { myRequests, allChangeOrders, updateChangeOrder, deleteChangeOrder } = useForemanChangeOrderRequests();
  const [selectedOrder, setSelectedOrder] = useState<ChangeOrder | null>(null);
  const [editingOrder, setEditingOrder] = useState<ChangeOrder | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const isForeman = user?.role === 'foreman';
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'management';

  // Show different data based on role
  const displayOrders = isForeman ? myRequests : allChangeOrders.filter(order => order.type === 'foreman_request');

  const handleViewDetails = (order: ChangeOrder) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  const handleEdit = (order: ChangeOrder) => {
    // Only allow editing own requests that are draft or submitted
    if (order.created_by === user?.id && ['draft', 'submitted'].includes(order.status)) {
      setEditingOrder(order);
    }
  };

  const canEdit = (order: ChangeOrder) => {
    return order.created_by === user?.id && ['draft', 'submitted'].includes(order.status);
  };

  const canDelete = (order: ChangeOrder) => {
    return (order.created_by === user?.id && order.status === 'draft') || isAdmin;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">
          {isForeman ? 'My Change Order Requests' : 'All Foreman Requests'}
        </h3>
        <ChangeOrdersTable
          orders={displayOrders}
          onViewDetails={handleViewDetails}
          onEdit={handleEdit}
          onDelete={deleteChangeOrder}
          canEdit={canEdit}
          canDelete={canDelete}
          showRequestActions
        />
      </div>

      {editingOrder && (
        <ChangeOrderForm
          isOpen={!!editingOrder}
          onClose={() => setEditingOrder(null)}
          editingOrder={editingOrder}
          type="foreman_request"
        />
      )}

      {selectedOrder && (
        <ChangeOrderDetails
          isOpen={showDetails}
          onClose={() => setShowDetails(false)}
          order={selectedOrder}
        />
      )}
    </div>
  );
};

export default ForemanChangeOrderRequests;