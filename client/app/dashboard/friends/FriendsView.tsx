'use client';

import React, { useState } from 'react';
import { Search, UserPlus, UserMinus, UserCircle2, Loader2 } from 'lucide-react';

interface FriendsViewProps {
  initialFriends: any[];
  token: string | null;
}

export default function FriendsView({ initialFriends, token }: FriendsViewProps) {
  const [friends, setFriends] = useState(initialFriends);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`http://127.0.0.1:5050/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.data);
      }
    } catch (error) {
      console.error("Search error:", error);
    }
    setIsSearching(false);
  };

  const handleAddFriend = async (friendId: string, name: string) => {
    setLoadingActionId(friendId);
    try {
      const res = await fetch(`http://127.0.0.1:5050/api/users/friends/${friendId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        // Refresh friends list
        const refreshRes = await fetch('http://127.0.0.1:5050/api/users/me/friends', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setFriends(data.data);
          // Remove from search results
          setSearchResults(prev => prev.filter(u => u._id !== friendId));
        }
      }
    } catch (error) {
      console.error("Add friend error:", error);
    }
    setLoadingActionId(null);
  };

  const handleRemoveFriend = async (friendId: string) => {
    setLoadingActionId(friendId);
    try {
      const res = await fetch(`http://127.0.0.1:5050/api/users/friends/${friendId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        setFriends(prev => prev.filter(f => f._id !== friendId));
      }
    } catch (error) {
      console.error("Remove friend error:", error);
    }
    setLoadingActionId(null);
  };

  return (
    <div className="flex flex-col gap-8 h-full pb-10">
      
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Network & Friends</h1>
        <p className="text-white/50 text-sm">Add users to your network to seamlessly include them in your future group ledgers and split groups.</p>
      </div>

      {/* Search Bar & Results */}
      <div className="bg-[#121214] border border-white/10 rounded-3xl p-8 flex flex-col gap-6">
        <h3 className="text-base font-bold text-white tracking-tight">Find Users</h3>
        
        <form onSubmit={handleSearch} className="relative flex items-center">
          <input 
            type="text" 
            placeholder="Search by name or email address..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1a1a1c] border border-white/10 rounded-xl py-4 pl-12 pr-32 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#b2f5d1]/50 transition-colors"
          />
          <Search className="absolute left-4 w-5 h-5 text-white/30" />
          <button 
            type="submit" 
            disabled={isSearching || !searchQuery.trim()}
            className="absolute right-2 bg-[#b2f5d1] hover:bg-[#9de4c2] text-black px-6 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
          </button>
        </form>

        {searchResults.length > 0 && (
          <div className="flex flex-col gap-3 mt-4">
            <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Search Results</h4>
            {searchResults.map((user) => (
              <div key={user._id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#1a1a1c] border border-white/10 flex items-center justify-center overflow-hidden">
                    {user.avatar ? (
                      <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <UserCircle2 className="w-6 h-6 text-white/40" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{user.fullName}</h4>
                    <p className="text-xs text-white/40">{user.email}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleAddFriend(user._id, user.fullName)}
                  disabled={loadingActionId === user._id}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {loadingActionId === user._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  Add Friend
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Friends List */}
      <div className="bg-[#121214] border border-white/10 rounded-3xl p-8 flex flex-col gap-6">
        <h3 className="text-base font-bold text-white tracking-tight flex items-center justify-between">
          <span>My Friends</span>
          <span className="text-xs font-medium px-2.5 py-1 bg-[#1a2e22] text-[#b2f5d1] rounded-md border border-[#b2f5d1]/20">
            {friends.length} {friends.length === 1 ? 'Friend' : 'Friends'}
          </span>
        </h3>

        {friends.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <UserPlus className="w-8 h-8 text-white/20" />
            </div>
            <h4 className="text-sm font-bold text-white mb-2">No friends yet</h4>
            <p className="text-xs text-white/40 max-w-sm">Search for users above to add them to your network. You can only create groups with users who are your friends.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {friends.map((friend) => (
              <div key={friend._id} className="flex items-center justify-between p-4 bg-[#1a1a1c] border border-white/5 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#0a0a0a] border border-[#b2f5d1]/20 flex items-center justify-center text-[#b2f5d1] font-bold overflow-hidden shadow-[0_0_15px_rgba(178,245,209,0.1)]">
                    {friend.avatar ? (
                      <img src={friend.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      friend.fullName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{friend.fullName}</h4>
                    <p className="text-xs text-white/40">{friend.email}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleRemoveFriend(friend._id)}
                  disabled={loadingActionId === friend._id}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-red-500/10 hover:text-red-400 flex items-center justify-center text-white/40 transition-colors disabled:opacity-50"
                  title="Remove Friend"
                >
                  {loadingActionId === friend._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserMinus className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
