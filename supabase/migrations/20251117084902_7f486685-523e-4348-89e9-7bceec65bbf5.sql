-- Create page_content table for CMS
CREATE TABLE public.page_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key text UNIQUE NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('category', 'legal', 'homepage', 'faq')),
  fields jsonb NOT NULL DEFAULT '{}',
  seo jsonb DEFAULT '{
    "meta_title": "",
    "meta_description": "",
    "og_image": "",
    "canonical_url": "",
    "robots_meta": "index,follow"
  }',
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;

-- Anyone can view published content
CREATE POLICY "Anyone can view published content"
ON public.page_content
FOR SELECT
USING (status = 'published');

-- Admins can view all content
CREATE POLICY "Admins can view all content"
ON public.page_content
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can manage content
CREATE POLICY "Admins can manage content"
ON public.page_content
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX idx_page_content_page_key ON public.page_content(page_key);
CREATE INDEX idx_page_content_content_type ON public.page_content(content_type);
CREATE INDEX idx_page_content_status ON public.page_content(status);

-- Add trigger for updated_at
CREATE TRIGGER update_page_content_updated_at
  BEFORE UPDATE ON public.page_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial content from categoryContent.ts
INSERT INTO public.page_content (page_key, content_type, fields, seo) VALUES
('category_flooring', 'category', '{
  "formCategory": "bodenleger",
  "title": "Parkett & Boden – Ihr Fussboden in Expertenhand",
  "description": "Von der Verlegung über die Reparatur bis zur Pflege: Finden Sie qualifizierte Bodenleger aus Ihrer Region. Erhalten Sie kostenlos mehrere Offerten und vergleichen Sie in Ruhe.",
  "services": [
    {
      "icon": "Layers",
      "title": "Parkett & Laminat verlegen",
      "description": "Ob klassisches Eichenparkett oder pflegeleichtes Laminat – ein professionell verlegter Holzboden wertet jeden Raum auf. Unsere Bodenleger beraten Sie zu Material, Verlegemuster und Pflege, damit Ihr Fussboden lange schön bleibt."
    },
    {
      "icon": "Grid3x3",
      "title": "Bodenfliesen & Platten",
      "description": "Fliesen in Steinoptik, Betonoptik oder klassischem Design – moderne Bodenfliesen sind vielseitig und langlebig. Lassen Sie sich von erfahrenen Fliesenlegern beraten und profitieren Sie von sauberer, fachgerechter Verlegung."
    },
    {
      "icon": "Package",
      "title": "Flexible Bodenbeläge",
      "description": "Teppich sorgt für Wärme und Behaglichkeit, PVC und Linoleum überzeugen durch Pflegeleichtigkeit. Egal welcher Belag zu Ihrem Zuhause passt – finden Sie den richtigen Fachmann für eine reibungslose Umsetzung."
    }
  ],
  "faq": [
    {
      "question": "Wie lange dauert die Verlegung eines neuen Bodens?",
      "answer": "Das hängt von der Raumgrösse und dem Material ab. Parkett oder Laminat sind oft in 1-2 Tagen verlegt, während Fliesen mehr Zeit benötigen. Die Handwerker geben Ihnen in der Offerte eine genaue Zeitplanung."
    },
    {
      "question": "Kann ich meinen alten Boden selbst entfernen?",
      "answer": "Grundsätzlich ja, aber viele Bodenleger bieten die Entfernung des alten Belags als Teil ihrer Leistung an. Das spart Zeit und sorgt für einen sauberen Untergrund."
    },
    {
      "question": "Wie teuer ist ein neuer Fussboden?",
      "answer": "Die Kosten variieren je nach Material und Fläche. Laminat ist günstiger als Echtholzparkett, Fliesen liegen preislich dazwischen. Mit Büeze.ch erhalten Sie mehrere Offerten zum Vergleich – völlig kostenlos."
    }
  ]
}', '{
  "meta_title": "Parkett & Boden verlegen | Büeze.ch",
  "meta_description": "Finden Sie qualifizierte Bodenleger für Parkett, Laminat, Fliesen und mehr. Kostenlose Offerten aus Ihrer Region.",
  "og_image": "",
  "canonical_url": "https://bueeze.ch/kategorie/flooring",
  "robots_meta": "index,follow"
}'),

('homepage_hero', 'homepage', '{
  "title": "Finden Sie den besten Handwerker.",
  "titleHighlight": "Für jedes Projekt.",
  "subtitle": "Erhalten Sie kostenlos mehrere Offerten von zertifizierten Handwerkern aus Ihrer Region.",
  "ctaText": "Auftrag erstellen",
  "trustSignals": [
    "Über 100 geprüfte Betriebe",
    "Kostenlos & unverbindlich für Auftraggeber",
    "Geprüfte Fachbetriebe"
  ]
}', '{
  "meta_title": "Büeze.ch - Geprüfte Handwerker in der Schweiz finden",
  "meta_description": "Finden Sie qualifizierte Handwerker für Ihr Projekt. Kostenlose Offerten von geprüften Betrieben aus Ihrer Region.",
  "og_image": "",
  "canonical_url": "https://bueeze.ch",
  "robots_meta": "index,follow"
}'),

('legal_agb', 'legal', '{
  "title": "Allgemeine Geschäftsbedingungen (AGB)",
  "content": "..."
}', '{
  "meta_title": "AGB | Büeze.ch",
  "meta_description": "Allgemeine Geschäftsbedingungen der Büeze GmbH für die Nutzung der Handwerker-Vermittlungsplattform.",
  "robots_meta": "noindex,follow"
}'),

('legal_datenschutz', 'legal', '{
  "title": "Datenschutzerklärung",
  "content": "..."
}', '{
  "meta_title": "Datenschutz | Büeze.ch",
  "meta_description": "Datenschutzerklärung der Büeze GmbH - Informationen zur Datenerhebung und -verarbeitung.",
  "robots_meta": "noindex,follow"
}');