'use client';

import React, { useState } from 'react';
import { Utensils, Plane, CheckCircle2, ShoppingCart, Coffee, Activity } from 'lucide-react';

interface RecentActivityViewProps {
  initialData: any;
}

export default function RecentActivityView({ initialData }: RecentActivityViewProps) {
  const [filter, setFilter] = useState<'All' | 'You owe' | 'You are owed'>('All');
  
  const { totalBalance, youOwe, youAreOwed, activities, frequentConnections } = initialData;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Math.abs(amount));
  };
  
  const filteredActivities = activities.filter((act: any) => {
    if (filter === 'All') return true;
    if (filter === 'You owe') return act.type === 'owe';
    if (filter === 'You are owed') return act.type === 'owed';
    return true;
  });

  const getRelativeDateLabel = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return 'TODAY';
    if (date.toDateString() === yesterday.toDateString()) return 'YESTERDAY';
    
    // Check if within last 7 days
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    if (diffDays <= 7) return 'THIS WEEK';
    
    return 'OLDER';
  };

  const groupedActivities = filteredActivities.reduce((acc: any, act: any) => {
    const label = getRelativeDateLabel(act.date);
    if (!acc[label]) acc[label] = [];
    acc[label].push(act);
    return acc;
  }, {});

  const getCategoryIcon = (category: string) => {
    const lower = category?.toLowerCase() || '';
    if (lower.includes('food') || lower.includes('dinner') || lower.includes('restaurant')) return <Utensils className="w-5 h-5 text-white/50" />;
    if (lower.includes('travel') || lower.includes('flight') || lower.includes('transport')) return <Plane className="w-5 h-5 text-white/50" />;
    if (lower.includes('settlement') || lower.includes('payment')) return <CheckCircle2 className="w-5 h-5 text-[#b2f5d1]" />;
    if (lower.includes('shopping')) return <ShoppingCart className="w-5 h-5 text-white/50" />;
    if (lower.includes('coffee')) return <Coffee className="w-5 h-5 text-white/50" />;
    return <Activity className="w-5 h-5 text-white/50" />;
  };

  return (
    <div className="flex flex-col gap-8 h-full">
      {/* Header & Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Recent Activity</h1>
          <p className="text-white/50 text-sm">Your latest shared expenses and settlements.</p>
        </div>
        <div className="flex bg-[#121214] border border-white/10 rounded-full p-1">
          {['All', 'You owe', 'You are owed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${
                filter === f 
                  ? 'bg-white/10 text-white shadow-sm' 
                  : 'text-white/40 hover:text-white/80'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
        
        {/* Left Col - Activity List */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {Object.keys(groupedActivities).length === 0 ? (
            <div className="p-8 text-center border border-white/10 rounded-2xl bg-[#121214] text-white/40 text-sm">
              No recent activity found.
            </div>
          ) : (
            Object.keys(groupedActivities).map(groupLabel => (
              <div key={groupLabel}>
                <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-3 pl-1">
                  {groupLabel}
                </h3>
                <div className="flex flex-col gap-3">
                  {groupedActivities[groupLabel].map((act: any) => {
                    const isOwed = act.type === 'owed';
                    const isOwe = act.type === 'owe';
                    const isSettled = act.type === 'settled';

                    return (
                      <div 
                        key={act.id} 
                        className="bg-[#121214] border border-white/10 rounded-2xl p-5 flex items-center justify-between hover:border-white/20 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${act.isSettlement ? 'bg-[#1a2e22] border-[#b2f5d1]/20' : 'bg-[#1a1a1c] border-white/10'}`}>
                            {getCategoryIcon(act.category || act.title)}
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-white tracking-tight">{act.title}</h4>
                            <p className="text-xs text-white/50 mt-0.5">
                              {act.isSettlement ? act.description || 'Payment received' : `${act.payerName} paid ${formatCurrency(act.amount)}`}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className={`text-xs font-bold mb-1 ${isOwed ? 'text-[#b2f5d1]' : isOwe ? 'text-red-400' : 'text-white/50'}`}>
                            {isOwed ? 'You get back' : isOwe ? 'You owe' : 'Payment'}
                          </div>
                          <div className={`text-2xl font-black tracking-tighter ${isOwed ? 'text-[#b2f5d1]' : isOwe ? 'text-red-400' : 'text-white'}`}>
                            {isSettled ? formatCurrency(act.amount) : formatCurrency(act.userShare)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Col - Widgets */}
        <div className="flex flex-col gap-6">
          {/* Total Balance */}
          <div className="bg-[#121214] border border-white/10 rounded-2xl p-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
             
             <h3 className="text-xs font-bold text-white/50 tracking-widest uppercase mb-4">Total Balance</h3>
             
             <div className={`text-4xl font-extrabold tracking-tight mb-2 ${totalBalance >= 0 ? 'text-[#b2f5d1]' : 'text-red-400'}`}>
               {totalBalance < 0 ? '-' : ''}{formatCurrency(Math.abs(totalBalance))}
             </div>
             <p className="text-xs font-medium text-white/50 mb-8">
               {totalBalance >= 0 ? 'People owe you' : 'You owe people'}
             </p>
             
             <div className="flex flex-col gap-3 pt-6 border-t border-white/5">
               <div className="flex justify-between items-center text-sm font-medium">
                 <span className="text-white/60">You owe</span>
                 <span className="text-red-400 font-bold">{formatCurrency(youOwe)}</span>
               </div>
               <div className="flex justify-between items-center text-sm font-medium">
                 <span className="text-white/60">You are owed</span>
                 <span className="text-[#b2f5d1] font-bold">{formatCurrency(youAreOwed)}</span>
               </div>
             </div>
          </div>

          {/* Frequent Connections */}
          <div className="bg-[#121214] border border-white/10 rounded-2xl p-6">
             <h3 className="text-xs font-bold text-white/50 tracking-widest uppercase mb-6">Frequent Connections</h3>
             
             <div className="flex flex-col gap-4">
               {frequentConnections.length === 0 ? (
                 <div className="text-white/40 text-xs text-center">No frequent connections yet.</div>
               ) : (
                 frequentConnections.map((conn: any, i: number) => {
                   const isOwed = conn.netBalance > 0;
                   const isOwe = conn.netBalance < 0;
                   const isSettled = !isOwe && !isOwed;
                   
                   return (
                     <div key={i} className="flex items-center justify-between group">
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-[10px] font-bold text-white/70 bg-[#1a1a1c] group-hover:border-white/30 transition-colors">
                           {conn.name.charAt(0)}
                         </div>
                         <span className="text-sm font-semibold text-white/90">{conn.name}</span>
                       </div>
                       <div className={`text-xs font-bold ${isOwed ? 'text-[#b2f5d1]' : isOwe ? 'text-red-400' : 'text-white/40'}`}>
                         {isOwed ? `+${formatCurrency(conn.netBalance)}` : isOwe ? `-${formatCurrency(conn.netBalance)}` : 'Settled'}
                       </div>
                     </div>
                   );
                 })
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
