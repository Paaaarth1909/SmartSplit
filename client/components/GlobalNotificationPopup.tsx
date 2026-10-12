'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, X, UserPlus, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getSocket } from '@/lib/socket';
import { API_BASE, getAuthHeaders } from '@/lib/api';

export default function GlobalNotificationPopup() {
  const { user } = useAuth();
  const router = useRouter();
  const [popupNotification, setPopupNotification] = useState<any | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  const playNotificationSound = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
          }
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
          gain.gain.setValueAtTime(0.18, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.22);
        }
      }
    } catch (_) {}
  }, []);

  const showPopup = useCallback((notif: any, playAudio = true) => {
    if (!notif) return;
    if (playAudio) {
      playNotificationSound();
    }
    setPopupNotification(notif);

    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
    }
    dismissTimerRef.current = setTimeout(() => {
      setPopupNotification(null);
    }, 12000);
  }, [playNotificationSound]);

  useEffect(() => {
    const socket = getSocket();
    const currentUserId = user?.id || (user as any)?._id;

    const joinRoom = (uid?: string) => {
      const idToJoin = uid || currentUserId;
      if (idToJoin) {
        socket.emit('join-user', String(idToJoin));
      }
    };

    if (currentUserId) {
      joinRoom(currentUserId);
    }

    const onConnect = () => {
      if (currentUserId) joinRoom(currentUserId);
    };

    const onReconnect = () => {
      if (currentUserId) joinRoom(currentUserId);
    };

    socket.on('connect', onConnect);
    socket.on('reconnect', onReconnect);

    const handleNewNotification = (notif: any) => {
      showPopup(notif, true);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('notification:received', { detail: notif }));
      }
    };

    socket.on('notification:new', handleNewNotification);

    const handleManualShow = (e: any) => {
      if (e.detail) {
        showPopup(e.detail, false);
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('notification:show_popup', handleManualShow);
    }

    return () => {
      socket.off('notification:new', handleNewNotification);
      socket.off('connect', onConnect);
      socket.off('reconnect', onReconnect);
      if (typeof window !== 'undefined') {
        window.removeEventListener('notification:show_popup', handleManualShow);
      }
    };
  }, [user, showPopup]);

  const handleAccept = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`${API_BASE}/notifications/${id}/accept`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(data.message || 'Request accepted!');
        setPopupNotification(null);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('notification:action_completed', { detail: { id, action: 'accept' } }));
        }
      }
    } catch (err) {
      console.error('Accept error:', err);
    } finally {
      setActionLoadingId(null);
      setTimeout(() => setActionMessage(null), 3500);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`${API_BASE}/notifications/${id}/reject`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        setActionMessage('Request declined');
        setPopupNotification(null);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('notification:action_completed', { detail: { id, action: 'reject' } }));
        }
      }
    } catch (err) {
      console.error('Reject error:', err);
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
        setActionMessage(data.message || 'Member added directly to group!');
        setPopupNotification(null);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('notification:action_completed', { detail: { id, action: 'confirm-add' } }));
        }
      }
    } catch (err) {
      console.error('Confirm add error:', err);
    } finally {
      setActionLoadingId(null);
      setTimeout(() => setActionMessage(null), 3500);
    }
  };

  return (
    <>
      {actionMessage && (
        <div className="fixed bottom-6 right-6 z-[1000] bg-[#121214] border border-[#b2f5d1]/40 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <Check className="w-4 h-4 text-[#b2f5d1]" />
          <span className="text-xs font-bold">{actionMessage}</span>
        </div>
      )}

      {popupNotification && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed top-4 left-3 right-3 sm:left-auto sm:right-6 sm:top-6 sm:max-w-md z-[999] bg-[#121214]/95 border border-[#b2f5d1]/60 rounded-2xl p-4 sm:p-5 shadow-[0_12px_40px_rgba(0,0,0,0.85),0_0_30px_rgba(178,245,209,0.25)] backdrop-blur-xl animate-in slide-in-from-top-4 duration-300"
        >
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2 text-[#b2f5d1] text-xs font-black uppercase tracking-wider">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#b2f5d1] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#b2f5d1]"></span>
              </span>
              <Bell className="w-4 h-4 animate-bounce" />
              <span>New Notification</span>
            </div>
            <button
              onClick={() => setPopupNotification(null)}
              className="text-white/40 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 mb-3.5">
            <div className="w-10 h-10 rounded-full bg-[#1a1a1c] border border-white/10 flex items-center justify-center shrink-0 font-bold text-white/80 overflow-hidden aspect-square">
              {popupNotification.sender?.avatar ? (
                <img
                  src={popupNotification.sender.avatar}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                (popupNotification.sender?.fullName || 'U').charAt(0).toUpperCase()
              )}
            </div>
            <p className="text-xs sm:text-sm font-semibold text-white leading-snug min-w-0 flex-1 break-words">
              {popupNotification.type === 'GROUP_INVITE'
                ? `${popupNotification.sender?.fullName || 'A friend'} has requested to add you to ${popupNotification.group?.name || 'a group'}`
                : popupNotification.type === 'GROUP_INVITE_ACCEPTED'
                ? `${popupNotification.sender?.fullName || 'User'} has accepted your group joining request and you can add them to your group!`
                : popupNotification.type === 'FRIEND_REQUEST'
                ? `${popupNotification.sender?.fullName || 'Someone'} sent you a friend request`
                : popupNotification.type === 'FRIEND_ACCEPTED'
                ? `${popupNotification.sender?.fullName || 'Someone'} accepted your friend request!`
                : `${popupNotification.sender?.fullName || 'Someone'} joined your group`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {popupNotification.type === 'GROUP_INVITE' && popupNotification.status === 'PENDING' && (
              <>
                <button
                  onClick={() => handleAccept(popupNotification._id)}
                  disabled={actionLoadingId === popupNotification._id}
                  className="flex-1 py-2 bg-[#b2f5d1] hover:bg-[#9de4c2] text-black font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(178,245,209,0.3)] disabled:opacity-50"
                >
                  {actionLoadingId === popupNotification._id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  Accept Request
                </button>
                <button
                  onClick={() => handleReject(popupNotification._id)}
                  disabled={actionLoadingId === popupNotification._id}
                  className="py-2 px-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Decline
                </button>
              </>
            )}

            {popupNotification.type === 'GROUP_INVITE_ACCEPTED' && popupNotification.status === 'PENDING_ADD' && (
              <button
                onClick={() => handleConfirmAddMember(popupNotification._id)}
                disabled={actionLoadingId === popupNotification._id}
                className="w-full py-2 bg-[#b2f5d1] hover:bg-[#9de4c2] text-black font-black text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(178,245,209,0.3)] disabled:opacity-50"
              >
                {actionLoadingId === popupNotification._id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UserPlus className="w-3.5 h-3.5" />
                )}
                Add to Group Now
              </button>
            )}

            {popupNotification.type === 'FRIEND_REQUEST' && popupNotification.status === 'PENDING' && (
              <>
                <button
                  onClick={() => handleAccept(popupNotification._id)}
                  disabled={actionLoadingId === popupNotification._id}
                  className="flex-1 py-2 bg-[#b2f5d1] hover:bg-[#9de4c2] text-black font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {actionLoadingId === popupNotification._id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  Confirm Friend
                </button>
                <button
                  onClick={() => handleReject(popupNotification._id)}
                  disabled={actionLoadingId === popupNotification._id}
                  className="py-2 px-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Decline
                </button>
              </>
            )}

            {(popupNotification.status === 'COMPLETED' ||
              popupNotification.type === 'FRIEND_ACCEPTED' ||
              popupNotification.type === 'GROUP_JOINED') && (
              <div className="flex items-center gap-2 w-full">
                <button
                  onClick={() => {
                    setPopupNotification(null);
                    router.push('/dashboard/activity');
                  }}
                  className="flex-1 py-2 bg-[#b2f5d1]/20 hover:bg-[#b2f5d1]/30 text-[#b2f5d1] font-bold text-xs rounded-xl transition-colors cursor-pointer text-center"
                >
                  View Activity
                </button>
                <button
                  onClick={() => setPopupNotification(null)}
                  className="py-2 px-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
