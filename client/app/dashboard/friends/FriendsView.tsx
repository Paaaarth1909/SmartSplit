'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  UserPlus,
  UserMinus,
  UserCheck,
  Clock,
  Check,
  X,
  Users,
  Bell,
  Sparkles,
  Loader2,
  AlertTriangle,
  Send,
  ShieldCheck
} from 'lucide-react';
import { API_BASE, getAuthHeaders } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { getSocket } from '@/lib/socket';

interface FriendsViewProps {
  initialFriends: any[];
  token?: string | null;
}

interface UserSearchResult {
  _id: string;
  fullName: string;
  preferredName?: string;
  avatar?: string;
  relationshipStatus: 'FRIENDS' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'NONE';
  requestId?: string;
}

interface FriendItem {
  _id: string;
  fullName: string;
  preferredName?: string;
  avatar?: string;
}

export default function FriendsView({ initialFriends }: FriendsViewProps) {
  const { user } = useAuth();
  const [friends, setFriends] = useState<FriendItem[]>(initialFriends || []);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'find'>('friends');
  const [requestsSubTab, setRequestsSubTab] = useState<'incoming' | 'outgoing'>('incoming');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);
  const [unfriendConfirmUser, setUnfriendConfirmUser] = useState<FriendItem | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 3500);
  };

  const fetchFriendRequests = useCallback(async () => {
    try {
      setIsLoadingRequests(true);
      const res = await fetch(`${API_BASE}/users/me/friend-requests`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setIncomingRequests(json.data.incoming || []);
          setOutgoingRequests(json.data.outgoing || []);
        }
      }
    } catch (err) {
      console.error('Failed to load friend requests:', err);
    } finally {
      setIsLoadingRequests(false);
    }
  }, []);

  const fetchFriends = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/users/me/friends`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setFriends(json.data || []);
        }
      }
    } catch (err) {
      console.error('Failed to fetch friends:', err);
    }
  }, []);

  useEffect(() => {
    fetchFriendRequests();
  }, [fetchFriendRequests]);

  useEffect(() => {
    const socket = getSocket();
    const currentUserId = user?.id;

    if (currentUserId) {
      socket.emit('join-user', currentUserId);
    }

    const handleStatusChange = (data: { userId: string; status: string; requestId?: string }) => {
      fetchFriends();
      fetchFriendRequests();

      setSearchResults(prev =>
        prev.map(item => {
          if (item._id === data.userId) {
            return {
              ...item,
              relationshipStatus: data.status as any,
              requestId: data.requestId || item.requestId,
            };
          }
          return item;
        })
      );
    };

    const handleNewNotification = (notif: any) => {
      if (notif.type === 'FRIEND_REQUEST' || notif.type === 'FRIEND_ACCEPTED') {
        fetchFriendRequests();
        fetchFriends();
      }
    };

    socket.on('friend:status-change', handleStatusChange);
    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('friend:status-change', handleStatusChange);
      socket.off('notification:new', handleNewNotification);
    };
  }, [user?.id, fetchFriends, fetchFriendRequests]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`${API_BASE}/users/search?q=${encodeURIComponent(searchQuery.trim())}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setSearchResults(json.data || []);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const timer = setTimeout(() => {
        handleSearch();
      }, 300);
      return () => clearTimeout(timer);
    } else if (searchQuery.trim().length === 0) {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleSendRequest = async (targetUserId: string, targetName: string) => {
    setLoadingActionId(targetUserId);
    try {
      const res = await fetch(`${API_BASE}/users/friends/request/${targetUserId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showFeedback(`Friend request sent to ${targetName}`);
        setSearchResults(prev =>
          prev.map(u =>
            u._id === targetUserId
              ? { ...u, relationshipStatus: data.status || 'REQUEST_SENT', requestId: data.requestId }
              : u
          )
        );
        fetchFriendRequests();
      } else {
        showFeedback(data.error || 'Failed to send friend request', 'error');
      }
    } catch (err: any) {
      showFeedback('Network error while sending request', 'error');
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleCancelRequest = async (targetUserId: string, targetName?: string) => {
    setLoadingActionId(targetUserId);
    try {
      const res = await fetch(`${API_BASE}/users/friends/cancel/${targetUserId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showFeedback(`Cancelled request${targetName ? ` for ${targetName}` : ''}`);
        setSearchResults(prev =>
          prev.map(u => (u._id === targetUserId ? { ...u, relationshipStatus: 'NONE' } : u))
        );
        setOutgoingRequests(prev => prev.filter(r => (r.recipient?._id || r.recipient) !== targetUserId));
      } else {
        showFeedback(data.error || 'Failed to cancel request', 'error');
      }
    } catch (err) {
      showFeedback('Network error while cancelling request', 'error');
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleAcceptRequest = async (senderIdOrRequestId: string, senderName?: string) => {
    setLoadingActionId(senderIdOrRequestId);
    try {
      const res = await fetch(`${API_BASE}/users/friends/accept/${senderIdOrRequestId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showFeedback(`Accepted ${senderName ? `${senderName}'s ` : ''}friend request!`);
        fetchFriends();
        fetchFriendRequests();
        setSearchResults(prev =>
          prev.map(u =>
            u._id === senderIdOrRequestId ? { ...u, relationshipStatus: 'FRIENDS' } : u
          )
        );
      } else {
        showFeedback(data.error || 'Failed to accept friend request', 'error');
      }
    } catch (err) {
      showFeedback('Network error while accepting request', 'error');
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleRejectRequest = async (senderIdOrRequestId: string, senderName?: string) => {
    setLoadingActionId(senderIdOrRequestId);
    try {
      const res = await fetch(`${API_BASE}/users/friends/reject/${senderIdOrRequestId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showFeedback(`Declined ${senderName ? `${senderName}'s ` : ''}friend request`);
        setIncomingRequests(prev =>
          prev.filter(r => (r.sender?._id || r.sender) !== senderIdOrRequestId && r._id !== senderIdOrRequestId)
        );
        setSearchResults(prev =>
          prev.map(u => (u._id === senderIdOrRequestId ? { ...u, relationshipStatus: 'NONE' } : u))
        );
      } else {
        showFeedback(data.error || 'Failed to decline request', 'error');
      }
    } catch (err) {
      showFeedback('Network error while declining request', 'error');
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleUnfriend = async () => {
    if (!unfriendConfirmUser) return;
    const friendId = unfriendConfirmUser._id;
    setLoadingActionId(friendId);

    try {
      const res = await fetch(`${API_BASE}/users/friends/${friendId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showFeedback(`Removed ${unfriendConfirmUser.fullName} from friends`);
        setFriends(prev => prev.filter(f => f._id !== friendId));
        setSearchResults(prev =>
          prev.map(u => (u._id === friendId ? { ...u, relationshipStatus: 'NONE' } : u))
        );
        setUnfriendConfirmUser(null);
      } else {
        showFeedback(data.error || 'Failed to unfriend user', 'error');
      }
    } catch (err) {
      showFeedback('Network error while unfriending user', 'error');
    } finally {
      setLoadingActionId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full pb-12">
      {feedbackMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md border animate-in slide-in-from-bottom-5 duration-200 ${
            feedbackMessage.type === 'success'
              ? 'bg-[#121214]/90 border-[#b2f5d1]/30 text-white'
              : 'bg-red-950/90 border-red-500/30 text-red-200'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <ShieldCheck className="w-5 h-5 text-[#b2f5d1]" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-400" />
          )}
          <span className="text-sm font-semibold">{feedbackMessage.text}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Friends & Network</h1>
          <p className="text-white/50 text-sm mt-1">
            Connect with friends securely. Only friends can be added to your shared expense groups.
          </p>
        </div>

        <div className="flex bg-[#121214] border border-white/10 rounded-2xl p-1.5 self-start md:self-auto shadow-inner">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'friends'
                ? 'bg-white/10 text-white shadow-md border border-white/10'
                : 'text-white/40 hover:text-white/80'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Friends</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-[#1a2e22] text-[#b2f5d1] border border-[#b2f5d1]/30">
              {friends.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer relative ${
              activeTab === 'requests'
                ? 'bg-white/10 text-white shadow-md border border-white/10'
                : 'text-white/40 hover:text-white/80'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Requests</span>
            {incomingRequests.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500 text-black font-extrabold shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                {incomingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('find')}
            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'find'
                ? 'bg-[#b2f5d1] text-black shadow-md font-extrabold'
                : 'text-white/40 hover:text-white/80'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Find Friends</span>
          </button>
        </div>
      </div>

      {activeTab === 'friends' && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>My Friends</span>
              <span className="text-xs text-white/40 font-normal">({friends.length} total)</span>
            </h2>

            <button
              onClick={() => setActiveTab('find')}
              className="flex items-center gap-2 px-4 py-2 bg-[#b2f5d1]/10 hover:bg-[#b2f5d1]/20 text-[#b2f5d1] rounded-xl text-xs font-bold border border-[#b2f5d1]/20 transition-all cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add New Friend</span>
            </button>
          </div>

          {friends.length === 0 ? (
            <div className="bg-[#121214] border border-white/10 rounded-3xl p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-3xl bg-[#1a1a1c] border border-white/10 flex items-center justify-center mb-4 text-[#b2f5d1]/40">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">No friends yet</h3>
              <p className="text-xs text-white/40 max-w-sm mb-6">
                Search users and send friend requests to build your network. Only mutual friends can be added to your split groups.
              </p>
              <button
                onClick={() => setActiveTab('find')}
                className="bg-[#b2f5d1] hover:bg-[#9de4c2] text-black px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-[0_0_20px_rgba(178,245,209,0.2)] flex items-center gap-2 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Search People</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {friends.map(friend => (
                <div
                  key={friend._id}
                  className="bg-[#121214] border border-white/10 hover:border-white/20 rounded-2xl p-5 flex items-center justify-between gap-4 transition-all group shadow-sm"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-full bg-[#1a1a1c] border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                      {friend.avatar ? (
                        <img src={friend.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-extrabold text-[#b2f5d1]">
                          {(friend.fullName || 'U').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-white truncate group-hover:text-[#b2f5d1] transition-colors">
                        {friend.fullName}
                      </h4>
                      <span className="inline-flex items-center gap-1 text-[11px] text-white/40">
                        <UserCheck className="w-3 h-3 text-[#b2f5d1]" /> Friend
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setUnfriendConfirmUser(friend)}
                    disabled={loadingActionId === friend._id}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-white/30 border border-white/5 hover:border-red-500/20 transition-all cursor-pointer shrink-0"
                    title="Unfriend"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex gap-2">
              <button
                onClick={() => setRequestsSubTab('incoming')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                  requestsSubTab === 'incoming'
                    ? 'bg-white/10 text-white border border-white/10'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                <span>Received</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/10 text-white">
                  {incomingRequests.length}
                </span>
              </button>

              <button
                onClick={() => setRequestsSubTab('outgoing')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                  requestsSubTab === 'outgoing'
                    ? 'bg-white/10 text-white border border-white/10'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                <span>Sent</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/10 text-white">
                  {outgoingRequests.length}
                </span>
              </button>
            </div>
          </div>

          {requestsSubTab === 'incoming' && (
            <div>
              {incomingRequests.length === 0 ? (
                <div className="bg-[#121214] border border-white/10 rounded-3xl p-12 flex flex-col items-center justify-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#1a1a1c] border border-white/10 flex items-center justify-center mb-3 text-white/30">
                    <Bell className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">No incoming requests</h3>
                  <p className="text-xs text-white/40">When users send you a friend request, they will appear here.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {incomingRequests.map(req => {
                    const sender = req.sender || {};
                    return (
                      <div
                        key={req._id}
                        className="bg-[#121214] border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <div className="w-12 h-12 rounded-full bg-[#1a1a1c] border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                            {sender.avatar ? (
                              <img src={sender.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-sm font-bold text-[#b2f5d1]">
                                {(sender.fullName || 'U').charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-bold text-white truncate">{sender.fullName}</h4>
                            <p className="text-xs text-white/40 mt-0.5">Wants to add you as a friend</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleAcceptRequest(sender._id || req._id, sender.fullName)}
                            disabled={loadingActionId === (sender._id || req._id)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-[#b2f5d1] hover:bg-[#9de4c2] text-black rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(178,245,209,0.2)]"
                          >
                            {loadingActionId === (sender._id || req._id) ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            Confirm
                          </button>

                          <button
                            onClick={() => handleRejectRequest(sender._id || req._id, sender.fullName)}
                            disabled={loadingActionId === (sender._id || req._id)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer border border-white/10"
                          >
                            <X className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {requestsSubTab === 'outgoing' && (
            <div>
              {outgoingRequests.length === 0 ? (
                <div className="bg-[#121214] border border-white/10 rounded-3xl p-12 flex flex-col items-center justify-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#1a1a1c] border border-white/10 flex items-center justify-center mb-3 text-white/30">
                    <Send className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">No sent requests</h3>
                  <p className="text-xs text-white/40">You don't have any pending friend requests sent to others.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {outgoingRequests.map(req => {
                    const recipient = req.recipient || {};
                    return (
                      <div
                        key={req._id}
                        className="bg-[#121214] border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <div className="w-12 h-12 rounded-full bg-[#1a1a1c] border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                            {recipient.avatar ? (
                              <img src={recipient.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-sm font-bold text-white/70">
                                {(recipient.fullName || 'U').charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-bold text-white truncate">{recipient.fullName}</h4>
                            <span className="inline-flex items-center gap-1 text-xs text-white/40 mt-0.5">
                              <Clock className="w-3 h-3 text-[#b2f5d1]" /> Request Pending
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleCancelRequest(recipient._id || req._id, recipient.fullName)}
                          disabled={loadingActionId === (recipient._id || req._id)}
                          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-white/60 text-xs font-bold border border-white/10 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {loadingActionId === (recipient._id || req._id) ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <X className="w-3.5 h-3.5" />
                          )}
                          Cancel Request
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'find' && (
        <div className="flex flex-col gap-6">
          <div className="bg-[#121214] border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col gap-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#b2f5d1]/5 rounded-full blur-[80px] pointer-events-none" />

            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#b2f5d1]" /> Find Friends
              </h2>
              <p className="text-xs text-white/50 mt-1">
                Search by name to discover people. User emails and gmails are strictly private and kept hidden.
              </p>
            </div>

            <form onSubmit={handleSearch} className="relative flex items-center">
              <input
                type="text"
                placeholder="Search people by name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full bg-[#1a1a1c] border border-white/10 rounded-2xl py-4 pl-12 pr-32 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#b2f5d1]/50 transition-all shadow-inner"
              />
              <Search className="absolute left-4 w-5 h-5 text-white/40" />

              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="absolute right-2.5 bg-[#b2f5d1] hover:bg-[#9de4c2] text-black px-5 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-[0_0_15px_rgba(178,245,209,0.2)] cursor-pointer"
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
              </button>
            </form>

            {searchQuery.trim().length > 0 && (
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex items-center justify-between text-xs font-bold text-white/40 uppercase tracking-widest px-1">
                  <span>Search Results</span>
                  {searchResults.length > 0 && <span>{searchResults.length} found</span>}
                </div>

                {isSearching ? (
                  <div className="py-12 flex flex-col items-center justify-center text-white/40 gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-[#b2f5d1]" />
                    <span className="text-xs font-bold tracking-widest uppercase">Searching users...</span>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center text-white/40">
                    <p className="text-sm font-semibold">No users found for &quot;{searchQuery}&quot;</p>
                    <p className="text-xs text-white/30 mt-1">Make sure the name is spelled correctly.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {searchResults.map(result => {
                      const status = result.relationshipStatus;
                      const isLoading = loadingActionId === result._id;

                      return (
                        <div
                          key={result._id}
                          className="flex items-center justify-between p-4 bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl transition-all gap-4"
                        >
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <div className="w-12 h-12 rounded-full bg-[#1a1a1c] border border-white/10 flex items-center justify-center overflow-hidden shrink-0 aspect-square shadow-inner">
                              {result.avatar ? (
                                <img src={result.avatar} alt="Avatar" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-sm font-extrabold text-[#b2f5d1]">
                                  {(result.fullName || 'U').charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-bold text-white truncate">{result.fullName}</h4>
                              <p className="text-[11px] text-white/40 mt-0.5">
                                {status === 'FRIENDS'
                                  ? 'Connected Friend'
                                  : status === 'REQUEST_SENT'
                                  ? 'Request Sent'
                                  : status === 'REQUEST_RECEIVED'
                                  ? 'Sent you a request'
                                  : 'SmartSplit User'}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            {status === 'FRIENDS' && (
                              <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#1a2e22] text-[#b2f5d1] text-xs font-bold border border-[#b2f5d1]/30">
                                  <UserCheck className="w-3.5 h-3.5" /> Friends
                                </span>
                              </div>
                            )}

                            {status === 'REQUEST_SENT' && (
                              <button
                                onClick={() => handleCancelRequest(result._id, result.fullName)}
                                disabled={isLoading}
                                className="group/btn flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 text-white/70 rounded-xl text-xs font-bold border border-white/10 transition-all cursor-pointer disabled:opacity-50"
                              >
                                {isLoading ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Clock className="w-3.5 h-3.5 text-[#b2f5d1] group-hover/btn:hidden" />
                                )}
                                <span className="group-hover/btn:hidden">Requested</span>
                                <span className="hidden group-hover/btn:inline">Cancel</span>
                              </button>
                            )}

                            {status === 'REQUEST_RECEIVED' && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleAcceptRequest(result._id, result.fullName)}
                                  disabled={isLoading}
                                  className="flex items-center gap-1 px-3.5 py-2 bg-[#b2f5d1] hover:bg-[#9de4c2] text-black rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                                >
                                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                  Confirm
                                </button>
                                <button
                                  onClick={() => handleRejectRequest(result._id, result.fullName)}
                                  disabled={isLoading}
                                  className="p-2 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-xl text-xs transition-all cursor-pointer border border-white/10"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}

                            {status === 'NONE' && (
                              <button
                                onClick={() => handleSendRequest(result._id, result.fullName)}
                                disabled={isLoading}
                                className="flex items-center gap-1.5 px-4 py-2 bg-[#b2f5d1] hover:bg-[#9de4c2] text-black rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(178,245,209,0.2)]"
                              >
                                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                                Add Friend
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {unfriendConfirmUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setUnfriendConfirmUser(null)}
        >
          <div
            className="bg-[#121214] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mb-4">
              <UserMinus className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-bold text-white mb-2">Unfriend {unfriendConfirmUser.fullName}?</h3>
            <p className="text-xs text-white/40 mb-6">
              Are you sure you want to remove this user from your friends? You will not be able to add them to future groups until you become friends again.
            </p>

            <div className="flex items-center gap-3 w-full">
              <button
                onClick={() => setUnfriendConfirmUser(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleUnfriend}
                disabled={loadingActionId === unfriendConfirmUser._id}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loadingActionId === unfriendConfirmUser._id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Yes, Unfriend'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
