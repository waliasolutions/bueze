-- Create function to increment purchased_count
CREATE OR REPLACE FUNCTION public.increment_lead_purchased_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.leads
  SET purchased_count = purchased_count + 1
  WHERE id = NEW.lead_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on lead_purchases
CREATE TRIGGER increment_purchased_count_on_purchase
  AFTER INSERT ON public.lead_purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_lead_purchased_count();