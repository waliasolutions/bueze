/**
 * Shared handwerker-profile lookup (SSOT).
 *
 * Header dropdown, status indicator and any other consumer must read the
 * handwerker profile through this hook so the lookup happens once per user and
 * is served from the React Query cache afterwards, instead of one request per
 * mounting component.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { HANDWERKER_PROFILE_SELECT } from '@/lib/querySelects';
import type { HandwerkerProfile } from '@/types/entities';

export const handwerkerProfileQueryKey = (userId?: string | null) =>
  ['handwerker-profile', userId ?? 'anonymous'] as const;

export function useHandwerkerProfile(userId?: string | null) {
  const query = useQuery({
    queryKey: handwerkerProfileQueryKey(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<HandwerkerProfile | null> => {
      const { data, error } = await supabase
        .from('handwerker_profiles')
        .select(HANDWERKER_PROFILE_SELECT)
        .eq('user_id', userId!)
        .maybeSingle();

      if (error) throw error;
      return (data as unknown as HandwerkerProfile) ?? null;
    },
  });

  const profile = query.data ?? null;

  return {
    profile,
    /** Profile exists and is in a state that grants dashboard access */
    hasActiveProfile:
      !!profile && ['pending', 'approved'].includes(profile.verification_status || ''),
    isApproved: profile?.verification_status === 'approved' && !!profile?.is_verified,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
