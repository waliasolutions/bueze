-- Fix: leads.accepted_proposal_id should SET NULL (not RESTRICT) on proposal deletion
-- so that deleting a handwerker's proposals does not block auth user deletion.
ALTER TABLE public.leads
  DROP CONSTRAINT IF EXISTS leads_accepted_proposal_id_fkey;

ALTER TABLE public.leads
  ADD CONSTRAINT leads_accepted_proposal_id_fkey
  FOREIGN KEY (accepted_proposal_id)
  REFERENCES public.lead_proposals(id)
  ON DELETE SET NULL;
