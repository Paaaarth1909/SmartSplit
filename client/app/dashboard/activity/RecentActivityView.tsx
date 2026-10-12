'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Utensils,
  Plane,
  CheckCircle2,
  ShoppingCart,
  Coffee,
  Activity,
  Sparkles,
  Bell,
  Check,
  X,
  UserPlus,
  Users,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { API_BASE, getAuthHeaders } from '@/lib/api';
import { useCurrency } from '@/lib/useCurrency';
import { useAuth } from '@/context/AuthContext';
import { getSocket } from '@/lib/socket';

interface RecentActivityViewProps {
  initialData?: {
    totalBalance?: number;
    youOwe?: number;
    youAreOwed?: number;
    activities?: any[];
    recentActivity?: any[];
    frequentConnections?: any[];
  };
}

export default function RecentActivityView({ initialData }: RecentActivityViewProps) {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'All' | 'You owe' | 'You are owed'>('All');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        const notifList = data.data || [];
        setNotifications(notifList);

        const activePending = notifList.find(
          (n: any) =>
            (n.status === 'PENDING' || n.status === 'PENDING_ADD') && !n.read
        );
        if (activePending && typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('notification:show_popup', { detail: activePending }));
        }
      }
    } catch (err) {}
  }, []);

  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  useEffect(() => {
    const handleReceived = () => fetchNotifs();
    const handleActionDone = () => fetchNotifs();

    if (typeof window !== 'undefined') {
      window.addEventListener('notification:received', handleReceived);
      window.addEventListener('notification:action_completed', handleActionDone);
    }

    const socket = getSocket();
    const onNotifNew = () => fetchNotifs();
    socket.on('notification:new', onNotifNew);

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('notification:received', handleReceived);
        window.removeEventListener('notification:action_completed', handleActionDone);
      }
      socket.off('notification:new', onNotifNew);
    };
  }, [fetchNotifs]);

  const handleAcceptInvite = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`${API_BASE}/notifications/${id}/accept`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(data.message || 'Request accepted');
        fetchNotifs();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('notification:action_completed', { detail: { id, action: 'accept' } }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
      setTimeout(() => setActionMessage(null), 3500);
    }
  };

  const handleRejectInvite = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`${API_BASE}/notifications/${id}/reject`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        setActionMessage('Request declined');
        fetchNotifs();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('notification:action_completed', { detail: { id, action: 'reject' } }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
      setTimeout(() => setActionMessage(null), 3500);
    }
  };

  const handleConfirmAddMember = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`${API_BASE}/notifications/${id}/confirm-add`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(data.message || 'Member added directly to your group!');
        fetchNotifs();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('notification:action_completed', { detail: { id, action: 'confirm-add' } }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
      setTimeout(() => setActionMessage(null), 3500);
    }
  };
  
  const totalBalance = Number(initialData?.totalBalance) || 0;
  const youOwe = Number(initialData?.youOwe) || 0;
  const youAreOwed = Number(initialData?.youAreOwed) || 0;
  
  const rawActivities = Array.isArray(initialData?.activities)
    ? initialData.activities
    : Array.isArray(initialData?.recentActivity)
      ? initialData.recentActivity
      : [];
      
  const frequentConnections = Array.isArray(initialData?.frequentConnections)
    ? initialData.frequentConnections
    : [];

  const { formatCurrency } = useCurrency();
  
  const filteredActivities = rawActivities.filter((act: any) => {
    if (!act) return false;
    if (filter === 'All') return true;
    if (filter === 'You owe') return act.type === 'owe';
    if (filter === 'You are owed') return act.type === 'owed';
    return true;
  });

  const getRelativeDateLabel = (dateString: string) => {
    if (!dateString) return 'OLDER';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'OLDER';

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return 'TODAY';
    if (date.toDateString() === yesterday.toDateString()) return 'YESTERDAY';
    
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    if (diffDays <= 7) return 'THIS WEEK';
    
    return 'OLDER';
  };

  const groupedActivities = filteredActivities.reduce((acc: any, act: any) => {
    const label = getRelativeDateLabel(act.date);
    if (!acc[label]) acc[label] = [];
    acc[label].push(act);
    return acc;
  }, {});

  const preferredOrder = ['TODAY', 'YESTERDAY', 'THIS WEEK', 'OLDER'];
  const groupKeys = Object.keys(groupedActivities).sort((a, b) => {
    const indexA = preferredOrder.indexOf(a);
    const indexB = preferredOrder.indexOf(b);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  const getCategoryIcon = (category: string) => {
    const lower = category?.toLowerCase() || '';
    if (lower.includes('food') || lower.includes('dinner') || lower.includes('restaurant') || lower.includes('lunch') || lower.includes('meal')) {
      return <Utensils className="w-5 h-5 text-white/50" />;
    }
    if (lower.includes('travel') || lower.includes('flight') || lower.includes('transport') || lower.includes('trip') || lower.includes('taxi')) {
      return <Plane className="w-5 h-5 text-white/50" />;
    }
    if (lower.includes('settlement') || lower.includes('payment')) {
      return <CheckCircle2 className="w-5 h-5 text-[#b2f5d1]" />;
    }
    if (lower.includes('shopping') || lower.includes('groceries')) {
      return <ShoppingCart className="w-5 h-5 text-white/50" />;
    }
    if (lower.includes('coffee') || lower.includes('drink') || lower.includes('cafe')) {
      return <Coffee className="w-5 h-5 text-white/50" />;
    }
    return <Activity className="w-5 h-5 text-white/50" />;
  };

  const renderNotificationsCard = () => (
    <div className="bg-[#121214] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-sm">
      <h3 className="text-xs font-bold text-white/50 tracking-widest uppercase mb-4 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <Bell size={14} className="text-[#b2f5d1]" /> Recent Notifications
        </span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#b2f5d1]/10 text-[#b2f5d1] border border-[#b2f5d1]/20">
          {notifications.length}
        </span>
      </h3>

      {notifications.length === 0 ? (
        <div className="text-xs text-white/30 text-center py-6">No notifications right now.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map((notif: any) => {
            const isLoading = actionLoadingId === notif._id;
            const isGroupInvite = notif.type === 'GROUP_INVITE';
            const isOwnerApproval = notif.type === 'GROUP_INVITE_ACCEPTED';
            const isGroupJoined = notif.type === 'GROUP_JOINED';
            const isFriendReq = notif.type === 'FRIEND_REQUEST';
            const isFriendAcc = notif.type === 'FRIEND_ACCEPTED';

            return (
              <div
                key={notif._id}
                className="p-3.5 bg-white/5 hover:bg-white/[0.08] transition-colors rounded-xl border border-white/10 text-xs flex flex-col gap-2.5"
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#1a1a1c] border border-white/10 flex items-center justify-center shrink-0 font-bold text-white/80 overflow-hidden aspect-square">
                    {notif.sender?.avatar ? (
                      <img src={notif.sender.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      (notif.sender?.fullName || 'U').charAt(0).toUpperCase()
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="text-white font-medium block leading-relaxed">
                      {isGroupInvite && (
                        <>
                          <strong className="text-[#b2f5d1]">{notif.sender?.fullName || 'A friend'}</strong> has requested to add you to <strong className="text-white">{notif.group?.name || 'a group'}</strong>
                        </>
                      )}

                      {isOwnerApproval && (
                        <>
                          <strong className="text-[#b2f5d1]">{notif.sender?.fullName || 'User'}</strong> has accepted your group joining request and you can add them to your group <strong className="text-white">{notif.group?.name || ''}</strong>.
                        </>
                      )}

                      {isGroupJoined && (
                        <>
                          You have joined <strong className="text-[#b2f5d1]">{notif.group?.name || 'the group'}</strong>!
                        </>
                      )}

                      {isFriendReq && (
                        <>
                          <strong className="text-[#b2f5d1]">{notif.sender?.fullName || 'Someone'}</strong> sent you a friend request.
                        </>
                      )}

                      {isFriendAcc && (
                        <>
                          <strong className="text-[#b2f5d1]">{notif.sender?.fullName || 'Someone'}</strong> accepted your friend request!
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center flex-wrap gap-2 pt-1 pl-0 sm:pl-10">
                  {isGroupInvite && notif.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleAcceptInvite(notif._id)}
                        disabled={isLoading}
                        className="bg-[#b2f5d1] hover:bg-[#9de4c2] text-black px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-[0_0_10px_rgba(178,245,209,0.2)] flex items-center gap-1"
                      >
                        {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectInvite(notif._id)}
                        disabled={isLoading}
                        className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        Decline
                      </button>
                    </>
                  )}

                  {isOwnerApproval && notif.status === 'PENDING_ADD' && (
                    <button
                      onClick={() => handleConfirmAddMember(notif._id)}
                      disabled={isLoading}
                      className="bg-[#b2f5d1] hover:bg-[#9de4c2] text-black px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(178,245,209,0.3)] flex items-center gap-1.5"
                    >
                      {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
                      Add to Group
                    </button>
                  )}

                  {isFriendReq && notif.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleAcceptInvite(notif._id)}
                        disabled={isLoading}
                        className="bg-[#b2f5d1] hover:bg-[#9de4c2] text-black px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1"
                      >
                        {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        Confirm
                      </button>
                      <button
                        onClick={() => handleRejectInvite(notif._id)}
                        disabled={isLoading}
                        className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        Decline
                      </button>
                    </>
                  )}

                  {notif.status === 'ACCEPTED' && !isOwnerApproval && (
                    <span className="text-[11px] text-[#b2f5d1] font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Accepted (Pending owner addition)
                    </span>
                  )}

                  {notif.status === 'COMPLETED' && (
                    <span className="text-[11px] text-white/40 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3 text-[#b2f5d1]" /> Completed
                    </span>
                  )}

                  {notif.status === 'REJECTED' && (
                    <span className="text-[11px] text-red-400 font-semibold">Declined</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-6 sm:gap-8 h-full relative">
      {actionMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#121214] border border-[#b2f5d1]/30 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-[#b2f5d1]" />
          <span className="text-xs font-bold">{actionMessage}</span>
        </div>
      )}

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-1.5">Recent Activity</h1>
        <p className="text-white/50 text-xs sm:text-sm">Your latest shared expenses, group invites, and settlements.</p>
      </div>

      <div className="block lg:hidden">
        {renderNotificationsCard()}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
        
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/5">
            <div>
              <h2 className="text-sm font-bold text-white tracking-wider uppercase">Expenses & Settlements</h2>
              <p className="text-xs text-white/40">Track payments, splits, and owed amounts</p>
            </div>
            <div className="flex bg-[#121214] border border-white/10 rounded-full p-1 self-start sm:self-auto">
              {(['All', 'You owe', 'You are owed'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3.5 sm:px-4 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
                    filter === f 
                      ? 'bg-white/10 text-white shadow-sm' 
                      : 'text-white/40 hover:text-white/80'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          {groupKeys.length === 0 ? (
            <div className="p-12 text-center border border-white/10 rounded-2xl bg-[#121214] text-white/40 flex flex-col items-center justify-center gap-3">
              <Sparkles className="w-8 h-8 text-white/20" />
              <p className="text-sm font-medium">No recent activity found for this filter.</p>
            </div>
          ) : (
            groupKeys.map(groupLabel => (
              <div key={groupLabel}>
                <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-3 pl-1">
                  {groupLabel}
                </h3>
                <div className="flex flex-col gap-3">
                  {groupedActivities[groupLabel].map((act: any, idx: number) => {
                    const isOwed = act.type === 'owed';
                    const isOwe = act.type === 'owe';
                    const isSettled = act.type === 'settled';

                    const displayDate = act.date
                      ? new Date(act.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })
                      : '';

                    return (
                      <div 
                        key={act.id || act._id || `act-${idx}`} 
                        className="bg-[#121214] border border-white/10 rounded-2xl p-5 flex items-center justify-between hover:border-white/20 transition-all shadow-sm"
                      >
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 pr-3">
                          <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 aspect-square ${act.isSettlement ? 'bg-[#1a2e22] border-[#b2f5d1]/20' : 'bg-[#1a1a1c] border-white/10'}`}>
                            {getCategoryIcon(act.category || act.title)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">{act.title}</h4>
                            <div className="flex items-center gap-2 text-xs text-white/50 mt-0.5 flex-wrap">
                              <span>
                                {act.isSettlement 
                                  ? act.description || act.title || 'Payment recorded' 
                                  : `${act.payerName || 'Someone'} paid ${formatCurrency(act.amount)}`}
                              </span>
                              {act.groupName && (
                                <>
                                  <span className="text-white/20">•</span>
                                  <span className="text-white/40">{act.groupName}</span>
                                </>
                              )}
                              {displayDate && (
                                <>
                                  <span className="text-white/20">•</span>
                                  <span className="text-white/40">{displayDate}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right shrink-0">
                          <div className={`text-xs font-bold mb-1 ${isOwed ? 'text-[#b2f5d1]' : isOwe ? 'text-red-400' : 'text-white/50'}`}>
                            {isOwed ? 'You get back' : isOwe ? 'You owe' : 'Payment'}
                          </div>
                          <div className={`text-2xl font-black tracking-tighter ${isOwed ? 'text-[#b2f5d1]' : isOwe ? 'text-red-400' : 'text-white'}`}>
                            {isSettled ? formatCurrency(act.amount) : formatCurrency(act.userShare)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="hidden lg:block">
            {renderNotificationsCard()}
          </div>

          <div className="bg-[#121214] border border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-sm">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
             
             <h3 className="text-xs font-bold text-white/50 tracking-widest uppercase mb-4">Total Balance</h3>
             
             <div className={`text-4xl font-extrabold tracking-tight mb-2 ${totalBalance > 0 ? 'text-[#b2f5d1]' : totalBalance < 0 ? 'text-red-400' : 'text-white'}`}>
               {totalBalance > 0 ? `+${formatCurrency(totalBalance)}` : totalBalance < 0 ? `-${formatCurrency(totalBalance)}` : formatCurrency(0)}
             </div>
             <p className="text-xs font-medium text-white/50 mb-8">
               {totalBalance > 0 ? 'People owe you' : totalBalance < 0 ? 'You owe people' : 'All settled up'}
             </p>
             
             <div className="flex flex-col gap-3 pt-6 border-t border-white/5">
               <div className="flex justify-between items-center text-sm font-medium">
                 <span className="text-white/60">You owe</span>
                 <span className="text-red-400 font-bold">{formatCurrency(youOwe)}</span>
               </div>
               <div className="flex justify-between items-center text-sm font-medium">
                 <span className="text-white/60">You are owed</span>
                 <span className="text-[#b2f5d1] font-bold">{formatCurrency(youAreOwed)}</span>
               </div>
             </div>
          </div>

          <div className="bg-[#121214] border border-white/10 rounded-2xl p-6 shadow-sm">
             <h3 className="text-xs font-bold text-white/50 tracking-widest uppercase mb-6">Frequent Connections</h3>
             
             <div className="flex flex-col gap-4">
               {frequentConnections.length === 0 ? (
                 <div className="text-white/40 text-xs text-center py-4">No frequent connections yet.</div>
               ) : (
                 frequentConnections.map((conn: any, i: number) => {
                   const netBal = Number(conn.netBalance) || 0;
                   const isOwed = netBal > 0;
                   const isOwe = netBal < 0;
                   const name = conn.name || 'Friend';
                   
                   return (
                     <div key={i} className="flex items-center justify-between group gap-3">
                       <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                         <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-[10px] font-bold text-white/70 bg-[#1a1a1c] group-hover:border-white/30 transition-colors">
                           {name.charAt(0).toUpperCase()}
                         </div>
                         <span className="text-sm font-semibold text-white/90 truncate min-w-0">{name}</span>
                       </div>
                       <div className={`text-xs font-bold ${isOwed ? 'text-[#b2f5d1]' : isOwe ? 'text-red-400' : 'text-white/40'}`}>
                         {isOwed ? `+${formatCurrency(netBal)}` : isOwe ? `-${formatCurrency(netBal)}` : 'Settled'}
                       </div>
                     </div>
                   );
                 })
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
