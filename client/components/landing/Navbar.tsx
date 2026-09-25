"use client";

import React, { useState, useEffect } from 'react';
import { motion, useScroll, useMotionValueEvent, useTransform } from 'framer-motion';

import Link from 'next/link';
import { LiquidButton } from '../ui/button';
import { Frame } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 50) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
  });

  const userInitial = user?.fullName
    ? user.fullName.charAt(0).toUpperCase()
    : "U";

  return (
    <>
      <motion.nav 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 rounded-full transition-all duration-500 ease-in-out ${
          isScrolled ? "w-[75%] max-w-4xl py-2" : "w-[90%] max-w-5xl py-3"
        }`}
      >
        {/* Background Glass Layers */}
        <div className="absolute top-0 left-0 z-0 h-full w-full rounded-full 
            shadow-[0_0_6px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3px_rgba(0,0,0,0.9),inset_-3px_-3px_0.5px_-3px_rgba(0,0,0,0.85),inset_1px_1px_1px_-0.5px_rgba(0,0,0,0.6),inset_-1px_-1px_1px_-0.5px_rgba(0,0,0,0.6),inset_0_0_6px_6px_rgba(0,0,0,0.12),inset_0_0_2px_2px_rgba(0,0,0,0.06),0_0_12px_rgba(255,255,255,0.15)] 
        transition-all 
        dark:shadow-[0_0_8px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3.5px_rgba(255,255,255,0.09),inset_-3px_-3px_0.5px_-3.5px_rgba(255,255,255,0.85),inset_1px_1px_1px_-0.5px_rgba(255,255,255,0.6),inset_-1px_-1px_1px_-0.5px_rgba(255,255,255,0.6),inset_0_0_6px_6px_rgba(255,255,255,0.12),inset_0_0_2px_2px_rgba(255,255,255,0.06),0_0_12px_rgba(0,0,0,0.15)] bg-black/40" />
        
        <div
          className="absolute top-0 left-0 isolate -z-10 h-full w-full overflow-hidden rounded-full"
          style={{ backdropFilter: 'url("#container-glass")' }}
        />

        {/* Content */}
        <div className={`relative z-10 w-full flex items-center justify-between transition-all duration-500 ${isScrolled ? 'px-4' : 'px-6'}`}>
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <Frame className="w-5 h-5 text-white" />
            <span className="text-lg font-bold tracking-tight text-white">SmartSplit <span className="text-[#b2f5d1]">Pro</span></span>
          </Link>

          <div className={`hidden md:flex items-center text-sm font-medium text-white/60 transition-all duration-500 ${isScrolled ? 'gap-6 text-xs' : 'gap-8 text-sm'}`}>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#ocr" className="hover:text-white transition-colors">AI Receipt OCR</a>
            <a href="#algorithm" className="hover:text-white transition-colors">Debt Algorithm</a>
            <a href="#integrations" className="hover:text-white transition-colors">Integrations</a>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard">
                  <LiquidButton className={`text-white bg-white/10 ${isScrolled ? 'h-8 px-4 text-xs' : ''}`} variant="default" size="default">
                    Dashboard
                  </LiquidButton>
                </Link>
                <Link href="/dashboard/profile">
                  <div className={`rounded-full bg-[#27ff9a] text-black font-bold text-xs flex items-center justify-center cursor-pointer shadow-[0_0_10px_rgba(39,255,154,0.3)] ${isScrolled ? "w-7 h-7" : "w-8 h-8"}`}>
                    {userInitial}
                  </div>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="text-xs md:text-sm font-medium text-white/70 hover:text-white transition-colors px-3 py-1.5">
                  Sign In
                </Link>
                <Link href="/register">
                  <LiquidButton className={`text-black bg-[#27ff9a] hover:bg-[#1fe388] font-bold ${isScrolled ? 'h-8 px-4 text-xs' : ''}`} variant="default" size="default">
                    Sign Up
                  </LiquidButton>
                </Link>
              </>
            )}
          </div>
        </div>
      </motion.nav>
      
      {/* Required for the glass backdrop filter to work across the page */}
      <svg className="hidden">
        <defs>
          <filter id="container-glass" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.05 0.05" numOctaves="1" seed="1" result="turbulence" />
            <feGaussianBlur in="turbulence" stdDeviation="2" result="blurredNoise" />
            <feDisplacementMap in="SourceGraphic" in2="blurredNoise" scale="70" xChannelSelector="R" yChannelSelector="B" result="displaced" />
            <feGaussianBlur in="displaced" stdDeviation="4" result="finalBlur" />
            <feComposite in="finalBlur" in2="finalBlur" operator="over" />
          </filter>
        </defs>
      </svg>
    </>
  );
}
