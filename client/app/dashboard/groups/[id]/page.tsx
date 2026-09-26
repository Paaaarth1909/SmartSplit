'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import GroupDetailsView from './GroupDetailsView';
import { API_BASE, getAuthHeaders } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function GroupDetailsPage() {
  const params = useParams();
  const groupId = (params?.id as string) || '';
  const { user, isLoading: isAuthLoading } = useAuth();

  const [groupData, setGroupData] = useState<any>(null);
  const [initialMessages, setInitialMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroup = async () => {
      if (!groupId) return;
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch(`${API_BASE}/groups/${groupId}/details`, {
          headers: getAuthHeaders(),
          cache: 'no-store'
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setGroupData(data.data);
          }
        } else {
          const errText = await res.text();
          console.error("Backend details error:", errText);
          setError("Group not found or you don't have access.");
        }

        const msgsRes = await fetch(`${API_BASE}/groups/${groupId}/messages`, {
          headers: getAuthHeaders(),
          cache: 'no-store'
        });

        if (msgsRes.ok) {
          const msgsData = await msgsRes.json();
          if (msgsData.success) {
            setInitialMessages(msgsData.data || []);
          }
        }
      } catch (err: any) {
        console.error("Failed to fetch group details:", err);
        setError("Failed to load group details.");
      } finally {
        setIsLoading(false);
      }
    };

    if (user && groupId) {
      fetchGroup();
    }
  }, [user, groupId]);

  if (isAuthLoading || (isLoading && !groupData && !error)) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#b2f5d1] animate-spin" />
      </div>
    );
  }

  if (error || !groupData) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-6">
        <p className="text-white/50 mb-4">{error || "Group not found or you don't have access."}</p>
        <a href="/dashboard/groups" className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-semibold transition-colors">
          Back to Groups
        </a>
      </div>
    );
  }

  return (
    <div className="h-full">
      <GroupDetailsView 
        groupData={groupData} 
        initialMessages={initialMessages} 
        groupId={groupId}
        currentUserId={user?.id || ''}
        currentUserName={user?.fullName || 'Member'}
      />
    </div>
  );
}
