import React from 'react';
import { auth } from '@clerk/nextjs/server';
import GroupsList from './GroupsList';

export default async function GroupsPage() {
  const { getToken } = await auth();
  const token = await getToken();

  let groupsData = [];

  try {
    const res = await fetch('http://127.0.0.1:5050/api/users/me/groups', {
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: 'no-store'
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        groupsData = data.data;
      }
    } else {
      console.error("Backend error:", await res.text());
    }
  } catch (error) {
    console.error("Failed to fetch groups data:", error);
  }

  return (
    <div className="max-w-6xl mx-auto">
      <GroupsList initialGroups={groupsData} />
    </div>
  );
}
