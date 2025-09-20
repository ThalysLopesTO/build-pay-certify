import React, { useState } from 'react';
import { useAdminChangeOrders } from '@/hooks/useChangeOrders';
import ChangeOrdersTable from './ChangeOrdersTable';
import ChangeOrderForm from './ChangeOrderForm';
import ChangeOrderDetails from './ChangeOrderDetails';
import { ChangeOrder } from '@/hooks/useChangeOrders';

const AdminChangeOrders = () => {
  const { adminOrders, foremanRequests, updateChangeOrder, deleteChangeOrder } = useAdminChangeOrders();
  const [selectedOrder, setSelectedOrder] = useState<ChangeOrder | null>(null);
  const [editingOrder, setEditingOrder] = useState<ChangeOrder | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleApprove = (order: ChangeOrder) => {
    updateChangeOrder({
      id: order.id,
      data: { status: 'approved' }
    });
  };

  const handleReject = (order: ChangeOrder) => {
    updateChangeOrder({
      id: order.id,
      data: { status: 'rejected' }
    });
  };

  const handleComplete = (order: ChangeOrder) => {
    updateChangeOrder({
      id: order.id,
      data: { status: 'completed' }
    });
  };

  const handleViewDetails = (order: ChangeOrder) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  const handleEdit = (order: ChangeOrder) => {
    setEditingOrder(order);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Official Change Orders</h3>
        <ChangeOrdersTable
          orders={adminOrders}
          onApprove={handleApprove}
          onReject={handleReject}
          onComplete={handleComplete}
          onViewDetails={handleViewDetails}
          onEdit={handleEdit}
          onDelete={deleteChangeOrder}
          showAllActions
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Foreman Requests Pending Review</h3>
        <ChangeOrdersTable
          orders={foremanRequests.filter(order => order.status === 'submitted')}
          onApprove={handleApprove}
          onReject={handleReject}
          onViewDetails={handleViewDetails}
          onDelete={deleteChangeOrder}
          showApprovalActions
        />
      </div>

      {editingOrder && (
        <ChangeOrderForm
          isOpen={!!editingOrder}
          onClose={() => setEditingOrder(null)}
          editingOrder={editingOrder}
          type="admin"
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

export default AdminChangeOrders;