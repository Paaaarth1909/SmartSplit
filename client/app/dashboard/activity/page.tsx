import React from 'react';
import { auth } from '@clerk/nextjs/server';
import RecentActivityView from './RecentActivityView';

export default async function RecentActivityPage() {
  const { getToken } = await auth();
  const token = await getToken();
  
  let activityData = null;

  try {
    const res = await fetch('http://127.0.0.1:5050/api/users/me/recent-activity', {
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: 'no-store'
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        activityData = data.data;
      }
    } else {
      console.error("Backend error:", await res.text());
    }
  } catch (error) {
    console.error("Failed to fetch activity data:", error);
  }

  if (!activityData) {
    activityData = {
      totalBalance: 0,
      youOwe: 0,
      youAreOwed: 0,
      activities: [],
      frequentConnections: []
    };
  }

  return (
    <div className="max-w-6xl mx-auto h-full">
      <RecentActivityView initialData={activityData} />
    </div>
  );
}
