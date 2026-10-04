'use client';

import React, { useEffect, useState } from 'react';
import RecentActivityView from './RecentActivityView';
import { API_BASE, getAuthHeaders } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function RecentActivityPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [activityData, setActivityData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${API_BASE}/users/me/recent-activity`, {
          headers: getAuthHeaders(),
          cache: 'no-store'
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setActivityData(data.data);
          }
        } else {
          console.error("Backend error:", await res.text());
        }
      } catch (error) {
        console.error("Failed to fetch activity data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchActivity();
    } else if (!isAuthLoading) {
      setIsLoading(false);
    }
  }, [user, isAuthLoading]);

  if (isAuthLoading || (isLoading && !activityData)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#b2f5d1] animate-spin" />
      </div>
    );
  }

  const initialData = {
    totalBalance: activityData?.totalBalance ?? 0,
    youOwe: activityData?.youOwe ?? 0,
    youAreOwed: activityData?.youAreOwed ?? 0,
    activities: Array.isArray(activityData?.activities)
      ? activityData.activities
      : Array.isArray(activityData?.recentActivity)
        ? activityData.recentActivity
        : [],
    recentActivity: Array.isArray(activityData?.recentActivity)
      ? activityData.recentActivity
      : Array.isArray(activityData?.activities)
        ? activityData.activities
        : [],
    frequentConnections: Array.isArray(activityData?.frequentConnections)
      ? activityData.frequentConnections
      : []
  };

  return (
    <div className="max-w-6xl mx-auto h-full">
      <RecentActivityView initialData={initialData} />
    </div>
  );
}
