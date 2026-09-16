"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Banknote } from 'lucide-react';

export default function OptimizationShowcase() {
  return (
    <section className="w-full max-w-5xl mx-auto px-4 pb-32">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="w-full bg-[#18181b] border border-white/5 rounded-[2rem] p-8 md:p-12 relative overflow-hidden"
      >
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-white/[0.02] rounded-full blur-[80px]" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
          <div className="flex flex-col justify-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              The "4-Person Trip" Optimization
            </h2>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-12">
              Experience how our vault processes group chaos into streamlined transactions.
            </p>

            <div className="bg-[#111] border border-white/5 rounded-2xl p-6 shadow-inner">
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Transactions</span>
                <span className="px-3 py-1 bg-white/10 text-white rounded-full text-[10px] font-semibold tracking-wider">70% Reduction</span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex-1 flex flex-col items-center justify-center p-4">
                  <span className="text-4xl font-bold text-white mb-2">14</span>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Original Payments</span>
                </div>
                
                <ArrowRight className="w-5 h-5 text-white/30" />
                
                <div className="flex-1 flex flex-col items-center justify-center p-4">
                  <span className="text-4xl font-bold text-primary mb-2">3</span>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Optimized Payments</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center relative min-h-[300px]">
            {/* Visualizer ring */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-[300px] h-[300px]" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="2 4" />
                <motion.circle 
                  cx="50" cy="50" r="45" 
                  fill="none" 
                  stroke="rgba(255,255,255,0.2)" 
                  strokeWidth="1" 
                  strokeDasharray="280"
                  initial={{ strokeDashoffset: 280 }}
                  whileInView={{ strokeDashoffset: 0 }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                  viewport={{ once: true }}
                />
              </svg>
            </div>

            <div className="w-32 h-32 rounded-full bg-[#111] border border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.05)] flex items-center justify-center relative z-10">
              <Banknote className="w-10 h-10 text-white" />
            </div>

            <div className="absolute top-10 right-10 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] text-white/80 backdrop-blur-md">
              Save Time
            </div>
            
            <div className="absolute bottom-10 left-10 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] text-white/80 backdrop-blur-md">
              No Math
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
