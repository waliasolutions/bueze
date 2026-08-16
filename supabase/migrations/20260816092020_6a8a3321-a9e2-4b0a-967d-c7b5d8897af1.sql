-- Public logo access must exclude the not-yet-reviewed 'pending' folder.
DROP POLICY IF EXISTS "Anyone can view handwerker logos" ON storage.objects;

CREATE POLICY "Anyone can view approved handwerker logos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'handwerker-documents'
  AND (storage.foldername(name))[1] = 'logos'
  AND coalesce((storage.foldername(name))[2], '') <> 'pending'
);

-- Message edits must not be able to reroute or reattribute a message.
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;

CREATE POLICY "Users can update their own messages"
ON public.messages
FOR UPDATE
TO authenticated
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);

CREATE OR REPLACE FUNCTION public.prevent_message_rerouting()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.sender_id IS DISTINCT FROM OLD.sender_id
     OR NEW.recipient_id IS DISTINCT FROM OLD.recipient_id
     OR NEW.conversation_id IS DISTINCT FROM OLD.conversation_id
     OR NEW.lead_id IS DISTINCT FROM OLD.lead_id THEN
    RAISE EXCEPTION 'Nachrichten-Zuordnung kann nicht geändert werden';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_message_rerouting ON public.messages;
CREATE TRIGGER trg_prevent_message_rerouting
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.prevent_message_rerouting();