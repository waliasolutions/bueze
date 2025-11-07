-- Create approval history table
CREATE TABLE public.handwerker_approval_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handwerker_profile_id UUID NOT NULL REFERENCES public.handwerker_profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected')),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  admin_email TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_approval_history_handwerker ON public.handwerker_approval_history(handwerker_profile_id);
CREATE INDEX idx_approval_history_admin ON public.handwerker_approval_history(admin_id);

-- Enable RLS
ALTER TABLE public.handwerker_approval_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for approval history
CREATE POLICY "Admins can view approval history"
  ON public.handwerker_approval_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "System can insert approval history"
  ON public.handwerker_approval_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Create admin notifications table
CREATE TABLE public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id UUID,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index for faster queries
CREATE INDEX idx_admin_notifications_created ON public.admin_notifications(created_at DESC);
CREATE INDEX idx_admin_notifications_read ON public.admin_notifications(read) WHERE read = false;

-- Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Admins can view notifications"
  ON public.admin_notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update notifications"
  ON public.admin_notifications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "System can insert notifications"
  ON public.admin_notifications
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Create function to notify admins of new registrations
CREATE OR REPLACE FUNCTION public.notify_admins_of_new_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only trigger for new pending registrations (not updates)
  IF NEW.verification_status = 'pending' AND OLD IS NULL THEN
    INSERT INTO public.admin_notifications (type, title, message, related_id, metadata)
    VALUES (
      'new_handwerker_registration',
      'Neue Handwerker-Registrierung',
      NEW.first_name || ' ' || NEW.last_name || ' (' || COALESCE(NEW.company_name, 'Keine Firma') || ') wartet auf Freigabe',
      NEW.id,
      jsonb_build_object(
        'handwerker_name', NEW.first_name || ' ' || NEW.last_name,
        'company_name', NEW.company_name,
        'email', NEW.email
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for new registrations
DROP TRIGGER IF EXISTS trigger_notify_admins_registration ON public.handwerker_profiles;
CREATE TRIGGER trigger_notify_admins_registration
  AFTER INSERT ON public.handwerker_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_of_new_registration();