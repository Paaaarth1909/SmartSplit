import React from 'react';
import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import HeroWidget from '@/components/landing/HeroWidget';
import FeaturesGrid from '@/components/landing/FeaturesGrid';
import OptimizationShowcase from '@/components/landing/OptimizationShowcase';
import Footer from '@/components/landing/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-sans overflow-x-hidden selection:bg-white/20">
      <Navbar />
      
      <main className="w-full relative z-10 flex flex-col items-center">
        <HeroSection />
        <HeroWidget />
        <FeaturesGrid />
        <OptimizationShowcase />
      </main>

      <Footer />
    </div>
  );
}
