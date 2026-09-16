'use client';

import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Send, Paperclip, Plus } from 'lucide-react';
import Image from 'next/image';

interface GroupDetailsViewProps {
  groupData: any;
  initialMessages: any[];
  groupId: string;
  currentUserId: string;
  currentUserName: string;
}

export default function GroupDetailsView({ 
  groupData, 
  initialMessages, 
  groupId, 
  currentUserId,
  currentUserName
}: GroupDetailsViewProps) {
  const [messages, setMessages] = useState<any[]>(initialMessages);
  const [chatInput, setChatInput] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { group, balances, settlements, distribution } = groupData;

  useEffect(() => {
    const newSocket = io('http://127.0.0.1:5050');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('join-group', groupId);
    });

    newSocket.on('chat:message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      newSocket.emit('leave-group', groupId);
      newSocket.disconnect();
    };
  }, [groupId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket) return;

    socket.emit('chat:send', {
      groupId,
      senderId: currentUserId,
      senderName: currentUserName,
      message: chatInput.trim()
    });

    setChatInput('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const getPercentage = (val: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((val / total) * 100);
  };

  const totalOwedAmount = balances.filter((b: any) => b.netAmount > 0).reduce((acc: number, b: any) => acc + b.netAmount, 0);
  const userNetBalance = balances.find((b: any) => b.userId === currentUserId)?.netAmount || 0;

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] gap-6 overflow-hidden">
      
      {/* LEFT COLUMN: Member Details */}
      <div className="w-full lg:w-64 flex flex-col gap-6 shrink-0 overflow-y-auto pr-2 custom-scrollbar">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#b2f5d1]/20 border border-[#b2f5d1]/30 rounded-lg flex items-center justify-center">
              <span className="text-xl font-bold text-[#b2f5d1]">{group.name.charAt(0)}</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight truncate">{group.name}</h1>
          </div>
          <div className="flex -space-x-2 mt-4">
            {group.members.slice(0, 4).map((member: any, i: number) => (
              <div key={i} className="w-8 h-8 rounded-full bg-[#1a1a1c] border-2 border-[#0a0a0a] flex items-center justify-center text-xs text-white/50 font-bold z-10">
                {member.name.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white/80">Member Details</h2>
            <button className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors">
              <Plus className="w-3 h-3" />
            </button>
          </div>
          
          <div className="flex flex-col gap-3">
            {group.members.map((member: any, i: number) => (
              <div key={i} className="flex items-center justify-between group-member-item">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1a1a1c] flex items-center justify-center text-xs text-white font-bold border border-white/5">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-sm text-white/90 font-medium">{member.name} {member.email === currentUserId && '(You)'}</span>
                    {member.role === 'admin' && (
                      <span className="ml-2 px-1.5 py-0.5 bg-white/10 rounded text-[9px] font-bold tracking-widest uppercase text-white/60">Admin</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#b2f5d1]"></div>
                  <span className="text-[10px] text-white/50 font-medium">New</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CENTER COLUMN: Owe and Pay */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#121214] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#b2f5d1]/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        
        <div className="p-6 border-b border-white/5 z-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white tracking-tight">Owe and Pay</h2>
            <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-black hover:bg-[#b2f5d1] transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="bg-[#1a1a1c] border border-white/5 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-white/50">
              <span>Group Balance Distribution</span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-400"></div> Owed</span>
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#b2f5d1]"></div> Paid</span>
              </div>
            </div>
            
            <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden flex">
              {distribution.totalShared > 0 ? (
                <>
                  <div 
                    className="h-full bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.5)]" 
                    style={{ width: `${getPercentage(distribution.userOwed, distribution.totalShared)}%` }}
                  />
                  <div 
                    className="h-full bg-[#b2f5d1] shadow-[0_0_10px_rgba(178,245,209,0.5)]" 
                    style={{ width: `${getPercentage(distribution.userPaid, distribution.totalShared)}%` }}
                  />
                </>
              ) : (
                <div className="w-full h-full bg-white/10"></div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar z-10">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#0a0a0a]/50 text-[10px] font-bold text-white/40 uppercase tracking-widest sticky top-0 backdrop-blur-md border-b border-white/5">
              <tr>
                <th className="px-6 py-4">Member</th>
                <th className="px-6 py-4">Total Owed</th>
                <th className="px-6 py-4">Total Get Paid</th>
                <th className="px-6 py-4">Pending Settlements</th>
                <th className="px-6 py-4 text-right">Settle Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {balances.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-white/40">No transactions yet.</td>
                </tr>
              ) : (
                balances.map((balance: any, idx: number) => {
                  const owes = balance.netAmount < 0;
                  const isSettled = Math.abs(balance.netAmount) < 0.01;
                  
                  // Find settlements related to this user
                  const userSettlements = settlements.filter((s: any) => s.from === balance.userId || s.to === balance.userId);

                  return (
                    <tr key={idx} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="text-white/90 font-medium">{balance.name}</span>
                        {!isSettled && (
                          <span className="text-white/40 text-xs ml-2">{owes ? 'owes' : 'gets paid'}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-red-400">
                        {owes ? formatCurrency(Math.abs(balance.netAmount)) : formatCurrency(0)}
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-[#b2f5d1]">
                        {!owes && !isSettled ? `+${formatCurrency(balance.netAmount)}` : formatCurrency(0)}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {userSettlements.length === 0 ? (
                          <span className="text-white/30">None</span>
                        ) : (
                          <div className="flex flex-col gap-1 text-white/60">
                            {userSettlements.map((s: any, i: number) => (
                              <span key={i}>
                                {s.from === balance.userId 
                                  ? `Pay ${s.toName}: ${formatCurrency(s.amount)}` 
                                  : `Receive from ${s.fromName}: ${formatCurrency(s.amount)}`}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!isSettled && (
                          <button className="text-xs font-bold text-[#b2f5d1] bg-[#b2f5d1]/10 hover:bg-[#b2f5d1]/20 px-3 py-1.5 rounded-lg transition-colors border border-[#b2f5d1]/20 opacity-0 group-hover:opacity-100">
                            Settle All
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT COLUMN: Live Chat */}
      <div className="w-full lg:w-[320px] flex flex-col shrink-0 bg-[#0f0f0f] border-l border-white/10 h-full relative">
        <div className="p-5 border-b border-white/5 bg-[#0a0a0a]">
          <h2 className="text-lg font-bold text-white tracking-tight">Live Chat</h2>
          <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">Group Chat: {group.name}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-xs text-white/30 text-center px-4">
              Send the first message to start chatting!
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.senderId === currentUserId || msg.senderName === currentUserName; // Fallback to name if senderId is missing
              return (
                <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-full`}>
                  <div className="flex items-center gap-2 mb-1">
                    {!isMe && (
                      <div className="w-5 h-5 rounded-full bg-[#1a1a1c] border border-white/10 flex items-center justify-center text-[9px] font-bold text-white/70">
                        {msg.senderName.charAt(0)}
                      </div>
                    )}
                    <span className="text-[10px] text-white/40 font-medium">
                      {isMe ? 'You' : msg.senderName}
                    </span>
                  </div>
                  <div className={`px-4 py-2.5 rounded-2xl text-sm max-w-[85%] break-words ${isMe ? 'bg-[#b2f5d1] text-black rounded-tr-sm shadow-[0_0_15px_rgba(178,245,209,0.15)]' : 'bg-white/10 text-white/90 rounded-tl-sm border border-white/5'}`}>
                    {msg.message}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-[#0f0f0f] border-t border-white/5 mt-auto">
          <form onSubmit={handleSendMessage} className="relative flex items-center">
            <input 
              type="text" 
              placeholder="Type a message..." 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="w-full bg-[#1a1a1c] border border-white/10 rounded-xl py-3 pl-4 pr-24 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors"
            />
            <div className="absolute right-2 flex items-center gap-1">
              <button type="button" className="p-2 text-white/40 hover:text-white transition-colors">
                <Paperclip className="w-4 h-4" />
              </button>
              <button 
                type="submit" 
                disabled={!chatInput.trim()}
                className="bg-[#b2f5d1] hover:bg-[#9de4c2] text-black p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
