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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioCard } from '@/components/ui/radio-card';
import { FileDropzone } from '@/components/ui/file-dropzone';
import { useChangeOrders, ChangeOrder } from '@/hooks/useChangeOrders';
import { useActiveJobsites } from '@/hooks/useJobsites';
import { 
  Loader2, 
  FileText, 
  Plus, 
  DollarSign, 
  Calendar, 
  Briefcase,
  Building,
  FileImage
} from 'lucide-react';
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
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
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
            
            {/* Basic Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Briefcase className="h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Enter the essential details for this order
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title" className="text-sm font-medium">Order Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Enter a descriptive title"
                        className="mt-1"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="project" className="text-sm font-medium">Project</Label>
                      <Select 
                        value={formData.project_id} 
                        onValueChange={(value) => setFormData({ ...formData, project_id: value })}
                        required
                      >
                        <SelectTrigger className="mt-1">
                          <Building className="h-4 w-4 mr-2" />
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

                  <div>
                    <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Provide a detailed description of the work required"
                      rows={5}
                      className="mt-1 resize-none"
                      required
                    />
                  </div>
                </div>

                {/* Order Type Selection */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Order Type</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <RadioCard
                      value="change"
                      checked={formData.order_type === 'change'}
                      onChange={(e) => setFormData({ ...formData, order_type: e.target.value as 'change' | 'extra' })}
                      icon={<FileText className="h-4 w-4" />}
                      title="Change Order"
                      description="Modify existing scope of work"
                    />
                    <RadioCard
                      value="extra"
                      checked={formData.order_type === 'extra'}
                      onChange={(e) => setFormData({ ...formData, order_type: e.target.value as 'change' | 'extra' })}
                      icon={<Plus className="h-4 w-4" />}
                      title="Extra Order"
                      description="Additional work outside original scope"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cost & Timeline Card (Admin only) */}
            {type === 'admin' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <DollarSign className="h-5 w-5" />
                    Cost & Timeline
                  </CardTitle>
                  <CardDescription>
                    Set pricing and schedule information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="cost" className="text-sm font-medium">Cost ($)</Label>
                      <div className="relative mt-1">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="cost"
                          type="number"
                          step="0.01"
                          value={formData.cost}
                          onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                          placeholder="0.00"
                          className="pl-9"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                      <Select 
                        value={formData.status} 
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger className="mt-1">
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
                      <Label className="text-sm font-medium">Timeline</Label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <div>
                          <Input
                            type="date"
                            value={formData.start_date}
                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            placeholder="Start date"
                          />
                        </div>
                        <div>
                          <Input
                            type="date"
                            value={formData.end_date}
                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                            placeholder="End date"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timeline Card (Foreman Request) */}
            {type === 'foreman_request' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="h-5 w-5" />
                    Proposed Timeline
                  </CardTitle>
                  <CardDescription>
                    Suggest when this work should be scheduled
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_date" className="text-sm font-medium">Start Date</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_date" className="text-sm font-medium">End Date</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Attachments Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileImage className="h-5 w-5" />
                  Attachments
                </CardTitle>
                <CardDescription>
                  Upload images, drawings, or documents to support this order
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileDropzone
                  files={selectedFiles}
                  uploadedUrls={uploadedUrls}
                  onFilesChange={setSelectedFiles}
                  onRemoveFile={removeFile}
                  onRemoveUploaded={removeUploadedFile}
                  maxFiles={5}
                  maxSize={5}
                  accept="image/*"
                />
              </CardContent>
            </Card>
          </div>

          {/* Footer Actions */}
          <div className="flex-shrink-0 flex justify-end space-x-3 pt-6 border-t bg-background">
            <Button type="button" variant="outline" onClick={onClose} size="lg">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} size="lg">
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