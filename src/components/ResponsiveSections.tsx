import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Section {
  id: string;
  label: string;
  icon: LucideIcon;
  content: React.ReactNode;
}

interface ResponsiveSectionsProps {
  /** Array of section definitions */
  sections: Section[];
  /** Default section to show (id) */
  defaultSection?: string;
  /** Optional class name for container */
  className?: string;
  /** Optional callback when section changes */
  onSectionChange?: (sectionId: string) => void;
}

/**
 * SSOT Responsive Sections Component
 * 
 * Renders content sections as:
 * - Tabs on desktop (side-by-side navigation)
 * - Accordion on mobile (collapsible sections)
 * 
 * This provides optimal UX for both device types.
 */
export const ResponsiveSections: React.FC<ResponsiveSectionsProps> = ({
  sections,
  defaultSection,
  className,
  onSectionChange,
}) => {
  const isMobile = useIsMobile();
  const defaultId = defaultSection || sections[0]?.id;
  
  // Track active section for both modes
  const [activeSection, setActiveSection] = React.useState<string>(defaultId);
  
  // For accordion, track which sections are open
  const [openSections, setOpenSections] = React.useState<string[]>([defaultId]);

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    onSectionChange?.(sectionId);
  };

  const handleAccordionChange = (values: string[]) => {
    setOpenSections(values);
    // Update active section to the last opened one
    if (values.length > 0) {
      handleSectionChange(values[values.length - 1]);
    }
  };

  if (isMobile) {
    // Mobile: Accordion layout
    return (
      <div className={cn("space-y-3", className)}>
        <Accordion 
          type="multiple" 
          value={openSections}
          onValueChange={handleAccordionChange}
          className="space-y-2"
        >
          {sections.map((section) => {
            const Icon = section.icon;
            
            return (
              <AccordionItem 
                key={section.id} 
                value={section.id}
                className="border rounded-lg bg-card overflow-hidden"
              >
                <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-semibold text-base">{section.label}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="pt-2">
                    {section.content}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    );
  }

  // Desktop: Tabs layout
  return (
    <Tabs 
      value={activeSection} 
      onValueChange={handleSectionChange}
      className={cn("space-y-6", className)}
    >
      <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${sections.length}, 1fr)` }}>
        {sections.map((section) => {
          const Icon = section.icon;
          
          return (
            <TabsTrigger 
              key={section.id} 
              value={section.id}
              className="flex items-center gap-2"
            >
              <Icon className="h-4 w-4" />
              <span className="hidden md:inline">{section.label}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>

      {sections.map((section) => (
        <TabsContent key={section.id} value={section.id} className="space-y-6">
          {section.content}
        </TabsContent>
      ))}
    </Tabs>
  );
};
