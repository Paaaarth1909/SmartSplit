"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Scan, Send, Network } from 'lucide-react';

export default function HeroWidget() {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 pb-32">
      <motion.div 
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
        className="flex flex-col md:flex-row w-full h-[400px] bg-[#121214] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* Left Pane: Smart Input */}
        <div className="w-full md:w-1/2 p-6 flex flex-col border-b md:border-b-0 md:border-r border-white/5 relative">
          <div className="flex justify-between items-center mb-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Scan className="w-4 h-4" />
              <span className="font-medium">Smart Input</span>
            </div>
            <span>•••</span>
          </div>
          
          <div className="flex-1 flex flex-col justify-center gap-6">
            <div className="w-full h-32 border border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center text-muted-foreground/60 hover:border-white/40 hover:bg-white/5 transition-all cursor-pointer">
              <Scan className="w-6 h-6 mb-2" />
              <span className="text-sm">Drop Receipt Image</span>
            </div>
            
            <div className="text-center text-xs text-muted-foreground/50 font-medium">Or type natural language</div>
            
            <div className="relative">
              <input 
                type="text" 
                placeholder="Dinner $84 at Olive Garden split with Raj" 
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20"
                readOnly
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Pane: Live Optimization */}
        <div className="w-full md:w-1/2 p-6 flex flex-col relative overflow-hidden bg-[#0d0d0f]">
          <div className="flex justify-between items-center z-10 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4" />
              <span className="font-medium">Live Optimization</span>
            </div>
            <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-green-400 bg-green-400/10 rounded-full border border-green-400/20">
              ⚡ Optimized
            </div>
          </div>

          <div className="flex-1 relative flex items-center justify-center min-h-[250px]">
            {/* Simple representation of the debt graph from the design */}
            <div className="relative w-full max-w-[300px] h-[150px]">
              {/* Nodes */}
              <motion.div 
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute top-4 left-4 w-10 h-10 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-xs text-white z-20 shadow-lg backdrop-blur-md"
              >
                You
              </motion.div>
              
              <motion.div 
                animate={{ y: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-4 right-1/2 w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-xs text-white/70 z-20"
              >
                Raj
              </motion.div>
              
              <motion.div 
                animate={{ y: [0, -3, 0] }}
                transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 2 }}
                className="absolute top-10 right-4 w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-xs text-white/70 z-20"
              >
                Alex
              </motion.div>

              {/* Edge/Connection Line with animated dot */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ overflow: 'visible' }}>
                <path 
                  id="debt-line"
                  d="M 36,36 Q 100,80 140,110" 
                  fill="none" 
                  stroke="rgba(255,255,255,0.1)" 
                  strokeWidth="2" 
                />
                {/* Transfer badge */}
                <foreignObject x="60" y="55" width="80" height="24">
                  <div className="bg-white/10 border border-white/20 rounded-full px-2 py-1 text-[10px] text-white flex items-center justify-center backdrop-blur-md">
                    + $42.00
                  </div>
                </foreignObject>
              </svg>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
