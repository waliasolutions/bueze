/**
 * React Query mutations for lead status operations with optimistic updates.
 * Provides instant UI feedback while the server processes the request.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateLeadStatus, LeadUpdateResult } from '@/lib/leadHelpers';
import { invalidateLeadQueries } from '@/lib/queryInvalidation';
import { LeadStatusType } from '@/config/leadStatuses';

interface LeadStatusMutationArgs {
  leadId: string;
  userId: string;
  newStatus: LeadStatusType;
}

interface UseLeadMutationsOptions {
  /** Called on successful status change with the result message */
  onSuccess?: (message: string) => void;
  /** Called on error with the error message */
  onError?: (message: string) => void;
}

export function useUpdateLeadStatus(options?: UseLeadMutationsOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leadId, userId, newStatus }: LeadStatusMutationArgs) =>
      updateLeadStatus(leadId, userId, newStatus),
    onSuccess: async (result: LeadUpdateResult, { leadId, userId }) => {
      if (result.success) {
        await invalidateLeadQueries(queryClient, leadId, userId);
        options?.onSuccess?.(result.message);
      } else {
        options?.onError?.(result.message);
      }
    },
    onError: (error: Error) => {
      options?.onError?.(error.message || 'Status konnte nicht aktualisiert werden');
    },
  });
}
