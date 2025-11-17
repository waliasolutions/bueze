-- Create table to store site-wide SEO settings
CREATE TABLE public.site_seo_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  robots_txt text NOT NULL DEFAULT 'User-agent: *
Allow: /',
  sitemap_last_generated timestamptz,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.site_seo_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view site SEO settings"
  ON public.site_seo_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage site SEO settings"
  ON public.site_seo_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Insert default robots.txt
INSERT INTO public.site_seo_settings (robots_txt) VALUES (
'User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: *
Allow: /

Sitemap: https://bueeze.ch/sitemap.xml'
);