/**
 * React Query mutations for proposal operations with optimistic updates.
 * Provides instant UI feedback while the server processes the request.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { acceptProposal, rejectProposal } from '@/lib/proposalHelpers';
import { invalidateProposalQueries } from '@/lib/queryInvalidation';

interface UseProposalMutationsOptions {
  /** Called on successful accept with the result message */
  onAcceptSuccess?: (message: string) => void;
  /** Called on accept error with the error message */
  onAcceptError?: (message: string) => void;
  /** Called on successful reject with the result message */
  onRejectSuccess?: (message: string) => void;
  /** Called on reject error with the error message */
  onRejectError?: (message: string) => void;
}

export function useAcceptProposal(options?: UseProposalMutationsOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (proposalId: string) => acceptProposal(proposalId),
    onSuccess: async (result, proposalId) => {
      if (result.success) {
        await invalidateProposalQueries(queryClient, proposalId);
        options?.onAcceptSuccess?.(result.message);
      } else {
        options?.onAcceptError?.(result.message);
      }
    },
    onError: (error: Error) => {
      options?.onAcceptError?.(error.message || 'Offerte konnte nicht angenommen werden');
    },
  });
}

export function useRejectProposal(options?: UseProposalMutationsOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (proposalId: string) => rejectProposal(proposalId),
    onSuccess: async (result, proposalId) => {
      if (result.success) {
        await invalidateProposalQueries(queryClient, proposalId);
        options?.onRejectSuccess?.(result.message);
      } else {
        options?.onRejectError?.(result.message);
      }
    },
    onError: (error: Error) => {
      options?.onRejectError?.(error.message || 'Offerte konnte nicht abgelehnt werden');
    },
  });
}
