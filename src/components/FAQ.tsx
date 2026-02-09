import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { faqDefaults } from '@/config/contentDefaults';

// Keep exported for schema generation in Index.tsx
export const faqData = faqDefaults.categories;

interface FAQProps {
  content?: { fields?: any } | null;
}

export const FAQ = ({ content }: FAQProps) => {
  const fields = content?.fields;
  const title = fields?.title || faqDefaults.title;
  const subtitle = fields?.subtitle || faqDefaults.subtitle;
  const categories = fields?.categories?.length ? fields.categories : faqDefaults.categories;

  return (
    <section className="py-20 bg-pastel-blue-50">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-ink-900 mb-4">
          {title}
        </h2>
        <p className="text-xl text-ink-700">
          {subtitle}
        </p>
      </div>

      <div className="container mx-auto px-4 max-w-4xl">
        {categories.map((category: any, idx: number) => (
          <div key={idx} className="mb-12 last:mb-0">
            <h3 className="text-2xl font-bold text-ink-900 mb-6">
              {category.category}
            </h3>
            <Accordion type="single" collapsible className="space-y-4">
              {category.questions?.map((item: any, qIdx: number) => (
                <AccordionItem
                  key={qIdx}
                  value={`item-${idx}-${qIdx}`}
                  className="bg-white rounded-lg shadow-sm border border-border px-6"
                >
                  <AccordionTrigger className="text-left font-semibold text-ink-900 hover:text-brand-600 py-5">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-ink-700 leading-relaxed pb-5">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </div>
    </section>
  );
};
