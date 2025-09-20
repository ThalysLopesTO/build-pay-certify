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
            
            {/* Start and End dates for foreman requests */}
            {type === 'foreman_request' && (
              <>
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
            
            {/* File upload for foreman requests */}
            {type === 'foreman_request' && (
              <div className="col-span-2">
                <Label htmlFor="images">Upload Images</Label>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Input
                      id="images"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="file:mr-4 file:py-1 file:px-4 file:rounded file:border-0 file:text-sm file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={() => setSelectedFiles([])}>
                      Clear
                    </Button>
                  </div>
                  
                  {/* Selected files preview */}
                  {selectedFiles.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full h-20 object-cover rounded border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          <p className="text-xs truncate mt-1">{file.name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Uploaded files preview */}
                  {uploadedUrls.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Current attachments:</p>
                      <div className="grid grid-cols-3 gap-2">
                        {uploadedUrls.map((url, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={url}
                              alt={`Attachment ${index + 1}`}
                              className="w-full h-20 object-cover rounded border"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeUploadedFile(url)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
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