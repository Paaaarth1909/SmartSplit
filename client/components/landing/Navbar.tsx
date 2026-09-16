"use client";

import React from 'react';
import { motion } from 'framer-motion';

export default function Navbar() {
  return (
    <motion.nav 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl z-50 flex items-center justify-between px-6 py-3 bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-full"
    >
      <div className="flex items-center gap-1 cursor-pointer">
        <span className="text-xl font-bold tracking-tight text-white">SmartSplit</span>
        <span className="text-xl text-primary">⚡</span>
      </div>

      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
        <a href="#features" className="hover:text-white transition-colors">Features</a>
        <a href="#ocr" className="hover:text-white transition-colors">AI Receipt OCR</a>
        <a href="#algorithm" className="hover:text-white transition-colors">Debt Algorithm</a>
        <a href="#integrations" className="hover:text-white transition-colors">Integrations</a>
      </div>

      <div className="flex items-center gap-4">
        <button className="text-sm font-medium text-muted-foreground hover:text-white transition-colors hidden sm:block">
          Log In
        </button>
        <button className="px-5 py-2 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/10 rounded-full transition-colors">
          Get Started Free
        </button>
      </div>
    </motion.nav>
  );
}
