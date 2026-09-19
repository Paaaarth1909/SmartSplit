'use client';

import React from 'react';
import { DollarSign, Users, PieChart } from 'lucide-react';
import { SplitType } from './types';

interface SplitOption {
  type: SplitType;
  label: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
}

const splitOptions: SplitOption[] = [
  {
    type: 'exact',
    label: 'Split by Amount',
    subtitle: 'Custom amounts',
    description: 'Best when everyone pays for exactly what they ordered',
    icon: <DollarSign size={24} />,
  },
  {
    type: 'shares',
    label: 'Split by Share',
    subtitle: '1×, 2×, 3× …',
    description: 'Best when someone is paying for themselves and their partners',
    icon: <Users size={24} />,
  },
  {
    type: 'percentage',
    label: 'Split by Percentage',
    subtitle: '70 / 30, 50 / 50 …',
    description: 'Best when one person covers a larger part (e.g., 70/30)',
    icon: <PieChart size={24} />,
  },
];

interface Props {
  selected: SplitType;
  onSelect: (type: SplitType) => void;
}

const SplitMethodSelector: React.FC<Props> = ({ selected, onSelect }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {splitOptions.map((opt) => {
        const isActive = selected === opt.type;
        return (
          <button
            key={opt.type}
            type="button"
            className={`flex flex-col items-start p-5 rounded-2xl border text-left transition-all ${
              isActive
                ? 'bg-[#b2f5d1]/10 border-[#b2f5d1]/50 shadow-[0_0_15px_rgba(178,245,209,0.1)]'
                : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
            }`}
            onClick={() => onSelect(opt.type)}
          >
            <div className={`p-3 rounded-full mb-4 flex items-center justify-center ${isActive ? 'bg-[#b2f5d1] text-black' : 'bg-white/10 text-white'}`}>
              {opt.icon}
            </div>
            <div className="flex flex-col gap-1">
              <h4 className={`text-sm font-bold ${isActive ? 'text-[#b2f5d1]' : 'text-white'}`}>{opt.label}</h4>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">{opt.subtitle}</span>
              <p className="text-xs text-white/40 mt-1 leading-relaxed">{opt.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default SplitMethodSelector;
