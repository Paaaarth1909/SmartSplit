"use client";

import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full bg-[#111] border-t border-white/5 py-8 mt-20">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1 cursor-pointer">
          <span className="text-lg font-bold tracking-tight text-white">SmartSplit</span>
          <span className="text-lg text-primary">⚡</span>
        </div>

        <div className="flex items-center gap-6 text-[10px] md:text-xs font-semibold text-white/50 uppercase tracking-wider">
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Security</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <a href="#" className="hover:text-white transition-colors">Contact</a>
        </div>
        
        <div className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">
          © {new Date().getFullYear()} SmartSplit. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
