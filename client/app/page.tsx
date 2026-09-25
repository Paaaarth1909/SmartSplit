import React from 'react';
import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import HeroWidget from '@/components/landing/HeroWidget';
import FeaturesGrid from '@/components/landing/FeaturesGrid';
import OptimizationShowcase from '@/components/landing/OptimizationShowcase';
import Footer from '@/components/landing/Footer';
import DotGrid from '@/components/DotGrid';

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-sans overflow-x-hidden selection:bg-white/20 relative">
      {/* Background DotGrid pattern */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <DotGrid
          dotSize={2}
          gap={16}
          baseColor="#27ff9a"
          activeColor="#27ff9a"
          proximity={120}
          shockRadius={250}
          shockStrength={5}
          resistance={750}
          returnDuration={1.5}
        />
      </div>

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

