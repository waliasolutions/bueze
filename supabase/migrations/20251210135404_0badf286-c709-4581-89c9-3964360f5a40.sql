-- Create client_notifications table for in-app notifications
CREATE TABLE public.client_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  related_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.client_notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON public.client_notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON public.client_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- System can insert notifications
CREATE POLICY "System can insert notifications" ON public.client_notifications
  FOR INSERT WITH CHECK (true);

-- Index for faster queries
CREATE INDEX idx_client_notifications_user_id ON public.client_notifications(user_id);
CREATE INDEX idx_client_notifications_read ON public.client_notifications(user_id, read);