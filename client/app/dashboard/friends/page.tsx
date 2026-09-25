import React from 'react';

import FriendsView from './FriendsView';

export default async function FriendsPage() {
  const token = 'mock-token';

  let initialFriends = [];

  try {
    const res = await fetch('http://127.0.0.1:5050/api/users/me/friends', {
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: 'no-store'
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        initialFriends = data.data;
      }
    }
  } catch (error) {
    console.error("Failed to fetch friends:", error);
  }

  return (
    <div className="max-w-5xl mx-auto h-full">
      <FriendsView initialFriends={initialFriends} token={token} />
    </div>
  );
}
