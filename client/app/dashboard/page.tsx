import React from 'react';
import { auth } from '@clerk/nextjs/server';
import DashboardView from './DashboardView';

export default async function DashboardPage() {
  const { getToken } = await auth();
  const token = await getToken();
  
  let financialData = null;

  try {
    const res = await fetch('http://127.0.0.1:5050/api/users/me/financial-overview', {
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: 'no-store'
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        financialData = data.data;
      }
    } else {
      console.error("Backend error:", await res.text());
    }
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
  }

  // Fallback data if backend is unreachable
  if (!financialData) {
    financialData = {
      totalBalance: 0,
      youOwe: 0,
      youAreOwed: 0,
      groupsOwedCount: 0,
      friendsOwedCount: 0,
      recentBalances: []
    };
  }

  return (
    <div className="max-w-6xl mx-auto h-full">
      <h1 className="text-3xl font-bold text-white tracking-tight mb-8">Financial Overview</h1>
      <DashboardView initialData={financialData} />
    </div>
  );
}
