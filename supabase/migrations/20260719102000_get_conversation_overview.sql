
-- Conversation list overview: latest message + unread count per conversation
-- in ONE query. Replaces the frontend pattern of downloading every message of
-- every conversation just to pick the newest one client-side.
--
-- SECURITY INVOKER (default): messages RLS still applies, so callers can only
-- read overviews of conversations they participate in.
CREATE OR REPLACE FUNCTION public.get_conversation_overview(p_conversation_ids uuid[])
RETURNS TABLE (
  conversation_id uuid,
  latest_content text,
  latest_created_at timestamptz,
  latest_sender_id uuid,
  unread_count bigint
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    m.conversation_id,
    m.content,
    m.created_at,
    m.sender_id,
    (
      SELECT count(*)
      FROM public.messages u
      WHERE u.conversation_id = m.conversation_id
        AND u.recipient_id = (SELECT auth.uid())
        AND u.read_at IS NULL
    ) AS unread_count
  FROM (
    SELECT DISTINCT ON (conversation_id) conversation_id, content, created_at, sender_id
    FROM public.messages
    WHERE conversation_id = ANY (p_conversation_ids)
    ORDER BY conversation_id, created_at DESC
  ) m;
$$;

GRANT EXECUTE ON FUNCTION public.get_conversation_overview(uuid[]) TO authenticated;

-- Support the DISTINCT ON latest-message scan and the unread-count filter.
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON public.messages (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread_by_recipient
  ON public.messages (conversation_id, recipient_id)
  WHERE read_at IS NULL;
