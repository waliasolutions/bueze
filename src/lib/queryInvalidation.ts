/**
 * Query Invalidation Utilities
 * Centralized cache invalidation for React Query
 */

import { QueryClient } from '@tanstack/react-query';

// Query keys - Single Source of Truth
export const QUERY_KEYS = {
  // Leads
  LEADS: 'leads',
  LEAD: (id: string) => ['lead', id] as const,
  USER_LEADS: (userId: string) => ['userLeads', userId] as const,
  ACTIVE_LEADS: 'activeLeads',
  
  // Proposals
  PROPOSALS: 'proposals',
  PROPOSAL: (id: string) => ['proposal', id] as const,
  LEAD_PROPOSALS: (leadId: string) => ['leadProposals', leadId] as const,
  USER_PROPOSALS: (userId: string) => ['userProposals', userId] as const,
  
  // Handwerker
  HANDWERKER_PROFILE: (userId: string) => ['handwerkerProfile', userId] as const,
  HANDWERKER_SUBSCRIPTION: (userId: string) => ['handwerkerSubscription', userId] as const,
  HANDWERKER_RATING: (userId: string) => ['handwerkerRating', userId] as const,
  
  // Messages & Conversations
  CONVERSATIONS: 'conversations',
  CONVERSATION: (id: string) => ['conversation', id] as const,
  MESSAGES: (conversationId: string) => ['messages', conversationId] as const,
  UNREAD_COUNT: (userId: string) => ['unreadCount', userId] as const,
  
  // Reviews
  REVIEWS: 'reviews',
  HANDWERKER_REVIEWS: (handwerkerId: string) => ['handwerkerReviews', handwerkerId] as const,
  
  // User
  USER_PROFILE: (userId: string) => ['userProfile', userId] as const,
  USER_ROLES: (userId: string) => ['userRoles', userId] as const,
  
  // Admin
  ADMIN_STATS: 'adminStats',
  PENDING_APPROVALS: 'pendingApprovals',
} as const;

/**
 * Invalidate queries after proposal mutation
 */
export async function invalidateProposalQueries(
  queryClient: QueryClient,
  proposalId?: string,
  leadId?: string,
  userId?: string
): Promise<void> {
  const invalidations: Promise<void>[] = [
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROPOSALS] }),
  ];

  if (proposalId) {
    invalidations.push(
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PROPOSAL(proposalId) })
    );
  }

  if (leadId) {
    invalidations.push(
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LEAD_PROPOSALS(leadId) }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LEAD(leadId) })
    );
  }

  if (userId) {
    invalidations.push(
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER_PROPOSALS(userId) })
    );
  }

  // Also invalidate leads as proposal count may have changed
  invalidations.push(
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEADS] }),
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACTIVE_LEADS] })
  );

  await Promise.all(invalidations);
}

/**
 * Invalidate queries after lead mutation
 */
export async function invalidateLeadQueries(
  queryClient: QueryClient,
  leadId?: string,
  userId?: string
): Promise<void> {
  const invalidations: Promise<void>[] = [
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEADS] }),
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ACTIVE_LEADS] }),
  ];

  if (leadId) {
    invalidations.push(
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LEAD(leadId) }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LEAD_PROPOSALS(leadId) })
    );
  }

  if (userId) {
    invalidations.push(
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER_LEADS(userId) })
    );
  }

  await Promise.all(invalidations);
}

/**
 * Invalidate queries after message mutation
 */
export async function invalidateMessageQueries(
  queryClient: QueryClient,
  conversationId?: string,
  userId?: string
): Promise<void> {
  const invalidations: Promise<void>[] = [
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CONVERSATIONS] }),
  ];

  if (conversationId) {
    invalidations.push(
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CONVERSATION(conversationId) }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MESSAGES(conversationId) })
    );
  }

  if (userId) {
    invalidations.push(
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.UNREAD_COUNT(userId) })
    );
  }

  await Promise.all(invalidations);
}

/**
 * Invalidate queries after review mutation
 */
export async function invalidateReviewQueries(
  queryClient: QueryClient,
  handwerkerId?: string
): Promise<void> {
  const invalidations: Promise<void>[] = [
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REVIEWS] }),
  ];

  if (handwerkerId) {
    invalidations.push(
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.HANDWERKER_REVIEWS(handwerkerId) }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.HANDWERKER_RATING(handwerkerId) })
    );
  }

  await Promise.all(invalidations);
}

/**
 * Invalidate queries after handwerker profile mutation
 */
export async function invalidateHandwerkerQueries(
  queryClient: QueryClient,
  userId?: string
): Promise<void> {
  const invalidations: Promise<void>[] = [];

  if (userId) {
    invalidations.push(
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.HANDWERKER_PROFILE(userId) }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.HANDWERKER_SUBSCRIPTION(userId) }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER_PROFILE(userId) })
    );
  }

  // Invalidate pending approvals for admin
  invalidations.push(
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PENDING_APPROVALS] })
  );

  await Promise.all(invalidations);
}

/**
 * Clear all cached queries (useful on logout)
 */
export function clearAllQueries(queryClient: QueryClient): void {
  queryClient.clear();
}

/**
 * Invalidate all user-specific queries on logout
 */
export async function invalidateUserQueries(
  queryClient: QueryClient,
  userId: string
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER_PROFILE(userId) }),
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER_ROLES(userId) }),
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER_LEADS(userId) }),
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER_PROPOSALS(userId) }),
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.HANDWERKER_PROFILE(userId) }),
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.HANDWERKER_SUBSCRIPTION(userId) }),
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.UNREAD_COUNT(userId) }),
  ]);
}
