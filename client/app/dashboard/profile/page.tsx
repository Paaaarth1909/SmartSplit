import React from 'react';
import { auth, currentUser } from '@clerk/nextjs/server';
import { Utensils, Car, Film, Plane, Home, Bell, Receipt, Users } from 'lucide-react';
import Image from 'next/image';

export default async function DashboardPage() {
  const user = await currentUser();
  const { getToken } = await auth();
  const token = await getToken();

  // Fallback in case there is no user
  const firstName = user?.firstName || 'User';
  const lastName = user?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const email = user?.emailAddresses[0]?.emailAddress || 'user@example.com';
  const profileImageUrl = user?.imageUrl || '';

  // Fetch real data from the backend
  let dashboardData = {
    totalOwe: 0,
    totalOwed: 0,
    netBalance: 0,
    monthToDate: { shared: 0, paid: 0 },
    recentTransactions: [],
    sharedGroups: []
  };

  try {
    const res = await fetch('http://127.0.0.1:5050/api/users/me/dashboard', {
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: 'no-store'
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        dashboardData = data.data;
      }
    } else {
      console.error("Backend error:", await res.text());
    }
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
  }

  const { totalOwe, totalOwed, netBalance, monthToDate, recentTransactions, sharedGroups } = dashboardData;
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const mtdPercentage = monthToDate.shared > 0 
    ? Math.round((monthToDate.paid / monthToDate.shared) * 100) 
    : 0;

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto">
      
      {/* Main Column */}
      <div className="flex-1 flex flex-col gap-5">
        
        {/* Profile / Balance Card */}
        <div className="bg-[#121214] border border-white/10 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-xl min-h-[240px]">
          {/* Subtle background glow effect */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#b2f5d1]/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
            <div className="relative">
              {profileImageUrl ? (
                <Image 
                  src={profileImageUrl} 
                  alt={fullName} 
                  width={80} 
                  height={80} 
                  className="rounded-full border-2 border-[#222] shadow-lg object-cover w-20 h-20"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-white/10 border-2 border-[#222] flex items-center justify-center text-2xl font-bold text-white/50">
                  {firstName[0]}
                </div>
              )}
              {/* Online indicator dot */}
              <div className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-[#b2f5d1] rounded-full border-2 border-[#121214] shadow-[0_0_10px_rgba(178,245,209,0.5)]" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">{fullName}</h2>
              <div className="flex items-center gap-1.5 text-sm text-white/50">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                {email}
              </div>
            </div>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h3 className="text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-1">Total Balance</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-bold text-white tracking-tighter">
                  {netBalance >= 0 ? 'You are owed' : 'You owe'}
                </span>
                <span className={`text-3xl sm:text-4xl font-bold tracking-tighter ${netBalance >= 0 ? 'text-[#b2f5d1]' : 'text-red-400'}`}>
                  {formatCurrency(Math.abs(netBalance))}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold rounded-lg border border-white/10 transition-colors">
                <Bell className="w-3.5 h-3.5" /> Remind
              </button>
              <button className="px-4 py-2 bg-[#b2f5d1] hover:bg-[#9de4c2] text-black text-xs font-bold rounded-lg transition-colors shadow-[0_0_10px_rgba(178,245,209,0.3)]">
                Settle Up
              </button>
            </div>
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="flex flex-col gap-2">
          {recentTransactions.length === 0 ? (
            <div className="bg-[#121214] border border-white/5 rounded-xl p-8 flex flex-col items-center justify-center text-center">
              <Receipt className="w-8 h-8 text-white/20 mb-3" />
              <h4 className="text-white/70 font-semibold mb-1">No recent transactions</h4>
              <p className="text-xs text-white/40">You haven't been part of any expenses yet.</p>
            </div>
          ) : (
            recentTransactions.map((tx: any) => (
              <div key={tx.id} className="bg-[#121214] border border-white/5 rounded-xl p-3 flex items-center justify-between hover:bg-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1a1a1c] border border-white/5 flex items-center justify-center">
                    <Receipt className="w-4 h-4 text-white/70" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white/90">{tx.description}</h4>
                    <p className="text-[10px] text-white/40 mt-0.5">
                      {new Date(tx.date).toLocaleDateString()} • {tx.payerName} paid {formatCurrency(tx.amount)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold ${tx.isPayer ? 'text-[#b2f5d1]' : 'text-red-400/90'}`}>
                    {tx.isPayer ? '+' : '-'}{formatCurrency(tx.userShare)}
                  </div>
                  <div className="text-[9px] text-white/40 uppercase tracking-wider mt-0.5">
                    {tx.groupName}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* Side Column (Widgets) */}
      <div className="w-full lg:w-72 flex flex-col gap-5 shrink-0">
        
        {/* Month to Date Widget */}
        <div className="bg-[#121214] border border-white/10 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#b2f5d1]/30 to-transparent" />
          <h3 className="font-bold text-base text-white mb-5 tracking-tight">Month to Date</h3>
          
          <div className="flex justify-between text-xs text-white/50 mb-2 font-medium">
            <span>Total Shared Expenses</span>
            <span className="text-white font-mono">{formatCurrency(monthToDate.shared)}</span>
          </div>
          
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-5 border border-white/5">
            <div 
              className="h-full bg-[#b2f5d1] rounded-full shadow-[0_0_10px_rgba(178,245,209,0.5)] transition-all duration-1000" 
              style={{ width: `${Math.min(mtdPercentage, 100)}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-white/50 mb-1 font-medium">
            <span>You Paid</span>
            <span className="text-[#b2f5d1] font-mono">{formatCurrency(monthToDate.paid)} ({mtdPercentage}%)</span>
          </div>
        </div>

        {/* Shared Groups Widget */}
        <div className="bg-[#121214] border border-white/10 rounded-2xl p-5">
          <h3 className="font-bold text-base text-white mb-5 tracking-tight">Shared Groups</h3>
          
          <div className="flex flex-col gap-3">
            {sharedGroups.length === 0 ? (
              <div className="text-center py-4">
                <Users className="w-6 h-6 text-white/20 mx-auto mb-2" />
                <p className="text-xs text-white/40">No groups yet</p>
              </div>
            ) : (
              sharedGroups.map((group: any) => (
                <div key={group.id} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                      <Users className="w-4 h-4 text-[#b2f5d1]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white/90">{group.name}</h4>
                      <p className="text-[10px] text-white/40">{group.memberCount} members</p>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-white/30 group-hover:text-[#b2f5d1] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
