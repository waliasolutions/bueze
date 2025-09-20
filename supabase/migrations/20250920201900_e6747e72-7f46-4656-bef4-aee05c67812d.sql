-- Create conversations table for organizing messages
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  homeowner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  handwerker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_message_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(lead_id, homeowner_id, handwerker_id)
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Create policies for conversations
CREATE POLICY "Users can view their own conversations" 
ON public.conversations 
FOR SELECT 
USING (auth.uid() = homeowner_id OR auth.uid() = handwerker_id);

CREATE POLICY "Users can create conversations for purchased leads" 
ON public.conversations 
FOR INSERT 
WITH CHECK (
  auth.uid() = handwerker_id 
  AND EXISTS (
    SELECT 1 FROM public.lead_purchases 
    WHERE lead_id = conversations.lead_id 
    AND buyer_id = auth.uid()
  )
);

-- Update messages table to reference conversations
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_lead_id_fkey;
ALTER TABLE public.messages ADD COLUMN conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE;

-- Update messages RLS policies
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages they sent or received" ON public.messages;

CREATE POLICY "Users can send messages in their conversations" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id 
  AND conversation_id IN (
    SELECT id FROM public.conversations 
    WHERE homeowner_id = auth.uid() OR handwerker_id = auth.uid()
  )
);

CREATE POLICY "Users can view messages in their conversations" 
ON public.messages 
FOR SELECT 
USING (
  conversation_id IN (
    SELECT id FROM public.conversations 
    WHERE homeowner_id = auth.uid() OR handwerker_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own messages" 
ON public.messages 
FOR UPDATE 
USING (auth.uid() = sender_id);

-- Create function to update conversation timestamp
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations 
  SET 
    updated_at = now(),
    last_message_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic conversation timestamp updates
CREATE TRIGGER update_conversation_timestamp
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_timestamp();

-- Add some sample leads and users for testing
INSERT INTO public.profiles (id, email, full_name, role) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'hans.mueller@email.ch', 'Hans Müller', 'homeowner'),
  ('00000000-0000-0000-0000-000000000002', 'maria.weber@email.ch', 'Maria Weber', 'handwerker'),
  ('00000000-0000-0000-0000-000000000003', 'peter.schmid@email.ch', 'Peter Schmid', 'handwerker'),
  ('00000000-0000-0000-0000-000000000004', 'anna.fischer@email.ch', 'Anna Fischer', 'homeowner')
ON CONFLICT (id) DO NOTHING;

-- Add sample leads
INSERT INTO public.leads (
  id, owner_id, title, description, category, budget_min, budget_max, 
  urgency, canton, zip, city, status
) VALUES 
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Badezimmer komplett sanieren',
    'Unser Badezimmer (8m²) ist 30 Jahre alt und braucht eine komplette Sanierung. Wir möchten moderne Fliesen, eine neue Dusche, WC und Waschbecken. Die Elektrik sollte auch erneuert werden.',
    'plumbing',
    8000,
    15000,
    'flexible',
    'ZH',
    '8001',
    'Zürich',
    'active'
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000004',
    'Küche neu streichen',
    'Unsere Küche (15m²) benötigt einen neuen Anstrich. Die Wände sind momentan weiss, wir möchten sie in einem warmen Beige. Decke auch streichen.',
    'painting',
    800,
    1500,
    'soon',
    'BE',
    '3001',
    'Bern',
    'active'
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'Parkett verlegen im Wohnzimmer',
    'Wir möchten in unserem Wohnzimmer (25m²) hochwertiges Eichen-Parkett verlegen lassen. Der alte Teppichboden muss entfernt werden.',
    'flooring',
    3000,
    6000,
    'planning',
    'ZH',
    '8001',
    'Zürich',
    'active'
  )
ON CONFLICT (id) DO NOTHING;

-- Add handwerker profiles
INSERT INTO public.handwerker_profiles (
  id, user_id, categories, hourly_rate_min, hourly_rate_max, 
  service_areas, bio, languages, is_verified
) VALUES 
  (
    '20000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    ARRAY['plumbing', 'heating']::handwerker_category[],
    80,
    120,
    ARRAY['Zürich', 'Winterthur', 'Uster'],
    'Erfahrener Sanitärinstallateur mit 15 Jahren Berufserfahrung. Spezialisiert auf Badsanierungen und Heizungsinstallationen.',
    ARRAY['de', 'en'],
    true
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    ARRAY['painting', 'flooring']::handwerker_category[],
    60,
    90,
    ARRAY['Bern', 'Thun', 'Köniz'],
    'Maler und Bodenleger mit Leidenschaft für hochwertige Arbeit. Über 200 zufriedene Kunden in der Region Bern.',
    ARRAY['de', 'fr'],
    true
  )
ON CONFLICT (id) DO NOTHING;