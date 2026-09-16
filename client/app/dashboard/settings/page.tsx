import React from 'react';
import { auth } from '@clerk/nextjs/server';
import SettingsView from './SettingsView';

export default async function SettingsPage() {
  const { getToken } = await auth();
  const token = await getToken();
  
  let userData = null;

  try {
    const res = await fetch('http://127.0.0.1:5050/api/users/me', {
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: 'no-store'
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        userData = data.data;
      }
    } else {
      console.error("Backend error fetching profile:", await res.text());
    }
  } catch (error) {
    console.error("Failed to fetch user data:", error);
  }

  // Ensure default preferences exist if not populated
  if (userData && !userData.preferences) {
    userData.preferences = {
      currency: "USD",
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

  return (
    <div className="max-w-5xl mx-auto h-full">
      <SettingsView initialData={userData} token={token} />
    </div>
  );
}
