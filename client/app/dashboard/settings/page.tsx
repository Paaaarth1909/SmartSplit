'use client';

import React, { useEffect, useState } from 'react';
import SettingsView from './SettingsView';
import { API_BASE, getAuthHeaders, getAuthToken } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const { user, token, isLoading: isAuthLoading } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${API_BASE}/users/me`, {
          headers: getAuthHeaders(),
          cache: 'no-store'
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setUserData(data.data);
          }
        } else {
          console.error("Backend error fetching profile:", await res.text());
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchUser();
    }
  }, [user]);

  if (isAuthLoading || (isLoading && !userData)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#b2f5d1] animate-spin" />
      </div>
    );
  }

  // Ensure default preferences exist if not populated
  if (userData && !userData.preferences) {
    userData.preferences = {
      currency: "INR",
      aiProfileOptimized: true,
      theme: "dark",
      compactDensity: false,
      liveForex: true,
      acousticFeedback: true
    };
  } else if (userData) {
    if (userData.preferences.theme === undefined) userData.preferences.theme = "dark";
    if (userData.preferences.compactDensity === undefined) userData.preferences.compactDensity = false;
    if (userData.preferences.liveForex === undefined) userData.preferences.liveForex = true;
    if (userData.preferences.acousticFeedback === undefined) userData.preferences.acousticFeedback = true;
  }

  const currentToken = token || getAuthToken();

  return (
    <div className="max-w-5xl mx-auto h-full">
      <SettingsView initialData={userData} token={currentToken} />
    </div>
  );
}
