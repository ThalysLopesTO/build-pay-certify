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
import { Loader2, Upload, X, FileImage } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';

interface ChangeOrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingOrder?: ChangeOrder | null;
  type: 'admin' | 'foreman_request';
}

const ChangeOrderForm = ({ isOpen, onClose, editingOrder, type }: ChangeOrderFormProps) => {
  const { createChangeOrder, updateChangeOrder, isCreating, isUpdating } = useChangeOrders();
  const { data: jobsites = [] } = useActiveJobsites();
  
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_id: '',
    order_type: 'change' as 'change' | 'extra',
    cost: '',
    start_date: '',
    end_date: '',
    status: type === 'admin' ? 'draft' : 'submitted',
  });
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

  useEffect(() => {
    if (editingOrder) {
      setFormData({
        title: editingOrder.title,
        description: editingOrder.description,
        project_id: editingOrder.project_id,
        order_type: editingOrder.order_type || 'change',
        cost: editingOrder.cost?.toString() || '',
        start_date: editingOrder.start_date || '',
        end_date: editingOrder.end_date || '',
        status: editingOrder.status,
      });
      setUploadedUrls(editingOrder.attachments || []);
    } else {
      setFormData({
        title: '',
        description: '',
        project_id: '',
        order_type: 'change',
        cost: '',
        start_date: '',
        end_date: '',
        status: type === 'admin' ? 'draft' : 'submitted',
      });
      setSelectedFiles([]);
      setUploadedUrls([]);
    }
  }, [editingOrder, type]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== files.length) {
      toast.error('Only image files are allowed');
    }
    
    setSelectedFiles(prev => [...prev, ...imageFiles].slice(0, 5)); // Max 5 images
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeUploadedFile = (url: string) => {
    setUploadedUrls(prev => prev.filter(u => u !== url));
  };

  const uploadFiles = async (): Promise<string[]> => {
    if (selectedFiles.length === 0) return uploadedUrls;
    
    setUploading(true);
    const uploadPromises = selectedFiles.map(async (file) => {
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}-${file.name}`;
      const filePath = `${user?.companyId}/${fileName}`;
      
      const { error } = await supabase.storage
        .from('change-orders')
        .upload(filePath, file);
      
      if (error) {
        console.error('Upload error:', error);
        throw error;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('change-orders')
        .getPublicUrl(filePath);
      
      return publicUrl;
    });
    
    try {
      const urls = await Promise.all(uploadPromises);
      setUploading(false);
      return [...uploadedUrls, ...urls];
    } catch (error) {
      setUploading(false);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const attachments = await uploadFiles();
      
      const submitData = {
        title: formData.title,
        description: formData.description,
        project_id: formData.project_id,
        type,
        order_type: formData.order_type,
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        status: formData.status as any,
        attachments,
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
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Failed to upload files');
    }
  };

  const isLoading = isCreating || isUpdating || uploading;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {editingOrder ? 'Edit' : 'Create'} Extras / Changes
          </DialogTitle>
          <DialogDescription>
            {type === 'admin' 
              ? 'Create an official extras/changes order with cost and timeline details.'
              : 'Submit an extras/changes order request for admin review.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            {/* Basic Information Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Order title"
                    required
                  />
                </div>

                <div>
                  <Label>Order Type</Label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="change"
                        checked={formData.order_type === 'change'}
                        onChange={(e) => setFormData({ ...formData, order_type: e.target.value as 'change' | 'extra' })}
                        className="text-primary"
                      />
                      <span>Change Order</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="extra"
                        checked={formData.order_type === 'extra'}
                        onChange={(e) => setFormData({ ...formData, order_type: e.target.value as 'change' | 'extra' })}
                        className="text-primary"
                      />
                      <span>Extra Order</span>
                    </label>
                  </div>
                </div>

                <div>
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
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detailed description of the order"
                    rows={6}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Admin Fields */}
            {type === 'admin' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              </div>
            )}

            {/* Foreman Request Fields */}
            {type === 'foreman_request' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              </div>
            )}

            {/* File Upload Section */}
            <div>
              <Label>Attachments</Label>
              <Input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Maximum 5 images, up to 5MB each
              </p>

              {/* Combined Images Preview - More Compact */}
              {(selectedFiles.length > 0 || uploadedUrls.length > 0) && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Images:</h4>
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {/* Uploaded Files */}
                    {uploadedUrls.map((url, index) => (
                      <div key={`uploaded-${index}`} className="relative">
                        <img
                          src={url}
                          alt={`Uploaded ${index}`}
                          className="w-full h-20 object-cover rounded border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs"
                          onClick={() => removeUploadedFile(url)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                    {/* Selected Files */}
                    {selectedFiles.map((file, index) => (
                      <div key={`selected-${index}`} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index}`}
                          className="w-full h-20 object-cover rounded border border-primary"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs"
                          onClick={() => removeFile(index)}
                        >
                          ×
                        </Button>
                        <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-white text-xs p-1 rounded-b">
                          New
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex-shrink-0 flex justify-end space-x-2 pt-4 border-t bg-background">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingOrder ? 'Update' : 'Create'} {formData.order_type === 'change' ? 'Change' : 'Extra'} Order
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChangeOrderForm;