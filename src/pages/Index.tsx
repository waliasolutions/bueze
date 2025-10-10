import React from 'react';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { HowItWorks } from '@/components/HowItWorks';
import { Categories } from '@/components/Categories';
import { Footer } from '@/components/Footer';

const Index = () => {

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        <Hero />
        <HowItWorks />
        <Categories />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
