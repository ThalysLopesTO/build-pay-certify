
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Package, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { useMaterialTakeoffs, useMaterialTakeoffMutations } from '@/hooks/useMaterialTakeoffs';
import { useJobsites } from '@/hooks/useJobsites';
import MaterialTakeoffForm from './MaterialTakeoffForm';

const MaterialTakeoffManagement = () => {
  const [selectedJobsite, setSelectedJobsite] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingTakeoff, setEditingTakeoff] = useState<any>(null);

  const { data: jobsites = [] } = useJobsites();
  const { data: takeoffs = [], isLoading } = useMaterialTakeoffs(
    selectedJobsite === 'all' ? undefined : selectedJobsite
  );
  const { deleteTakeoff } = useMaterialTakeoffMutations();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_requested':
        return 'bg-gray-100 text-gray-800';
      case 'partially_requested':
        return 'bg-yellow-100 text-yellow-800';
      case 'fully_requested':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'not_requested':
        return 'Not Requested';
      case 'partially_requested':
        return 'Partially Requested';
      case 'fully_requested':
        return 'Fully Requested';
      default:
        return status;
    }
  };

  const handleEdit = (takeoff: any) => {
    setEditingTakeoff(takeoff);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this takeoff item?')) {
      deleteTakeoff(id);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTakeoff(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Material Takeoff Management</h1>
          <p className="text-gray-600">Manage material takeoffs and track requests</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Takeoff Item
        </Button>
      </div>

      {showForm && (
        <MaterialTakeoffForm
          takeoff={editingTakeoff}
          onClose={handleCloseForm}
        />
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Material Takeoffs</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Select value={selectedJobsite} onValueChange={setSelectedJobsite}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by jobsite" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jobsites</SelectItem>
                  {jobsites.map((jobsite) => (
                    <SelectItem key={jobsite.id} value={jobsite.id}>
                      {jobsite.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading material takeoffs...</div>
          ) : takeoffs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <h3 className="text-lg font-semibold mb-2">No Material Takeoffs</h3>
              <p>No material takeoffs found for the selected criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Total Qty</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Subtotal</TableHead>
                    <TableHead>Requested Qty</TableHead>
                    <TableHead>Remaining Qty</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Jobsite</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {takeoffs.map((takeoff) => (
                    <TableRow key={takeoff.id}>
                      <TableCell className="font-medium">
                        {takeoff.material_name}
                      </TableCell>
                      <TableCell>{takeoff.unit}</TableCell>
                      <TableCell>{takeoff.total_qty_estimated}</TableCell>
                      <TableCell>${takeoff.unit_price.toFixed(2)}</TableCell>
                      <TableCell>${takeoff.subtotal.toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={takeoff.requested_qty > 0 ? 'font-semibold text-blue-600' : ''}>
                          {takeoff.requested_qty}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={takeoff.remaining_qty < 0 ? 'font-semibold text-red-600' : ''}>
                          {takeoff.remaining_qty}
                          {takeoff.remaining_qty < 0 && (
                            <AlertTriangle className="h-4 w-4 inline ml-1 text-red-500" />
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(takeoff.status)}>
                          {getStatusText(takeoff.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{takeoff.jobsites?.name}</div>
                          {takeoff.jobsites?.address && (
                            <div className="text-sm text-gray-500">{takeoff.jobsites.address}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(takeoff)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(takeoff.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MaterialTakeoffManagement;
