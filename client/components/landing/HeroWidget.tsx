"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scan, Send, Network, CheckCircle2, Sparkles } from 'lucide-react';

export default function HeroWidget() {
  const [inputText, setInputText] = useState('');
  const [isParsed, setIsParsed] = useState(false);
  const [parsedData, setParsedData] = useState<{
    desc: string;
    amount: number;
    splitWith: string;
    share: number;
  }>({
    desc: 'Dinner at Olive Garden',
    amount: 84,
    splitWith: 'Raj',
    share: 42,
  });

  const handleSimulateParse = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim() || 'Dinner $84 at Olive Garden split with Raj';
    
    // Quick extract amount and friend name from text
    const numMatch = text.match(/\$?(\d+(\.\d+)?)/);
    const amount = numMatch ? parseFloat(numMatch[1]) : 84;
    
    let friend = 'Raj';
    if (/with\s+([a-zA-Z]+)/i.test(text)) {
      const match = text.match(/with\s+([a-zA-Z]+)/i);
      if (match && match[1]) friend = match[1];
    } else if (/paid\s+by\s+([a-zA-Z]+)/i.test(text)) {
      const match = text.match(/paid\s+by\s+([a-zA-Z]+)/i);
      if (match && match[1]) friend = match[1];
    }

    setParsedData({
      desc: text.replace(/\$?(\d+(\.\d+)?)/, '').replace(/split with.*/i, '').trim() || 'Dinner',
      amount,
      splitWith: friend,
      share: Math.round((amount / 2) * 100) / 100,
    });
    setIsParsed(true);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 pb-12">
      <motion.div 
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
        className="flex flex-col md:flex-row w-full h-auto md:h-[400px] bg-[#121214] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
      >
        <div className="w-full md:w-1/2 p-6 flex flex-col border-b md:border-b-0 md:border-r border-white/5 relative">
          <div className="flex justify-between items-center mb-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Scan className="w-4 h-4 text-[#27ff9a]" />
              <span className="font-semibold text-white">Smart Input & AI Parser</span>
            </div>
            <span className="text-xs text-[#27ff9a] font-mono uppercase bg-[#27ff9a]/10 px-2 py-0.5 rounded-full border border-[#27ff9a]/20">Interactive Demo</span>
          </div>
          
          <div className="flex-1 flex flex-col justify-center gap-4">
            <div 
              onClick={() => {
                setInputText('Groceries $120 split with Alex and Raj');
                handleSimulateParse();
              }}
              className="w-full h-24 border border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center text-muted-foreground/60 hover:border-[#27ff9a]/50 hover:bg-[#27ff9a]/5 transition-all cursor-pointer group"
            >
              <Scan className="w-5 h-5 mb-1 group-hover:text-[#27ff9a] transition-colors" />
              <span className="text-xs group-hover:text-white transition-colors">Drop Receipt Image or <span className="text-[#27ff9a] underline underline-offset-2">Click to Test Preset</span></span>
            </div>
            
            <div className="text-center text-xs text-muted-foreground/60 font-medium">Or type in natural language</div>
            
            <form onSubmit={handleSimulateParse} className="relative">
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Dinner $84 at Olive Garden split with Raj" 
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#27ff9a]/50 focus:ring-1 focus:ring-[#27ff9a]/30 transition-all"
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-[#27ff9a]/20 hover:bg-[#27ff9a]/30 text-[#27ff9a] rounded-lg transition-colors cursor-pointer"
                title="Parse Natural Language"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <AnimatePresence>
              {isParsed && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-2.5 rounded-xl bg-[#27ff9a]/10 border border-[#27ff9a]/20 flex items-center gap-2 text-xs text-[#27ff9a]"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Parsed ${parsedData.amount.toFixed(2)}: ${parsedData.share.toFixed(2)} per person with {parsedData.splitWith}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="w-full md:w-1/2 p-6 flex flex-col relative overflow-hidden bg-[#0d0d0f]">
          <div className="flex justify-between items-center z-10 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-[#27ff9a]" />
              <span className="font-semibold text-white">Live Debt Graph Optimization</span>
            </div>
            <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-green-400 bg-green-400/10 rounded-full border border-green-400/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Live
            </div>
          </div>

          <div className="flex-1 relative flex items-center justify-center min-h-[250px]">
            <div className="relative w-full max-w-[300px] h-[150px]">
              <motion.div 
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute top-4 left-4 w-12 h-12 bg-white/10 border border-[#27ff9a]/30 rounded-full flex flex-col items-center justify-center text-xs text-white z-20 shadow-lg backdrop-blur-md"
              >
                <span className="font-bold">You</span>
              </motion.div>
              
              <motion.div 
                animate={{ y: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-4 right-1/2 w-12 h-12 bg-white/5 border border-white/20 rounded-full flex flex-col items-center justify-center text-xs text-white/90 z-20"
              >
                <span className="font-bold">{parsedData.splitWith}</span>
              </motion.div>
              
              <motion.div 
                animate={{ y: [0, -3, 0] }}
                transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 2 }}
                className="absolute top-10 right-4 w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-xs text-white/60 z-20"
              >
                Alex
              </motion.div>

              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ overflow: 'visible' }}>
                <path 
                  id="debt-line"
                  d="M 45,45 Q 100,80 135,105" 
                  fill="none" 
                  stroke="rgba(39,255,154,0.3)" 
                  strokeWidth="2" 
                />
                <foreignObject x="55" y="55" width="90" height="28">
                  <div className="bg-[#121214] border border-[#27ff9a]/40 rounded-full px-2 py-0.5 text-[11px] font-semibold text-[#27ff9a] flex items-center justify-center shadow-lg">
                    + ${parsedData.share.toFixed(2)}
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
