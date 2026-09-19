'use client';
import React from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Frame } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative w-full overflow-hidden border-t border-white/10 bg-[#0a0a0a] pt-16 pb-8 mt-20">

      {/* Huge Faint Background Text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <span className="text-[15vw] font-black text-white/[0.02] tracking-tighter leading-none">
          SMARTSPLIT
        </span>
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 flex flex-col items-start justify-between min-h-[250px]">

        {/* Left Content */}
        <AnimatedContainer className="flex flex-col gap-6 max-w-sm">
          <div className="flex items-center gap-2">
            <Frame className="w-6 h-6 text-white" />
            <span className="text-xl font-bold tracking-tight text-white">SmartSplit <span className="text-[#b2f5d1]">Pro</span></span>
          </div>

          <p className="text-white/50 text-sm">
            Split expenses and manage group ledgers with ease.
          </p>

          <div className="flex flex-col gap-3 mt-4">
            <p className="text-white/50 text-sm">
              Made by <span className="text-white font-medium">Parthsaarthie Sharma and Garv Goel</span>
            </p>
            <div className="flex items-center gap-4 text-white/50">
              <a href="#" className="hover:text-white transition-colors" aria-label="GitHub">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3-.3 6-1.5 6-6.5a5.5 5.5 0 0 0-1.5-3.8 5.5 5.5 0 0 0-.1-3.8s-1.2-.4-3.9 1.4a13.3 13.3 0 0 0-7 0c-2.7-1.8-3.9-1.4-3.9-1.4a5.5 5.5 0 0 0-.1 3.8 5.5 5.5 0 0 0-1.5 3.8c0 5.1 3 6.2 6 6.5a4.8 4.8 0 0 0-1 3.2v4"></path></svg>
              </a>
              <a href="#" className="hover:text-white transition-colors" aria-label="LinkedIn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
              </a>
            </div>
          </div>
        </AnimatedContainer>

        {/* Bottom Bar */}
        <div className="w-full mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between text-white/40 text-xs">
          <p>© {new Date().getFullYear()} SmartSplit INC. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

type ViewAnimationProps = {
  delay?: number;
  className?: ComponentProps<typeof motion.div>['className'];
  children: ReactNode;
};

function AnimatedContainer({ className, delay = 0.1, children }: ViewAnimationProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return children;
  }

  return (
    <motion.div
      initial={{ translateY: 10, opacity: 0 }}
      whileInView={{ translateY: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
