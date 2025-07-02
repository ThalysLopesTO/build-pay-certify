
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Send, AlertTriangle, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import JobsiteSelect from './JobsiteSelect';
import DatePickerField from './DatePickerField';
import { useMaterialRequestSubmission } from '@/hooks/useMaterialRequestSubmission';
import { useMaterialTakeoffs } from '@/hooks/useMaterialTakeoffs';

const formSchema = z.object({
  jobsiteId: z.string().min(1, 'Please select a jobsite'),
  deliveryDate: z.date({
    required_error: 'Please select a delivery date',
  }),
  deliveryTime: z.string().min(1, 'Please enter the delivery time'),
  floorUnit: z.string().optional(),
  materialList: z.string().min(1, 'Please enter the material list'),
  takeoffItems: z.array(z.object({
    takeoffId: z.string(),
    requestedQty: z.number().min(0.01, 'Quantity must be greater than 0'),
  })).optional(),
  unplannedItems: z.array(z.object({
    materialName: z.string(),
    quantity: z.number(),
    unit: z.string(),
    justification: z.string().optional(),
  })).optional(),
});

type FormData = z.infer<typeof formSchema>;

const MaterialRequestFormEnhanced = () => {
  const [selectedJobsite, setSelectedJobsite] = useState<string>('');
  const [showTakeoffItems, setShowTakeoffItems] = useState(false);
  const [selectedTakeoffItems, setSelectedTakeoffItems] = useState<Record<string, number>>({});

  const { data: takeoffs = [] } = useMaterialTakeoffs(selectedJobsite || undefined);
  const submitMutation = useMaterialRequestSubmission();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobsiteId: '',
      floorUnit: '',
      materialList: '',
      deliveryTime: '',
      takeoffItems: [],
      unplannedItems: [],
    },
  });

  useEffect(() => {
    setSelectedJobsite(form.watch('jobsiteId'));
  }, [form.watch('jobsiteId')]);

  const availableTakeoffs = takeoffs.filter(t => 
    t.status !== 'fully_requested' && t.remaining_qty > 0
  );

  const handleTakeoffItemToggle = (takeoffId: string, checked: boolean) => {
    if (checked) {
      setSelectedTakeoffItems(prev => ({ ...prev, [takeoffId]: 1 }));
    } else {
      setSelectedTakeoffItems(prev => {
        const newItems = { ...prev };
        delete newItems[takeoffId];
        return newItems;
      });
    }
  };

  const handleQuantityChange = (takeoffId: string, quantity: number) => {
    setSelectedTakeoffItems(prev => ({ ...prev, [takeoffId]: quantity }));
  };

  const onSubmit = (data: FormData) => {
    // Build takeoff items from selections
    const takeoffItems = Object.entries(selectedTakeoffItems).map(([takeoffId, quantity]) => ({
      takeoffId,
      requestedQty: quantity,
    }));

    // Transform the data to match MaterialRequestData interface
    const requestData = {
      jobsiteId: data.jobsiteId,
      deliveryDate: data.deliveryDate,
      deliveryTime: data.deliveryTime,
      floorUnit: data.floorUnit,
      materialList: data.materialList,
      takeoffItems,
    };
    
    submitMutation.mutate(requestData);
    form.reset();
    setSelectedTakeoffItems({});
  };

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Send className="h-5 w-5" />
            <span>Material Request Form</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="jobsiteId"
                render={({ field }) => (
                  <JobsiteSelect
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                )}
              />

              <FormField
                control={form.control}
                name="deliveryDate"
                render={({ field }) => (
                  <DatePickerField
                    value={field.value}
                    onChange={field.onChange}
                    label="Delivery Date"
                    placeholder="Pick a delivery date"
                  />
                )}
              />

              <FormField
                control={form.control}
                name="deliveryTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery Time</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., 9:00 AM, 2:30 PM, 14:00" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="floorUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Floor / Unit (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 3rd Floor, Unit 205" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedJobsite && availableTakeoffs.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="show-takeoff"
                      checked={showTakeoffItems}
                      onCheckedChange={setShowTakeoffItems}
                    />
                    <label htmlFor="show-takeoff" className="text-sm font-medium">
                      Request from Material Takeoff ({availableTakeoffs.length} items available)
                    </label>
                  </div>

                  {showTakeoffItems && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <Package className="h-4 w-4" />
                          <span>Available Takeoff Items</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-12">Select</TableHead>
                                <TableHead>Material</TableHead>
                                <TableHead>Unit</TableHead>
                                <TableHead>Available</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Request Qty</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {availableTakeoffs.map((takeoff) => (
                                <TableRow key={takeoff.id}>
                                  <TableCell>
                                    <Checkbox
                                      checked={takeoff.id in selectedTakeoffItems}
                                      onCheckedChange={(checked) => 
                                        handleTakeoffItemToggle(takeoff.id, checked as boolean)
                                      }
                                    />
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {takeoff.material_name}
                                  </TableCell>
                                  <TableCell>{takeoff.unit}</TableCell>
                                  <TableCell>
                                    <span className={takeoff.remaining_qty <= 0 ? 'text-red-600 font-semibold' : ''}>
                                      {takeoff.remaining_qty}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={getStatusColor(takeoff.status)}>
                                      {takeoff.status.replace('_', ' ')}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {takeoff.id in selectedTakeoffItems && (
                                      <Input
                                        type="number"
                                        min="0.01"
                                        max={takeoff.remaining_qty}
                                        step="0.01"
                                        value={selectedTakeoffItems[takeoff.id]}
                                        onChange={(e) => 
                                          handleQuantityChange(takeoff.id, parseFloat(e.target.value) || 0)
                                        }
                                        className="w-24"
                                      />
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              <FormField
                control={form.control}
                name="materialList"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <span>Material List</span>
                      {Object.keys(selectedTakeoffItems).length > 0 && (
                        <div className="flex items-center space-x-1 text-sm text-amber-600">
                          <AlertTriangle className="h-4 w-4" />
                          <span>Include any additional items not in takeoff</span>
                        </div>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter detailed list of additional materials needed..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? 'Submitting...' : 'Submit Material Request'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaterialRequestFormEnhanced;
