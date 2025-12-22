-- Fix trigger to fire on both INSERT and UPDATE
DROP TRIGGER IF EXISTS on_lead_active_send_notification ON public.leads;

CREATE TRIGGER on_lead_active_send_notification 
  BEFORE INSERT OR UPDATE ON public.leads 
  FOR EACH ROW 
  EXECUTE FUNCTION trigger_send_lead_notification();