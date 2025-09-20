-- Create custom types for the Swiss craftsman marketplace
CREATE TYPE public.user_role AS ENUM ('homeowner', 'handwerker', 'admin');
CREATE TYPE public.canton AS ENUM ('AG', 'AI', 'AR', 'BE', 'BL', 'BS', 'FR', 'GE', 'GL', 'GR', 'JU', 'LU', 'NE', 'NW', 'OW', 'SG', 'SH', 'SO', 'SZ', 'TG', 'TI', 'UR', 'VD', 'VS', 'ZG', 'ZH');
CREATE TYPE public.handwerker_category AS ENUM (
  'elektriker', 'sanitaer', 'heizung', 'klimatechnik', 'maler', 'gipser', 
  'bodenleger', 'plattenleger', 'schreiner', 'maurer', 'zimmermann', 
  'dachdecker', 'fassadenbauer', 'gartenbau', 'pflasterarbeiten', 
  'zaun_torbau', 'fenster_tueren', 'kuechenbau', 'badumbau', 'umzug', 
  'reinigung', 'schlosserei', 'spengler'
);
CREATE TYPE public.lead_status AS ENUM ('draft', 'active', 'closed', 'cancelled');
CREATE TYPE public.urgency_level AS ENUM ('today', 'this_week', 'this_month', 'planning');
CREATE TYPE public.budget_type AS ENUM ('fixed', 'hourly', 'estimate');
CREATE TYPE public.subscription_plan AS ENUM ('starter', 'professional', 'enterprise');

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'homeowner',
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  company_name TEXT,
  address TEXT,
  zip TEXT,
  city TEXT,
  canton public.canton,
  languages TEXT[] DEFAULT ARRAY['de'],
  verified_level INTEGER DEFAULT 0,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  category public.handwerker_category NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  budget_min INTEGER,
  budget_max INTEGER,
  budget_type public.budget_type NOT NULL DEFAULT 'estimate',
  urgency public.urgency_level NOT NULL DEFAULT 'planning',
  zip TEXT NOT NULL,
  city TEXT NOT NULL,
  canton public.canton NOT NULL,
  address TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  media_urls TEXT[] DEFAULT '{}',
  status public.lead_status NOT NULL DEFAULT 'draft',
  purchased_count INTEGER DEFAULT 0,
  max_purchases INTEGER DEFAULT 4,
  quality_score INTEGER DEFAULT 50,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create handwerker profiles for service providers
CREATE TABLE public.handwerker_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  categories public.handwerker_category[] NOT NULL DEFAULT '{}',
  service_areas TEXT[] NOT NULL DEFAULT '{}', -- ZIP codes or cantons
  hourly_rate_min INTEGER,
  hourly_rate_max INTEGER,
  business_license TEXT,
  insurance_valid_until DATE,
  languages TEXT[] DEFAULT ARRAY['de'],
  bio TEXT,
  website TEXT,
  portfolio_urls TEXT[] DEFAULT '{}',
  response_time_hours INTEGER DEFAULT 24,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_documents TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lead purchases table
CREATE TABLE public.lead_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  price INTEGER NOT NULL, -- Price in cents (CHF)
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  contacted_at TIMESTAMP WITH TIME ZONE,
  quote_submitted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(lead_id, buyer_id)
);

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  plan public.subscription_plan NOT NULL DEFAULT 'starter',
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  included_leads INTEGER NOT NULL DEFAULT 10,
  used_leads INTEGER DEFAULT 0,
  extra_lead_price INTEGER NOT NULL DEFAULT 2000, -- Price in cents
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  reviewed_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(lead_id, reviewer_id, reviewed_id)
);

-- Create messages table for communication
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  attachments TEXT[] DEFAULT '{}',
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handwerker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Public handwerker profiles viewable" ON public.profiles
  FOR SELECT USING (role = 'handwerker');

-- Create RLS policies for leads
CREATE POLICY "Anyone can view active leads" ON public.leads
  FOR SELECT USING (status = 'active');

CREATE POLICY "Lead owners can manage own leads" ON public.leads
  FOR ALL USING (auth.uid() = owner_id);

-- Create RLS policies for handwerker profiles
CREATE POLICY "Handwerkers can manage own profile" ON public.handwerker_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view verified handwerker profiles" ON public.handwerker_profiles
  FOR SELECT USING (is_verified = TRUE);

-- Create RLS policies for lead purchases
CREATE POLICY "Buyers can view own purchases" ON public.lead_purchases
  FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Lead owners can view purchases of their leads" ON public.lead_purchases
  FOR SELECT USING (auth.uid() IN (SELECT owner_id FROM public.leads WHERE id = lead_id));

CREATE POLICY "Handwerkers can purchase leads" ON public.lead_purchases
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Create RLS policies for subscriptions
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for reviews
CREATE POLICY "Anyone can view public reviews" ON public.reviews
  FOR SELECT USING (is_public = TRUE);

CREATE POLICY "Users can create reviews for completed work" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Create RLS policies for messages
CREATE POLICY "Users can view messages they sent or received" ON public.messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Create indexes for better performance
CREATE INDEX idx_leads_category ON public.leads(category);
CREATE INDEX idx_leads_canton ON public.leads(canton);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX idx_handwerker_categories ON public.handwerker_profiles USING GIN(categories);
CREATE INDEX idx_handwerker_service_areas ON public.handwerker_profiles USING GIN(service_areas);
CREATE INDEX idx_lead_purchases_lead_id ON public.lead_purchases(lead_id);
CREATE INDEX idx_messages_lead_id ON public.messages(lead_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_handwerker_profiles_updated_at
  BEFORE UPDATE ON public.handwerker_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'homeowner')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();