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
    icon: <DollarSign size={28} />,
  },
  {
    type: 'shares',
    label: 'Split by Share',
    subtitle: '1×, 2×, 3× …',
    description: 'Best when someone is paying for themselves and their partners',
    icon: <Users size={28} />,
  },
  {
    type: 'percentage',
    label: 'Split by Percentage',
    subtitle: '70 / 30, 50 / 50 …',
    description: 'Best when one person covers a larger part (e.g., 70/30)',
    icon: <PieChart size={28} />,
  },
];

interface Props {
  selected: SplitType;
  onSelect: (type: SplitType) => void;
}

const SplitMethodSelector: React.FC<Props> = ({ selected, onSelect }) => {
  return (
    <div className="split-method-cards">
      {splitOptions.map((opt) => {
        const isActive = selected === opt.type;
        return (
          <button
            key={opt.type}
            type="button"
            className={`split-card${isActive ? ' active' : ''}`}
            onClick={() => onSelect(opt.type)}
          >
            <div className="split-card-icon">{opt.icon}</div>
            <div className="split-card-body">
              <h4 className="split-card-title">{opt.label}</h4>
              <span className="split-card-subtitle">{opt.subtitle}</span>
              <p className="split-card-desc">{opt.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default SplitMethodSelector;
