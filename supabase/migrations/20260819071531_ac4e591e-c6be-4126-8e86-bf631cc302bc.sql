CREATE INDEX IF NOT EXISTS idx_handwerker_profiles_user_id ON public.handwerker_profiles USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages USING btree (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_homeowner_id ON public.conversations USING btree (homeowner_id);
CREATE INDEX IF NOT EXISTS idx_conversations_handwerker_id ON public.conversations USING btree (handwerker_id);
ANALYZE public.handwerker_profiles;
ANALYZE public.messages;
ANALYZE public.conversations;