"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { LiquidButton } from '../ui/button';
import { Frame } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();

  const userInitial = user?.fullName
    ? user.fullName.charAt(0).toUpperCase()
    : "U";

  return (
    <>
      <motion.nav 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="fixed top-6 left-1/2 -translate-x-1/2 z-50 rounded-full w-[92%] sm:w-[90%] max-w-5xl py-2.5 sm:py-3 transition-all duration-300 ease-in-out"
      >
        {/* Background Glass Layers */}
        <div className="absolute top-0 left-0 z-0 h-full w-full rounded-full 
            shadow-[0_0_6px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3px_rgba(0,0,0,0.9),inset_-3px_-3px_0.5px_-3px_rgba(0,0,0,0.85),inset_1px_1px_1px_-0.5px_rgba(0,0,0,0.6),inset_-1px_-1px_1px_-0.5px_rgba(0,0,0,0.6),inset_0_0_6px_6px_rgba(0,0,0,0.12),inset_0_0_2px_2px_rgba(0,0,0,0.06),0_0_12px_rgba(255,255,255,0.15)] 
        transition-all 
        dark:shadow-[0_0_8px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3.5px_rgba(255,255,255,0.09),inset_-3px_-3px_0.5px_-3.5px_rgba(255,255,255,0.85),inset_1px_1px_1px_-0.5px_rgba(255,255,255,0.6),inset_-1px_-1px_1px_-0.5px_rgba(255,255,255,0.6),inset_0_0_6px_6px_rgba(255,255,255,0.12),inset_0_0_2px_2px_rgba(255,255,255,0.06),0_0_12px_rgba(0,0,0,0.15)] bg-black/60 backdrop-blur-md" />
        
        <div
          className="absolute top-0 left-0 isolate -z-10 h-full w-full overflow-hidden rounded-full"
          style={{ backdropFilter: 'url("#container-glass")' }}
        />

        {/* Content */}
        <div className="relative z-10 w-full flex items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 cursor-pointer shrink-0">
            <Frame className="w-5 h-5 text-white shrink-0" />
            <span className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap">
              SmartSplit <span className="text-[#b2f5d1]">Pro</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard" className="shrink-0">
                  <LiquidButton className="text-white bg-white/10 h-9 px-3.5 sm:px-4 text-xs sm:text-sm whitespace-nowrap" variant="default" size="default">
                    Dashboard
                  </LiquidButton>
                </Link>
                <Link href="/dashboard/profile" className="shrink-0">
                  <div className="rounded-full bg-[#27ff9a] text-black font-bold text-xs flex items-center justify-center cursor-pointer shadow-[0_0_10px_rgba(39,255,154,0.3)] w-8 h-8 shrink-0 aspect-square">
                    {userInitial}
                  </div>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="text-xs md:text-sm font-medium text-white/70 hover:text-white transition-colors px-2.5 sm:px-3 py-1.5 whitespace-nowrap shrink-0">
                  Sign In
                </Link>
                <Link href="/register" className="shrink-0">
                  <LiquidButton className="text-black bg-[#27ff9a] hover:bg-[#1fe388] font-bold h-9 px-3.5 sm:px-4 text-xs sm:text-sm whitespace-nowrap" variant="default" size="default">
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
