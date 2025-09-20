import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { HowItWorks } from '@/components/HowItWorks';
import { Categories } from '@/components/Categories';
import { Testimonials } from '@/components/Testimonials';
import { Footer } from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { populateTestData } from '@/utils/testData';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const [isPopulating, setIsPopulating] = useState(false);

  useEffect(() => {
    const checkAndPopulateData = async () => {
      try {
        // Check if handwerker profiles exist
        const { data: profiles, error } = await supabase
          .from('handwerker_profiles')
          .select('id')
          .limit(1);

        if (error) {
          console.error('Error checking for existing data:', error);
          return;
        }

        // If no profiles exist, populate test data
        if (!profiles || profiles.length === 0) {
          setIsPopulating(true);
          toast({
            title: "Setting up test data",
            description: "Populating the database with sample leads and handwerkers...",
          });

          await populateTestData();
          
          toast({
            title: "Test data ready",
            description: "The search functionality is now ready to use!",
          });
        }
      } catch (error) {
        console.error('Error during auto-population:', error);
        toast({
          title: "Setup failed",
          description: "Failed to populate test data. Please try the search anyway.",
          variant: "destructive",
        });
      } finally {
        setIsPopulating(false);
      }
    };

    checkAndPopulateData();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        <Hero />
        <HowItWorks />
        <Categories />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
