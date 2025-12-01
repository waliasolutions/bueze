-- Create test data for email notifications to info@walia-solutions.ch
-- Using existing approved handwerker Peter Müller (user_id: 4d5b0b6e-7df0-4f08-b986-48f9655364c3)

-- 1. Create lead owned by info@walia-solutions.ch (triggers send-lead-notification)
DO $$
DECLARE
  new_lead_id uuid := gen_random_uuid();
  new_proposal_id uuid := gen_random_uuid();
BEGIN
  -- Insert lead
  INSERT INTO public.leads (
    id,
    owner_id,
    title,
    description,
    category,
    city,
    zip,
    canton,
    urgency,
    budget_type,
    budget_min,
    budget_max,
    status
  ) VALUES (
    new_lead_id,
    '05568197-d59f-4eda-827f-46ff1be1de2c',
    'Küche komplett renovieren',
    'Email-Demo: Wir möchten unsere alte Küche komplett erneuern. Alle Arbeiten inkl. Elektro, Wasser, Möbelmontage.',
    'kueche',
    'Zürich',
    '8001',
    'ZH',
    'this_month',
    'estimate',
    15000,
    25000,
    'active'
  );

  -- 2. Create proposal from Peter Müller (triggers send-proposal-notification)
  INSERT INTO public.lead_proposals (
    id,
    lead_id,
    handwerker_id,
    message,
    price_min,
    price_max,
    estimated_duration_days,
    status
  ) VALUES (
    new_proposal_id,
    new_lead_id,
    '4d5b0b6e-7df0-4f08-b986-48f9655364c3',
    'Guten Tag, vielen Dank für Ihre Anfrage. Wir sind spezialisiert auf Küchenrenovationen und können Ihnen ein komplettes Angebot machen. Alle Arbeiten aus einer Hand - Elektro, Sanitär, Möbelmontage. Gerne besichtigen wir das Objekt für eine genaue Offerte.',
    18000,
    22000,
    14,
    'pending'
  );

  -- Wait a moment to allow proposal notification to be sent
  PERFORM pg_sleep(2);

  -- 3. Accept the proposal (triggers send-acceptance-emails)
  UPDATE public.lead_proposals
  SET status = 'accepted'::proposal_status,
      responded_at = now()
  WHERE id = new_proposal_id;

  UPDATE public.leads
  SET accepted_proposal_id = new_proposal_id
  WHERE id = new_lead_id;
END $$;