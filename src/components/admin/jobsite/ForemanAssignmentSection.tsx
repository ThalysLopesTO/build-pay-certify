import React from 'react';
import { Controller } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Mail } from 'lucide-react';
import { useAvailableForemen, useJobsiteForemen } from '@/hooks/useJobsiteForemen';

interface ForemanAssignmentSectionProps {
  control: any;
  jobsiteId?: string;
}

const ForemanAssignmentSection: React.FC<ForemanAssignmentSectionProps> = ({ 
  control, 
  jobsiteId 
}) => {
  const { data: availableForemen = [], isLoading: isLoadingForemen } = useAvailableForemen();
  const { data: assignedForemen = [] } = useJobsiteForemen(jobsiteId || undefined);

  // Get currently assigned foreman IDs
  const assignedForemanIds = assignedForemen.map(af => af.foreman_id);

  if (isLoadingForemen) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assign Foremen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading foremen...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Assign Foremen
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Select foremen who will manage this jobsite. They will see this project in their dashboard.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {availableForemen.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            No foremen available in your company.
          </div>
        ) : (
          <Controller
            name="assignedForemen"
            control={control}
            defaultValue={assignedForemanIds}
            render={({ field }) => (
              <div className="space-y-3">
                {availableForemen.map((foreman) => (
                  <div 
                    key={foreman.id} 
                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      id={`foreman-${foreman.id}`}
                      checked={field.value?.includes(foreman.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          field.onChange([...(field.value || []), foreman.id]);
                        } else {
                          field.onChange(field.value?.filter((id: string) => id !== foreman.id));
                        }
                      }}
                    />
                    <Label 
                      htmlFor={`foreman-${foreman.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">
                            {foreman.first_name} {foreman.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {foreman.email}
                          </div>
                        </div>
                        {field.value?.includes(foreman.id) && (
                          <div className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded">
                            Assigned
                          </div>
                        )}
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            )}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default ForemanAssignmentSection;