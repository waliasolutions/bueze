-- Create handwerker_notifications table for proper SSOT
CREATE TABLE public.handwerker_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  related_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.handwerker_notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.handwerker_notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.handwerker_notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- System can insert notifications
CREATE POLICY "System can insert notifications"
ON public.handwerker_notifications
FOR INSERT
WITH CHECK (true);

-- Add index for faster queries
CREATE INDEX idx_handwerker_notifications_user_id ON public.handwerker_notifications(user_id);
CREATE INDEX idx_handwerker_notifications_read ON public.handwerker_notifications(user_id, read);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.handwerker_notifications;