"use client";

import React from 'react';
import { motion } from 'framer-motion';

export default function HeroSection() {
  return (
    <section className="relative w-full pt-48 pb-20 flex flex-col items-center justify-center px-4 text-center">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-white/[0.03] rounded-full blur-[120px] pointer-events-none" />

      <motion.h1 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight max-w-4xl mb-6 leading-[1.1]"
      >
        Split Expenses Intelligently with Gemini AI & Debt Graph Optimization
      </motion.h1>

      <motion.p 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-12"
      >
        Snap receipts, type plain English, and minimize group IOUs into at most N-1 direct payments. The ultimate fintech vault for your shared finances.
      </motion.p>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
        className="flex items-center gap-4"
      >
        <button className="px-6 py-3 rounded-full text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/10 transition-colors">
          Launch Web App
        </button>
        <button className="px-6 py-3 rounded-full text-sm font-semibold text-white bg-transparent hover:bg-white/5 transition-colors">
          View Interactive Demo
        </button>
      </motion.div>
    </section>
  );
}
