import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { Send, Paperclip, Plus, MessageSquare, X, Trash2, AlertTriangle, Loader2, CheckCircle2, Check } from 'lucide-react';
import CalculatingLoader from '../../../../components/CalculatingLoader';
import AddExpenseModal from '../../../../components/AddExpenseModal';
import AddGroupMemberModal from '../../../../components/AddGroupMemberModal';
import SettleDebtModal from '../../../../components/SettleDebtModal';
import { API_BASE, getAuthHeaders } from '@/lib/api';

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
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>(initialMessages);
  const [chatInput, setChatInput] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [settlePrefill, setSettlePrefill] = useState<{ payerId?: string; receiverId?: string; amount?: number } | undefined>();
  const [copiedCode, setCopiedCode] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { group, balances, settlements, distribution } = groupData;

  const handleOpenSettleModal = (prefillData?: { payerId?: string; receiverId?: string; amount?: number }) => {
    setSettlePrefill(prefillData);
    setIsSettleModalOpen(true);
  };

  const handleSettleForBalance = (bal: any) => {
    if (bal.netAmount < -0.01) {
      const match = settlements.find((s: any) => s.from === bal.userId);
      if (match) {
        handleOpenSettleModal({ payerId: match.from, receiverId: match.to, amount: match.amount });
        return;
      }
    } else if (bal.netAmount > 0.01) {
      const match = settlements.find((s: any) => s.to === bal.userId);
      if (match) {
        handleOpenSettleModal({ payerId: match.from, receiverId: match.to, amount: match.amount });
        return;
      }
    }
    handleOpenSettleModal({
      payerId: bal.netAmount < 0 ? bal.userId : undefined,
      receiverId: bal.netAmount > 0 ? bal.userId : undefined,
      amount: Math.abs(bal.netAmount)
    });
  };

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

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setDeleteError('');
    try {
      const res = await fetch(`${API_BASE}/groups/${groupId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setIsDeleteModalOpen(false);
        router.push('/dashboard/groups');
      } else {
        const data = await res.json().catch(() => ({}));
        setDeleteError(data.error || 'Failed to delete group');
      }
    } catch (err: any) {
      setDeleteError(err.message || 'An error occurred while deleting the group');
    } finally {
      setIsDeleting(false);
    }
  };

  const totalOwedAmount = balances.filter((b: any) => b.netAmount > 0).reduce((acc: number, b: any) => acc + b.netAmount, 0);
  const userNetBalance = balances.find((b: any) => b.userId === currentUserId)?.netAmount || 0;

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] gap-6 overflow-hidden relative">
      <CalculatingLoader 
        isOpen={isCalculating} 
        groupName={group.name} 
        onComplete={() => {
          setIsCalculating(false);
          window.location.reload();
        }}
      />
      {isAddExpenseOpen && (
        <AddExpenseModal 
          group={{ ...group, _id: group.id || group._id }}
          onClose={() => setIsAddExpenseOpen(false)}
          onExpenseCreated={() => {
            setIsAddExpenseOpen(false);
            setIsCalculating(true);
          }}
        />
      )}
      
      {isAddMemberOpen && (
        <AddGroupMemberModal
          group={{ ...group, _id: group.id || group._id }}
          onClose={() => setIsAddMemberOpen(false)}
          onMembersAdded={() => {
            setIsAddMemberOpen(false);
            window.location.reload();
          }}
        />
      )}

      {isSettleModalOpen && (
        <SettleDebtModal
          isOpen={isSettleModalOpen}
          onClose={() => setIsSettleModalOpen(false)}
          groupId={groupId}
          currency={group.currency || 'INR'}
          members={group.members || []}
          balances={balances || []}
          settlements={settlements || []}
          prefill={settlePrefill}
          onSettled={() => {
            setIsSettleModalOpen(false);
            setIsCalculating(true);
          }}
        />
      )}
      
      {/* LEFT COLUMN: Member Details */}
      <div className="w-full lg:w-64 flex flex-col gap-6 shrink-0 overflow-y-auto pr-2 custom-scrollbar">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#b2f5d1]/20 border border-[#b2f5d1]/30 rounded-lg flex items-center justify-center">
              <span className="text-xl font-bold text-[#b2f5d1]">{group.name.charAt(0)}</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight truncate">{group.name}</h1>
          </div>

          {group.inviteCode && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-white/50">Invite Code:</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(group.inviteCode);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-mono font-bold text-[#27ff9a] tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
                title="Click to copy invite code"
              >
                {group.inviteCode}
                <span className="text-[10px] text-white/40 font-sans font-normal">
                  {copiedCode ? "(copied!)" : "(copy)"}
                </span>
              </button>
            </div>
          )}

          <div className="flex -space-x-2 mt-4">
            {group.members.slice(0, 4).map((member: any, i: number) => (
              <div key={i} className="w-8 h-8 rounded-full bg-[#1a1a1c] border-2 border-[#0a0a0a] flex items-center justify-center text-xs text-white/50 font-bold z-10">
                {member.name.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              setDeleteError('');
              setIsDeleteModalOpen(true);
            }}
            className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold transition-all cursor-pointer w-fit"
            title="Delete this group"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete Group
          </button>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white/80">Member Details</h2>
            <button 
              className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors"
              onClick={() => setIsAddMemberOpen(true)}
            >
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
            <div className="flex items-center gap-3">
              {settlements.length > 0 && (
                <button 
                  onClick={() => handleOpenSettleModal()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#b2f5d1]/15 hover:bg-[#b2f5d1]/25 text-[#b2f5d1] border border-[#b2f5d1]/30 text-xs font-bold transition-all shadow-[0_0_15px_rgba(178,245,209,0.15)] active:scale-95 cursor-pointer"
                  title="Settle debt between members"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Settle Debt
                </button>
              )}
              <button 
                onClick={() => setIsAddExpenseOpen(true)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-black hover:bg-[#b2f5d1] transition-colors cursor-pointer"
                title="Add Expense"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
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
                          <div className="flex flex-col gap-1.5">
                            {userSettlements.map((s: any, i: number) => {
                              const isPayer = s.from === balance.userId;
                              return (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => handleOpenSettleModal({ payerId: s.from, receiverId: s.to, amount: s.amount })}
                                  className="group/settle inline-flex items-center gap-1.5 text-left text-white/70 hover:text-white transition-colors cursor-pointer w-fit"
                                  title="Click to settle this specific debt"
                                >
                                  <span className={isPayer ? 'text-red-400 font-medium' : 'text-[#b2f5d1] font-medium'}>
                                    {isPayer ? `Pay ${s.toName}:` : `Receive from ${s.fromName}:`}
                                  </span>
                                  <span className="font-mono font-bold text-white group-hover/settle:underline">
                                    {formatCurrency(s.amount)}
                                  </span>
                                  <span className="text-[10px] text-[#b2f5d1] opacity-60 group-hover/settle:opacity-100 transition-opacity">
                                    ↗
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!isSettled ? (
                          <button
                            type="button"
                            onClick={() => handleSettleForBalance(balance)}
                            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all active:scale-95 cursor-pointer ${
                              owes 
                                ? 'text-[#121214] bg-[#b2f5d1] hover:bg-[#a0f0c4] shadow-[0_0_12px_rgba(178,245,209,0.25)]' 
                                : 'text-[#b2f5d1] bg-[#b2f5d1]/10 hover:bg-[#b2f5d1]/20 border border-[#b2f5d1]/30'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {owes ? 'Settle Debt' : 'Record Payment'}
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#b2f5d1]/60 bg-[#b2f5d1]/5 border border-[#b2f5d1]/15 px-2.5 py-1 rounded-md">
                            <Check className="w-3 h-3 text-[#b2f5d1]" /> Settled
                          </span>
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
      {isChatOpen ? (
        <div className="w-full lg:w-[320px] flex flex-col shrink-0 bg-[#0f0f0f] border-l border-white/10 h-full relative">
          <div className="p-5 border-b border-white/5 bg-[#0a0a0a] flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Live Chat</h2>
              <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">Group Chat: {group.name}</p>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="text-white/40 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
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
      ) : (
        <button 
          onClick={() => setIsChatOpen(true)}
          className="absolute bottom-8 right-8 w-14 h-14 bg-[#b2f5d1] rounded-full flex items-center justify-center text-black shadow-[0_0_20px_rgba(178,245,209,0.3)] hover:scale-105 hover:bg-[#9de4c2] transition-all z-50 cursor-pointer"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {/* Delete Group Modal */}
      {isDeleteModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => !isDeleting && setIsDeleteModalOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-[#121214] border border-red-500/20 rounded-2xl shadow-2xl overflow-hidden p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4 text-red-400">
              <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Delete Group</h3>
                <p className="text-xs text-white/50">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-white/70 mb-6">
              Are you sure you want to permanently delete <strong className="text-white">"{group.name}"</strong>? All expenses, split calculations, and chat messages for this group will be deleted.
            </p>

            {deleteError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 hover:text-white text-sm font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors shadow-[0_0_15px_rgba(239,68,68,0.3)] flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Deleting...</>
                ) : (
                  <><Trash2 className="w-4 h-4" /> Delete Group</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
