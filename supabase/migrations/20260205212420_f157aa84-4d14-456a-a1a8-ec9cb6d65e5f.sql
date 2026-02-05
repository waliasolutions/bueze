-- Update can_submit_proposal function to use Swiss timezone (Europe/Zurich)
-- Resets quota on 1st of month at 00:00:00 Swiss time (DST-safe)
CREATE OR REPLACE FUNCTION public.can_submit_proposal(handwerker_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  sub_record RECORD;
  swiss_now TIMESTAMP WITH TIME ZONE;
  next_month_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get current time in Swiss timezone
  swiss_now := NOW() AT TIME ZONE 'Europe/Zurich';
  
  -- Calculate next month's 1st at 00:00:00 Swiss time
  next_month_start := date_trunc('month', swiss_now + INTERVAL '1 month') AT TIME ZONE 'Europe/Zurich';
  
  -- Get or create subscription record
  SELECT * INTO sub_record
  FROM handwerker_subscriptions
  WHERE user_id = handwerker_user_id;
  
  -- If no subscription exists, create free tier with period ending at next month start
  IF NOT FOUND THEN
    INSERT INTO handwerker_subscriptions (
      user_id, 
      plan_type, 
      proposals_limit,
      current_period_start,
      current_period_end
    )
    VALUES (
      handwerker_user_id, 
      'free', 
      5,
      date_trunc('month', swiss_now) AT TIME ZONE 'Europe/Zurich',
      next_month_start
    )
    RETURNING * INTO sub_record;
  END IF;
  
  -- Check if period has expired and reset if needed (DST-safe comparison)
  IF sub_record.current_period_end < NOW() THEN
    -- Reset to 1st of CURRENT month at 00:00 Swiss time
    UPDATE handwerker_subscriptions
    SET 
      proposals_used_this_period = 0,
      current_period_start = date_trunc('month', swiss_now) AT TIME ZONE 'Europe/Zurich',
      current_period_end = next_month_start
    WHERE user_id = handwerker_user_id;
    RETURN TRUE;
  END IF;
  
  -- Check if unlimited (-1) or under limit
  IF sub_record.proposals_limit = -1 THEN
    RETURN TRUE;
  END IF;
  
  RETURN sub_record.proposals_used_this_period < sub_record.proposals_limit;
END;
$function$;