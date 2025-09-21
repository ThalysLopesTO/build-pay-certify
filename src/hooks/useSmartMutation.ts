import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getRelatedQueryKeys } from '@/lib/queryKeyFactory';

interface SmartMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  queryKey: readonly string[];
  optimisticUpdate?: (old: any, variables: TVariables) => any;
  successMessage?: string;
  errorMessage?: string;
  // More granular invalidation instead of broad sweeps
  invalidateQueries?: readonly string[][];
  // Option to skip invalidation if using optimistic updates correctly
  skipInvalidation?: boolean;
  // Custom success handler for complex updates
  onSuccessUpdate?: (data: TData, queryClient: ReturnType<typeof useQueryClient>) => Promise<void>;
}

export const useSmartMutation = <TData, TVariables>({
  mutationFn,
  queryKey,
  optimisticUpdate,
  successMessage,
  errorMessage,
  invalidateQueries = [],
  skipInvalidation = false,
  onSuccessUpdate,
}: SmartMutationOptions<TData, TVariables>) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    
    onMutate: async (variables) => {
      // Cancel any outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(queryKey);

      // Optimistically update the cache if function provided
      if (optimisticUpdate) {
        queryClient.setQueryData(queryKey, (old: any) => 
          optimisticUpdate(old, variables)
        );
      }

      return { previousData };
    },
    
    onError: (error, variables, context) => {
      // Rollback optimistic update on error
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(queryKey, context.previousData);
      }

      // Show error message
      const message = errorMessage || 'Something went wrong. Please try again.';
      toast.error(message, {
        duration: 4000,
      });
    },
    
    onSuccess: async (data, variables) => {
      // Show success message immediately
      if (successMessage) {
        toast.success(successMessage, {
          duration: 2000,
        });
      }

      // Handle custom success updates
      if (onSuccessUpdate) {
        await onSuccessUpdate(data, queryClient);
        return;
      }

      // Skip invalidation if explicitly requested (for optimistic updates that are accurate)
      if (skipInvalidation) {
        return;
      }

      // Smart invalidation: only invalidate what's necessary
      const queriesToInvalidate = invalidateQueries.length > 0 
        ? invalidateQueries 
        : getRelatedQueryKeys(queryKey);

      // Batch invalidations for efficiency
      await Promise.all(
        queriesToInvalidate.map(key => 
          queryClient.invalidateQueries({ queryKey: key })
        )
      );
    },
    
    onSettled: () => {
      // Only refetch the specific query if no optimistic update was used
      if (!optimisticUpdate && !skipInvalidation) {
        queryClient.invalidateQueries({ queryKey });
      }
    },
  });
};