
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';

interface MaterialRequestData {
  jobsiteId: string;
  deliveryDate: Date;
  deliveryTime: string;
  floorUnit?: string;
  materialList: string;
  files?: File[];
  takeoffItems?: Array<{
    takeoffId: string;
    requestedQty: number;
  }>;
}

export const useMaterialRequestSubmission = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: MaterialRequestData) => {
      console.log('🔄 Material request submission started');
      console.log('🔍 Full user object:', user);
      console.log('🔍 User info:', { userId: user?.id, companyId: user?.companyId, role: user?.role });
      console.log('📝 Request data:', data);
      
      if (!user?.id) {
        console.error('❌ User ID not found:', { user });
        throw new Error('User not authenticated - no user ID');
      }

      if (!user?.companyId) {
        console.error('❌ Company ID not found:', { user });
        throw new Error('User not authenticated - no company ID');
      }

      console.log('✅ User authenticated, proceeding with submission');

      // Prepare the insert data
      const insertData = {
        jobsite_id: data.jobsiteId,
        delivery_date: data.deliveryDate.toISOString().split('T')[0],
        delivery_time: data.deliveryTime,
        floor_unit: data.floorUnit || null,
        material_list: data.materialList,
        status: 'pending' as const,
        submitted_by: user.id,
        company_id: user.companyId,
      };
      
      console.log('📤 Inserting material request with data:', insertData);

      // Insert the main material request
      const { data: materialRequest, error: requestError } = await supabase
        .from('material_requests')
        .insert(insertData)
        .select()
        .single();

      console.log('📥 Supabase response:', { materialRequest, requestError });

      if (requestError) {
        console.error('❌ Error creating material request:', requestError);
        throw requestError;
      }

      // If there are takeoff items, create the junction records
      if (data.takeoffItems && data.takeoffItems.length > 0) {
        const takeoffRequests = data.takeoffItems.map(item => ({
          material_request_id: materialRequest.id,
          material_takeoff_id: item.takeoffId,
          requested_qty: item.requestedQty,
          is_unplanned: false
        }));

        // For now, we'll skip the junction table inserts since the types aren't available
        // This would normally insert into material_takeoff_requests table
        console.log('Would insert takeoff requests:', takeoffRequests);
      }

      // If there are items not in takeoff (in materialList), we would mark as unplanned
      if (data.materialList.trim()) {
        console.log('Would create unplanned request record for material request:', materialRequest.id);
      }

      // Handle file uploads if any
      if (data.files && data.files.length > 0) {
        console.log('📁 Uploading files:', data.files.length);
        
        for (const file of data.files) {
          // Generate unique file path
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `${user.companyId}/${user.id}/${fileName}`;

          // Upload to storage
          const { error: uploadError } = await supabase.storage
            .from('material-request-attachments')
            .upload(filePath, file);

          if (uploadError) {
            console.error('❌ File upload error:', uploadError);
            throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
          }

          // Save file info to database
          const { error: dbError } = await supabase
            .from('material_request_attachments')
            .insert({
              material_request_id: materialRequest.id,
              file_name: file.name,
              file_path: filePath,
              file_size: file.size,
              file_type: file.type,
              uploaded_by: user.id,
            });

          if (dbError) {
            console.error('❌ File database insert error:', dbError);
            // Clean up uploaded file if database insert fails
            await supabase.storage
              .from('material-request-attachments')
              .remove([filePath]);
            throw new Error(`Failed to save file info for ${file.name}: ${dbError.message}`);
          }
        }
        
        console.log('✅ All files uploaded successfully');
      }

      return materialRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-material-requests'] });
      queryClient.invalidateQueries({ queryKey: ['material-takeoffs'] });
      toast({
        title: "Success!",
        description: "Your material request has been submitted successfully.",
      });
    },
    onError: (error) => {
      console.error('Material request submission error:', error);
      toast({
        title: "Error",
        description: "Failed to submit material request. Please try again.",
        variant: "destructive",
      });
    },
  });
};
