import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface OptimisticMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  queryKey: (string | number | boolean)[];
  optimisticUpdate?: (old: any, variables: TVariables) => any;
  successMessage?: string;
  errorMessage?: string;
  invalidateQueries?: (string | number | boolean)[][];
}

export const useOptimisticMutation = <TData, TVariables>({
  mutationFn,
  queryKey,
  optimisticUpdate,
  successMessage,
  errorMessage,
  invalidateQueries = []
}: OptimisticMutationOptions<TData, TVariables>) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(queryKey);

      // Optimistically update cache
      if (optimisticUpdate) {
        queryClient.setQueryData(queryKey, (old: any) => 
          optimisticUpdate(old, variables)
        );
      }

      // Show optimistic success message immediately
      if (successMessage) {
        toast.success(successMessage, {
          duration: 2000,
        });
      }

      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback optimistic update
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }

      // Show error message
      toast.error(errorMessage || 'Something went wrong', {
        duration: 4000,
      });
    },
    onSuccess: () => {
      // Invalidate related queries to ensure consistency
      [queryKey, ...invalidateQueries].forEach(key => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
    onSettled: () => {
      // Always invalidate the main query
      queryClient.invalidateQueries({ queryKey });
    },
  });
};