'use client';

import React, { useEffect, useState } from 'react';
import GroupsList from './GroupsList';
import { API_BASE, getAuthHeaders } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function GroupsPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [groupsData, setGroupsData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/users/me/groups`, {
        headers: getAuthHeaders(),
        cache: 'no-store'
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setGroupsData(data.data || []);
        }
      } else {
        console.error("Backend error:", await res.text());
      }
    } catch (error) {
      console.error("Failed to fetch groups data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchGroups();
    }
  }, [user]);

  if (isAuthLoading || (isLoading && groupsData.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#b2f5d1] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <GroupsList initialGroups={groupsData} />
    </div>
  );
}
