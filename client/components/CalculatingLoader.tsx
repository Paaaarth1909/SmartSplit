import React from 'react';
import { Check, RefreshCw, Lock, Pause, ArrowRight, Activity } from 'lucide-react';

interface CalculatingLoaderProps {
  isOpen: boolean;
  groupName?: string;
  onComplete?: () => void;
}

export default function CalculatingLoader({ isOpen, groupName = "Avenue Trip", onComplete }: CalculatingLoaderProps) {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          if (onComplete) {
            setTimeout(onComplete, 500); // 500ms delay at 100%
          }
          return 100;
        }
        return Math.min(100, prev + Math.floor(Math.random() * 4) + 1);
      });
    }, 60);

    return () => clearInterval(interval);
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  let progressText = "Parsing input & OCR...";
  if (progress > 33 && progress <= 66) {
    progressText = "Minimizing debt settlement graph...";
  } else if (progress > 66) {
    progressText = "Syncing ledgers across group...";
  }

  const getBlockState = (index: number) => {
    if (index === 1) {
      return progress <= 33 ? 'active' : 'completed';
    } else if (index === 2) {
      if (progress <= 33) return 'pending';
      return progress <= 66 ? 'active' : 'completed';
    } else {
      if (progress <= 66) return 'pending';
      return progress < 100 ? 'active' : 'completed';
    }
  };

  const renderBlock = (index: number, title: string, desc: string) => {
    const state = getBlockState(index);
    if (state === 'completed') {
      return (
        <div className="bg-[#1a1a1c]/50 border border-white/5 rounded-2xl p-4 flex items-start gap-4 transition-colors">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4 text-white/70" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white mb-0.5">{title}</h4>
            <p className="text-[10px] text-white/40">{desc}</p>
          </div>
        </div>
      );
    } else if (state === 'active') {
      return (
        <div className="bg-[#1a1a1c] border border-[#b2f5d1]/50 rounded-2xl p-4 flex items-start gap-4 shadow-[0_0_20px_rgba(178,245,209,0.1)] relative overflow-hidden transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#b2f5d1]/5 to-transparent animate-[shimmer_2s_infinite]" />
          <div className="w-8 h-8 rounded-full bg-[#b2f5d1]/20 flex items-center justify-center shrink-0 border border-[#b2f5d1]/30">
            <RefreshCw className="w-4 h-4 text-[#b2f5d1] animate-spin" />
          </div>
          <div className="relative z-10">
            <h4 className="text-sm font-bold text-white mb-0.5">{title}</h4>
            <p className="text-[10px] text-white/60">{desc}</p>
          </div>
        </div>
      );
    } else {
      return (
        <div className="bg-[#1a1a1c]/30 border border-white/5 rounded-2xl p-4 flex items-start gap-4 opacity-50 grayscale transition-all duration-300">
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4 text-white/40" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white mb-0.5">{title}</h4>
            <p className="text-[10px] text-white/40">{desc}</p>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      {/* Modal Container */}
      <div className="bg-[#121214] border border-white/10 rounded-[2rem] p-10 max-w-3xl w-full flex flex-col items-center relative overflow-hidden shadow-2xl">
        
        {/* Subtle Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#b2f5d1]/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Loader Animation */}
        <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
          {/* Outer dotted spinning ring */}
          <div className="absolute inset-0 border-[1px] border-dashed border-white/20 rounded-full animate-[spin_20s_linear_infinite]" />
          
          {/* Middle spinning ring with dots */}
          <div className="absolute inset-4 border border-white/10 rounded-full animate-[spin_10s_linear_infinite_reverse]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white/40 rounded-full" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-white/40 rounded-full" />
            <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-[#b2f5d1] rounded-full shadow-[0_0_8px_rgba(178,245,209,0.8)]" />
            <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white/40 rounded-full" />
          </div>

          {/* Hexagon Outline */}
          <svg className="absolute inset-8 w-[calc(100%-4rem)] h-[calc(100%-4rem)] animate-pulse" viewBox="0 0 100 100">
            <polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" fill="none" stroke="rgba(178,245,209,0.3)" strokeWidth="1" strokeDasharray="4 4" />
          </svg>

          {/* Center 3D Cube Graphic (Using SVG for precision) */}
          <div className="relative z-10 w-16 h-16 text-[#b2f5d1] drop-shadow-[0_0_15px_rgba(178,245,209,0.4)]">
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" className="w-full h-full">
              {/* Cube Edges */}
              <polygon points="50,15 85,35 85,75 50,95 15,75 15,35" fill="rgba(178,245,209,0.05)" />
              <polyline points="50,15 50,55" />
              <polyline points="15,35 50,55 85,35" />
              <polyline points="50,55 50,95" />
              {/* Sparkle/Activity line inside */}
              <path d="M50,15 L50,55 L30,45" stroke="currentColor" strokeWidth="3" />
              <path d="M50,55 L70,45" stroke="currentColor" strokeWidth="3" opacity="0.5" />
            </svg>
          </div>
        </div>

        {/* Text Content */}
        <h2 className="text-3xl font-bold text-white tracking-tight mb-3 text-center z-10">Calculating Fair Balances ...</h2>
        <p className="text-sm text-white/50 text-center max-w-md mb-10 z-10 leading-relaxed">
          Optimizing group debts via debt minimization algorithm, parsing OCR receipts, and balancing {groupName} split shares.
        </p>

        {/* Progress Bar Section */}
        <div className="w-full max-w-xl mb-8 z-10">
          <div className="flex items-center justify-between text-xs font-mono text-white/60 mb-2 px-1">
            <span className="flex items-center gap-2"><RefreshCw className="w-3 h-3 animate-spin" /> {progressText}</span>
            <span className="text-[#b2f5d1] font-bold">{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden relative">
            <div className="absolute top-0 left-0 h-full bg-[#b2f5d1] shadow-[0_0_10px_rgba(178,245,209,0.8)] rounded-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl mb-10 z-10">
          {renderBlock(1, "Smart Input & OCR", "Receipt items tagged")}
          {renderBlock(2, "Debt Graph Solver", "8 settlements reduced")}
          {renderBlock(3, "Ledger Sync", "Updating members")}
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center gap-4 z-10">
          <button className="flex items-center gap-2 text-xs font-medium text-white/50 hover:text-white transition-colors">
            <Pause className="w-3.5 h-3.5" /> Pause sync
          </button>
          <div className="w-1 h-1 rounded-full bg-white/20"></div>
          <button className="flex items-center gap-2 text-xs font-medium text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-full transition-colors">
            Enter {groupName} Dashboard <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
