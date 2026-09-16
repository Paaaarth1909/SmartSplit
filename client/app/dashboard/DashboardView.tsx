'use client';

import React, { useState } from 'react';
import CreateGroupModal from '@/components/CreateGroupModal';
import { ArrowUpRight, ArrowDownRight, Search, CreditCard, Wallet, Users, Settings, Banknote, UserPlus, PieChart } from 'lucide-react';

interface DashboardViewProps {
  initialData: any;
}

export default function DashboardView({ initialData }: DashboardViewProps) {
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const { totalBalance, youOwe, youAreOwed, groupsOwedCount, friendsOwedCount, recentBalances } = initialData;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Math.abs(amount));
  };

  const formatTotalBalance = (amount: number) => {
    const formatted = formatCurrency(amount);
    return amount >= 0 ? `+${formatted}` : `-${formatted}`;
  };

  return (
    <div className="flex flex-col gap-8">
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Balance Card */}
        <div className="bg-[#121214] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden group hover:border-[#b2f5d1]/30 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#b2f5d1]/10 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-[#b2f5d1]/20 transition-colors" />
          <div className="flex items-center gap-2 mb-6">
            <Wallet className="w-4 h-4 text-white/50" />
            <h2 className="text-xs font-bold text-white/50 tracking-widest uppercase">Total Balance</h2>
          </div>
          <div className={`text-4xl font-extrabold tracking-tight mb-2 ${totalBalance >= 0 ? 'text-[#b2f5d1]' : 'text-red-400'}`}>
            {formatTotalBalance(totalBalance)}
          </div>
          <div className="flex items-center gap-2 text-white/50 text-xs font-medium">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            {totalBalance >= 0 ? "You are owed more than you owe" : "You owe more than you are owed"}
          </div>
        </div>

        {/* You Owe Card */}
        <div className="bg-[#121214] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden group hover:border-red-400/30 transition-colors">
          <div className="flex items-center gap-2 mb-6">
            <ArrowUpRight className="w-4 h-4 text-white/50" />
            <h2 className="text-xs font-bold text-white/50 tracking-widest uppercase">You Owe</h2>
          </div>
          <div className="text-3xl font-bold tracking-tight text-red-400 mb-2">
            {formatCurrency(youOwe)}
          </div>
          <div className="text-white/50 text-xs font-medium">
            Across {groupsOwedCount} groups
          </div>
        </div>

        {/* You Are Owed Card */}
        <div className="bg-[#121214] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden group hover:border-[#b2f5d1]/30 transition-colors">
          <div className="flex items-center gap-2 mb-6">
            <ArrowDownRight className="w-4 h-4 text-white/50" />
            <h2 className="text-xs font-bold text-white/50 tracking-widest uppercase">You Are Owed</h2>
          </div>
          <div className="text-3xl font-bold tracking-tight text-[#b2f5d1] mb-2">
            {formatCurrency(youAreOwed)}
          </div>
          <div className="text-white/50 text-xs font-medium">
            Across {friendsOwedCount} friends
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Balances & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Balances (Left Column - 2/3 width) */}
        <div className="lg:col-span-2 bg-[#121214] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white tracking-tight">Recent Balances</h3>
            <button className="text-xs font-bold text-white/50 hover:text-white transition-colors uppercase tracking-widest">
              View All
            </button>
          </div>
          
          <div className="flex flex-col divide-y divide-white/5">
            {recentBalances.length === 0 ? (
              <div className="p-8 text-center text-white/40 text-sm">No recent balances found.</div>
            ) : (
              recentBalances.map((item: any, idx: number) => {
                const isOwed = item.type === 'owed';
                return (
                  <div key={idx} className="p-5 flex items-center justify-between hover:bg-white/5 transition-colors group cursor-pointer">
                    <div className="flex items-center gap-4">
                      {item.name === "Ski Trip 2024" || item.description === "Group" ? (
                        <div className="w-10 h-10 rounded-full bg-[#1a1a1c] border border-white/10 flex items-center justify-center text-white/50">
                          <Users className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#1a1a1c] border border-white/10 flex items-center justify-center text-xs font-bold text-white/70">
                          {item.name.charAt(0)}
                        </div>
                      )}
                      
                      <div>
                        <h4 className="text-sm font-bold text-white/90">{item.name}</h4>
                        <p className="text-xs text-white/50">{item.description}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-base font-bold font-mono ${isOwed ? 'text-[#b2f5d1]' : 'text-red-400'}`}>
                        {isOwed ? '+' : '-'}{formatCurrency(item.amount)}
                      </div>
                      <div className="text-[10px] text-white/40 font-medium">
                        {isOwed ? 'Owes you' : 'You owe'}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Actions (Right Column - 1/3 width) */}
        <div className="bg-[#121214] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col h-full relative overflow-hidden">
           <div className="absolute top-0 right-0 w-48 h-48 bg-[#b2f5d1]/5 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
           
           <div className="flex items-center gap-2 mb-6 relative z-10 pb-4 border-b border-white/10">
             <svg className="w-4 h-4 text-[#b2f5d1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
             </svg>
             <h3 className="text-lg font-bold text-white tracking-tight">Quick Actions</h3>
           </div>
           
           <div className="flex flex-col gap-4 relative z-10">
             <button className="w-full bg-[#b2f5d1] hover:bg-[#9de4c2] text-black font-bold py-3.5 rounded-xl transition-colors shadow-[0_0_15px_rgba(178,245,209,0.2)] flex items-center justify-center gap-2 text-sm">
               <Banknote className="w-4 h-4" /> Settle Up
             </button>
             <button 
               onClick={() => setIsCreateGroupOpen(true)}
               className="w-full bg-transparent hover:bg-white/5 border border-white/10 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
             >
               <UserPlus className="w-4 h-4" /> Create Group
             </button>
           </div>
           
           <div className="mt-auto pt-16 flex flex-col items-center justify-center text-center relative z-10">
             {/* The circle */}
             <div className="w-12 h-12 rounded-full bg-transparent border border-white/20 flex items-center justify-center mb-4 relative z-10 text-white/50">
                <PieChart className="w-5 h-5" />
             </div>
             <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest leading-relaxed relative z-10 w-full">
               Monthly Spend Analysis Ready
             </p>
           </div>
        </div>

        </div>

        {isCreateGroupOpen && (
          <CreateGroupModal 
            onClose={() => setIsCreateGroupOpen(false)}
            onGroupCreated={() => window.location.reload()}
            apiUrl="http://127.0.0.1:5050/api/groups"
          />
        )}
      </div>
  );
}
