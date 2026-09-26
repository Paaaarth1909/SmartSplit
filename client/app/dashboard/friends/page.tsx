'use client';

import React, { useEffect, useState } from 'react';
import FriendsView from './FriendsView';
import { API_BASE, getAuthHeaders, getAuthToken } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function FriendsPage() {
  const { user, token, isLoading: isAuthLoading } = useAuth();
  const [initialFriends, setInitialFriends] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${API_BASE}/users/me/friends`, {
          headers: getAuthHeaders(),
          cache: 'no-store'
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setInitialFriends(data.data || []);
          }
        } else {
          console.error("Failed to fetch friends:", await res.text());
        }
      } catch (error) {
        console.error("Failed to fetch friends:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchFriends();
    }
  }, [user]);

  if (isAuthLoading || (isLoading && initialFriends.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#b2f5d1] animate-spin" />
      </div>
    );
  }

  const currentToken = token || getAuthToken();

  return (
    <div className="max-w-5xl mx-auto h-full">
      <FriendsView initialFriends={initialFriends} token={currentToken} />
    </div>
  );
}
