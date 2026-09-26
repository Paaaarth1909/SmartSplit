'use client';

import React, { useEffect, useState } from 'react';
import DashboardView from './DashboardView';
import { API_BASE, getAuthHeaders } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [financialData, setFinancialData] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setIsLoadingData(true);
        const res = await fetch(`${API_BASE}/users/me/financial-overview`, {
          headers: getAuthHeaders(),
          cache: 'no-store'
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setFinancialData(data.data);
          }
        } else {
          console.error("Backend error:", await res.text());
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    if (user) {
      fetchOverview();
    }
  }, [user]);

  if (isAuthLoading || (isLoadingData && !financialData)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#b2f5d1] animate-spin" />
      </div>
    );
  }

  const initialData = financialData || {
    totalBalance: 0,
    youOwe: 0,
    youAreOwed: 0,
    groupsOwedCount: 0,
    friendsOwedCount: 0,
    recentBalances: []
  };

  return (
    <div className="max-w-6xl mx-auto h-full">
      <h1 className="text-3xl font-bold text-white tracking-tight mb-8">Financial Overview</h1>
      <DashboardView initialData={initialData} />
    </div>
  );
}
