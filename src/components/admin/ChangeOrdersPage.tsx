import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import AdminChangeOrders from './change-orders/AdminChangeOrders';
import ForemanChangeOrderRequests from './change-orders/ForemanChangeOrderRequests';
import ChangeOrderForm from './change-orders/ChangeOrderForm';

const ChangeOrdersPage = () => {
  const { user } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState('admin');

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'management';
  const isForeman = user?.role === 'foreman';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Change Orders</h1>
          <p className="text-muted-foreground">
            Manage project revisions and extra work orders
          </p>
        </div>
        {(isAdmin || isForeman) && (
          <Button onClick={() => setShowCreateForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Change Order
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Change Orders Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="admin" disabled={!isAdmin}>
                Admin Change Orders
              </TabsTrigger>
              <TabsTrigger value="foreman">
                Foreman Requests
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="admin" className="mt-6">
              {isAdmin ? (
                <AdminChangeOrders />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  You don't have permission to view admin change orders.
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="foreman" className="mt-6">
              <ForemanChangeOrderRequests />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {showCreateForm && (
        <ChangeOrderForm
          isOpen={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          type={activeTab === 'admin' && isAdmin ? 'admin' : 'foreman_request'}
        />
      )}
    </div>
  );
};

export default ChangeOrdersPage;