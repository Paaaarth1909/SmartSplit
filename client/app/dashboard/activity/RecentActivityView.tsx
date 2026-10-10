'use client';

import React, { useState } from 'react';
import { Utensils, Plane, CheckCircle2, ShoppingCart, Coffee, Activity, Sparkles } from 'lucide-react';

interface RecentActivityViewProps {
  initialData?: {
    totalBalance?: number;
    youOwe?: number;
    youAreOwed?: number;
    activities?: any[];
    recentActivity?: any[];
    frequentConnections?: any[];
  };
}

export default function RecentActivityView({ initialData }: RecentActivityViewProps) {
  const [filter, setFilter] = useState<'All' | 'You owe' | 'You are owed'>('All');
  
  const totalBalance = Number(initialData?.totalBalance) || 0;
  const youOwe = Number(initialData?.youOwe) || 0;
  const youAreOwed = Number(initialData?.youAreOwed) || 0;
  
  const rawActivities = Array.isArray(initialData?.activities)
    ? initialData.activities
    : Array.isArray(initialData?.recentActivity)
      ? initialData.recentActivity
      : [];
      
  const frequentConnections = Array.isArray(initialData?.frequentConnections)
    ? initialData.frequentConnections
    : [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Math.abs(Number(amount) || 0));
  };
  
  const filteredActivities = rawActivities.filter((act: any) => {
    if (!act) return false;
    if (filter === 'All') return true;
    if (filter === 'You owe') return act.type === 'owe';
    if (filter === 'You are owed') return act.type === 'owed';
    return true;
  });

  const getRelativeDateLabel = (dateString: string) => {
    if (!dateString) return 'OLDER';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'OLDER';

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

  const preferredOrder = ['TODAY', 'YESTERDAY', 'THIS WEEK', 'OLDER'];
  const groupKeys = Object.keys(groupedActivities).sort((a, b) => {
    const indexA = preferredOrder.indexOf(a);
    const indexB = preferredOrder.indexOf(b);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  const getCategoryIcon = (category: string) => {
    const lower = category?.toLowerCase() || '';
    if (lower.includes('food') || lower.includes('dinner') || lower.includes('restaurant') || lower.includes('lunch') || lower.includes('meal')) {
      return <Utensils className="w-5 h-5 text-white/50" />;
    }
    if (lower.includes('travel') || lower.includes('flight') || lower.includes('transport') || lower.includes('trip') || lower.includes('taxi')) {
      return <Plane className="w-5 h-5 text-white/50" />;
    }
    if (lower.includes('settlement') || lower.includes('payment')) {
      return <CheckCircle2 className="w-5 h-5 text-[#b2f5d1]" />;
    }
    if (lower.includes('shopping') || lower.includes('groceries')) {
      return <ShoppingCart className="w-5 h-5 text-white/50" />;
    }
    if (lower.includes('coffee') || lower.includes('drink') || lower.includes('cafe')) {
      return <Coffee className="w-5 h-5 text-white/50" />;
    }
    return <Activity className="w-5 h-5 text-white/50" />;
  };

  return (
    <div className="flex flex-col gap-8 h-full">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Recent Activity</h1>
          <p className="text-white/50 text-sm">Your latest shared expenses and settlements.</p>
        </div>
        <div className="flex bg-[#121214] border border-white/10 rounded-full p-1 self-start sm:self-auto">
          {(['All', 'You owe', 'You are owed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
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
          {groupKeys.length === 0 ? (
            <div className="p-12 text-center border border-white/10 rounded-2xl bg-[#121214] text-white/40 flex flex-col items-center justify-center gap-3">
              <Sparkles className="w-8 h-8 text-white/20" />
              <p className="text-sm font-medium">No recent activity found for this filter.</p>
            </div>
          ) : (
            groupKeys.map(groupLabel => (
              <div key={groupLabel}>
                <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-3 pl-1">
                  {groupLabel}
                </h3>
                <div className="flex flex-col gap-3">
                  {groupedActivities[groupLabel].map((act: any, idx: number) => {
                    const isOwed = act.type === 'owed';
                    const isOwe = act.type === 'owe';
                    const isSettled = act.type === 'settled';

                    const displayDate = act.date
                      ? new Date(act.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })
                      : '';

                    return (
                      <div 
                        key={act.id || act._id || `act-${idx}`} 
                        className="bg-[#121214] border border-white/10 rounded-2xl p-5 flex items-center justify-between hover:border-white/20 transition-all shadow-sm"
                      >
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 pr-3">
                          <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 aspect-square ${act.isSettlement ? 'bg-[#1a2e22] border-[#b2f5d1]/20' : 'bg-[#1a1a1c] border-white/10'}`}>
                            {getCategoryIcon(act.category || act.title)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">{act.title}</h4>
                            <div className="flex items-center gap-2 text-xs text-white/50 mt-0.5 flex-wrap">
                              <span>
                                {act.isSettlement 
                                  ? act.description || act.title || 'Payment recorded' 
                                  : `${act.payerName || 'Someone'} paid ${formatCurrency(act.amount)}`}
                              </span>
                              {act.groupName && (
                                <>
                                  <span className="text-white/20">•</span>
                                  <span className="text-white/40">{act.groupName}</span>
                                </>
                              )}
                              {displayDate && (
                                <>
                                  <span className="text-white/20">•</span>
                                  <span className="text-white/40">{displayDate}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right shrink-0">
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
          <div className="bg-[#121214] border border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-sm">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
             
             <h3 className="text-xs font-bold text-white/50 tracking-widest uppercase mb-4">Total Balance</h3>
             
             <div className={`text-4xl font-extrabold tracking-tight mb-2 ${totalBalance > 0 ? 'text-[#b2f5d1]' : totalBalance < 0 ? 'text-red-400' : 'text-white'}`}>
               {totalBalance > 0 ? `+${formatCurrency(totalBalance)}` : totalBalance < 0 ? `-${formatCurrency(totalBalance)}` : formatCurrency(0)}
             </div>
             <p className="text-xs font-medium text-white/50 mb-8">
               {totalBalance > 0 ? 'People owe you' : totalBalance < 0 ? 'You owe people' : 'All settled up'}
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
          <div className="bg-[#121214] border border-white/10 rounded-2xl p-6 shadow-sm">
             <h3 className="text-xs font-bold text-white/50 tracking-widest uppercase mb-6">Frequent Connections</h3>
             
             <div className="flex flex-col gap-4">
               {frequentConnections.length === 0 ? (
                 <div className="text-white/40 text-xs text-center py-4">No frequent connections yet.</div>
               ) : (
                 frequentConnections.map((conn: any, i: number) => {
                   const netBal = Number(conn.netBalance) || 0;
                   const isOwed = netBal > 0;
                   const isOwe = netBal < 0;
                   const name = conn.name || 'Friend';
                   
                   return (
                     <div key={i} className="flex items-center justify-between group gap-3">
                       <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                         <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-[10px] font-bold text-white/70 bg-[#1a1a1c] group-hover:border-white/30 transition-colors">
                           {name.charAt(0).toUpperCase()}
                         </div>
                         <span className="text-sm font-semibold text-white/90 truncate min-w-0">{name}</span>
                       </div>
                       <div className={`text-xs font-bold ${isOwed ? 'text-[#b2f5d1]' : isOwe ? 'text-red-400' : 'text-white/40'}`}>
                         {isOwed ? `+${formatCurrency(netBal)}` : isOwe ? `-${formatCurrency(netBal)}` : 'Settled'}
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
