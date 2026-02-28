-- Fix proposal limit race condition: use SELECT ... FOR UPDATE to prevent
-- two concurrent proposals from both passing the limit check before the
-- AFTER INSERT trigger increments the counter.

CREATE OR REPLACE FUNCTION public.can_submit_proposal(handwerker_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  sub_record RECORD;
  swiss_now TIMESTAMP WITH TIME ZONE;
  new_period_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get current time in Swiss timezone (DST-safe)
  swiss_now := NOW() AT TIME ZONE 'Europe/Zurich';

  -- Lock the subscription row to prevent race conditions on concurrent submits
  SELECT * INTO sub_record
  FROM handwerker_subscriptions
  WHERE user_id = handwerker_user_id
  FOR UPDATE;

  -- If no subscription exists, create free tier with 30-day period from now
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
      swiss_now,
      swiss_now + INTERVAL '30 days'
    )
    RETURNING * INTO sub_record;
  END IF;

  -- Check if period has expired and reset if needed
  IF sub_record.current_period_end < NOW() THEN
    new_period_end := swiss_now + INTERVAL '30 days';

    UPDATE handwerker_subscriptions
    SET
      proposals_used_this_period = 0,
      current_period_start = swiss_now,
      current_period_end = new_period_end
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
