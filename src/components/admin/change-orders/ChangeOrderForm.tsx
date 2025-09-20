import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useChangeOrders, ChangeOrder } from '@/hooks/useChangeOrders';
import { useActiveJobsites } from '@/hooks/useJobsites';
import { Loader2 } from 'lucide-react';

interface ChangeOrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingOrder?: ChangeOrder | null;
  type: 'admin' | 'foreman_request';
}

const ChangeOrderForm = ({ isOpen, onClose, editingOrder, type }: ChangeOrderFormProps) => {
  const { createChangeOrder, updateChangeOrder, isCreating, isUpdating } = useChangeOrders();
  const { data: jobsites = [] } = useActiveJobsites();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_id: '',
    cost: '',
    start_date: '',
    end_date: '',
    status: type === 'admin' ? 'draft' : 'submitted',
  });

  useEffect(() => {
    if (editingOrder) {
      setFormData({
        title: editingOrder.title,
        description: editingOrder.description,
        project_id: editingOrder.project_id,
        cost: editingOrder.cost?.toString() || '',
        start_date: editingOrder.start_date || '',
        end_date: editingOrder.end_date || '',
        status: editingOrder.status,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        project_id: '',
        cost: '',
        start_date: '',
        end_date: '',
        status: type === 'admin' ? 'draft' : 'submitted',
      });
    }
  }, [editingOrder, type]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      title: formData.title,
      description: formData.description,
      project_id: formData.project_id,
      type,
      cost: formData.cost ? parseFloat(formData.cost) : undefined,
      start_date: formData.start_date || undefined,
      end_date: formData.end_date || undefined,
      status: formData.status as any,
    };

    if (editingOrder) {
      updateChangeOrder({
        id: editingOrder.id,
        data: submitData,
      });
    } else {
      createChangeOrder(submitData);
    }
    
    onClose();
  };

  const isLoading = isCreating || isUpdating;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {editingOrder ? 'Edit' : 'Create'} {type === 'admin' ? 'Change Order' : 'Change Order Request'}
          </DialogTitle>
          <DialogDescription>
            {type === 'admin' 
              ? 'Create an official change order with cost and timeline details.'
              : 'Submit a change order request for admin review.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Change order title"
                required
              />
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="project">Project</Label>
              <Select 
                value={formData.project_id} 
                onValueChange={(value) => setFormData({ ...formData, project_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {jobsites.map((jobsite) => (
                    <SelectItem key={jobsite.id} value={jobsite.id}>
                      {jobsite.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed description of the change order"
                rows={4}
                required
              />
            </div>
            
            {type === 'admin' && (
              <>
                <div>
                  <Label htmlFor="cost">Cost ($)</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </>
            )}
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingOrder ? 'Update' : 'Create'} {type === 'admin' ? 'Change Order' : 'Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChangeOrderForm;