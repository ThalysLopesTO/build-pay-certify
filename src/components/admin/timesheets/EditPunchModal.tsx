
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useActiveJobsites } from '@/hooks/useJobsites';
import { usePunchEdit } from '@/hooks/usePunchEdit';
import { format } from 'date-fns';
import { AlertTriangle } from 'lucide-react';

interface EditPunchModalProps {
  isOpen: boolean;
  onClose: () => void;
  timesheet: any;
}

const EditPunchModal: React.FC<EditPunchModalProps> = ({
  isOpen,
  onClose,
  timesheet
}) => {
  const { data: jobsites } = useActiveJobsites();
  const { mutate: updatePunch, isPending: isEditing } = usePunchEdit();
  
  const [formData, setFormData] = useState({
    check_in_time: '',
    check_out_time: '',
    jobsite_id: ''
  });

  useEffect(() => {
    if (timesheet && isOpen) {
      setFormData({
        check_in_time: timesheet.check_in_time 
          ? format(new Date(timesheet.check_in_time), "yyyy-MM-dd'T'HH:mm")
          : '',
        check_out_time: timesheet.check_out_time 
          ? format(new Date(timesheet.check_out_time), "yyyy-MM-dd'T'HH:mm")
          : '',
        jobsite_id: timesheet.jobsite_id || ''
      });
    }
  }, [timesheet, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updateData: any = {};

    if (formData.check_in_time) {
      updateData.check_in_time = new Date(formData.check_in_time).toISOString();
    }
    if (formData.check_out_time) {
      updateData.check_out_time = new Date(formData.check_out_time).toISOString();
    }
    if (formData.jobsite_id) {
      updateData.jobsite_id = formData.jobsite_id;
    }

    updatePunch({ id: timesheet.id, data: updateData });
    onClose();
  };

  const isOpenShift = timesheet?.check_in_time && !timesheet?.check_out_time;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit Punch Record
            {isOpenShift && (
              <div className="flex items-center gap-1 text-red-600 text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>Open Shift</span>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="check_in_time">Clock In Time</Label>
            <Input
              id="check_in_time"
              type="datetime-local"
              value={formData.check_in_time}
              onChange={(e) => setFormData(prev => ({ ...prev, check_in_time: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="check_out_time">Clock Out Time</Label>
            <Input
              id="check_out_time"
              type="datetime-local"
              value={formData.check_out_time}
              onChange={(e) => setFormData(prev => ({ ...prev, check_out_time: e.target.value }))}
            />
            {isOpenShift && (
              <p className="text-sm text-red-600 mt-1">
                Employee forgot to clock out - please set the clock out time
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="jobsite_id">Jobsite</Label>
            <Select 
              value={formData.jobsite_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, jobsite_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select jobsite" />
              </SelectTrigger>
              <SelectContent>
                {jobsites?.map((jobsite) => (
                  <SelectItem key={jobsite.id} value={jobsite.id}>
                    {jobsite.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>


          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isEditing}>
              {isEditing ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditPunchModal;
