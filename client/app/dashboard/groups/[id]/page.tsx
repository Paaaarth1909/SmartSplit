import React from 'react';
import { auth, currentUser } from '@clerk/nextjs/server';
import GroupDetailsView from './GroupDetailsView';

export default async function GroupDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { getToken } = await auth();
  const token = await getToken();
  const user = await currentUser();
  
  const userId = user?.id || '';
  const userName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Member';

  let groupData = null;
  let initialMessages = [];

  try {
    const res = await fetch(`http://127.0.0.1:5050/api/groups/${params.id}/details`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: 'no-store'
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        groupData = data.data;
      }
    } else {
      console.error("Backend details error:", await res.text());
    }

    const msgsRes = await fetch(`http://127.0.0.1:5050/api/groups/${params.id}/messages`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: 'no-store'
    });

    if (msgsRes.ok) {
      const msgsData = await msgsRes.json();
      if (msgsData.success) {
        initialMessages = msgsData.data;
      }
    }
  } catch (error) {
    console.error("Failed to fetch group details:", error);
  }

  if (!groupData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-white/50">Group not found or you don't have access.</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      <GroupDetailsView 
        groupData={groupData} 
        initialMessages={initialMessages} 
        groupId={params.id}
        currentUserId={userId}
        currentUserName={userName}
      />
    </div>
  );
}
