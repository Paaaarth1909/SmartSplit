'use client';

import React, { useState } from 'react';
import { Home, Plane, Utensils, LayoutGrid, List, Plus, Settings, Link as LinkIcon, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import CreateGroupModal from '@/components/CreateGroupModal';
import JoinGroupModal from '@/components/JoinGroupModal';
import { API_BASE, getAuthHeaders } from '@/lib/api';

import Link from 'next/link';

export default function GroupsList({ initialGroups }: { initialGroups: any[] }) {
  const [groups, setGroups] = useState<any[]>(initialGroups);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [groupToDelete, setGroupToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Keep groups in sync if initialGroups updates
  React.useEffect(() => {
    setGroups(initialGroups);
  }, [initialGroups]);

  const getCategoryIcon = (category: string) => {
    switch ((category || '').toUpperCase()) {
      case 'HOUSING': return <Home className="w-5 h-5" />;
      case 'TRAVEL': return <Plane className="w-5 h-5" />;
      case 'FOOD': return <Utensils className="w-5 h-5" />;
      default: return <Settings className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'owed') return 'text-[#00e599]';
    if (status === 'owe') return 'text-red-400';
    return 'text-white/60';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const handleDeleteClick = (e: React.MouseEvent, group: any) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteError('');
    setGroupToDelete(group);
  };

  const handleConfirmDelete = async () => {
    if (!groupToDelete) return;
    const targetId = groupToDelete.id || groupToDelete._id;

    setIsDeleting(true);
    setDeleteError('');

    try {
      const res = await fetch(`${API_BASE}/groups/${targetId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        setGroups(prev => prev.filter(g => (g.id || g._id) !== targetId));
        setGroupToDelete(null);
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

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Active Groups</h1>
          <p className="text-sm text-white/50">
            Manage your shared expenses across {groups.length} active groups.
          </p>
        </div>
        
        {/* Toggle buttons */}
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <button 
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/5 text-white/40 hover:text-white/70'}`}
          >
            <List className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/5 text-white/40 hover:text-white/70'}`}
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Grid or List View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map(group => (
            <div key={group.id || group._id} className="relative group/card">
              <Link 
                href={`/dashboard/groups/${group.id || group._id}`} 
                className="bg-[#121214] border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-white/20 transition-all cursor-pointer block min-h-[220px]"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70 group-hover/card:bg-white/10 transition-colors">
                      {getCategoryIcon(group.category)}
                    </div>
                    <div className="flex items-center gap-2">
                      {group.inviteCode && (
                        <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-[#27ff9a] tracking-wider font-bold">
                          #{group.inviteCode}
                        </span>
                      )}
                      <button
                        onClick={(e) => handleDeleteClick(e, group)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 border border-white/10 hover:border-red-500/30 transition-all cursor-pointer"
                        title="Delete Group"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-tight mb-1">{group.name}</h2>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-6">
                    {group.category || 'GENERAL'} • {group.memberCount || (group.members || []).length} MEMBERS
                  </p>
                </div>
                
                <div className="border-t border-white/5 pt-5 flex items-end justify-between">
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${getStatusColor(group.status)}`}>
                      {group.status === 'owed' ? 'You are owed' : group.status === 'owe' ? 'You owe' : 'Settled up'}
                    </p>
                    <p className="text-3xl font-bold text-white tracking-tighter">
                      {formatCurrency(group.balance || 0)}
                    </p>
                  </div>
                  
                  {/* Member Avatars */}
                  <div className="flex -space-x-2">
                    {(group.members || []).slice(0, 3).map((member: any, i: number) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-[#1a1a1c] border-2 border-[#121214] flex items-center justify-center text-xs text-white/50 font-bold shadow-sm">
                        {(member.name || 'M').charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {(group.members || []).length > 3 && (
                      <div className="w-8 h-8 rounded-full bg-white/10 border-2 border-[#121214] flex items-center justify-center text-xs text-white font-bold shadow-sm">
                        +{(group.members || []).length - 3}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))}

          {/* Create New Group Card */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="border-2 border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[220px] hover:border-white/20 hover:bg-white/5 transition-all group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6 text-white/60" />
            </div>
            <p className="text-sm font-semibold text-white/60 group-hover:text-white transition-colors">Create New Group</p>
          </button>

          {/* Join Group Card */}
          <button 
            onClick={() => setIsJoinModalOpen(true)}
            className="border-2 border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[220px] hover:border-[#b2f5d1]/40 hover:bg-[#b2f5d1]/5 transition-all group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform group-hover:bg-[#b2f5d1]/20">
              <LinkIcon className="w-6 h-6 text-white/60 group-hover:text-[#b2f5d1] transition-colors" />
            </div>
            <p className="text-sm font-semibold text-white/60 group-hover:text-[#b2f5d1] transition-colors">Join Group via Code</p>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map(group => (
            <div 
              key={group.id || group._id} 
              className="bg-[#121214] border border-white/10 rounded-xl p-4 flex items-center justify-between hover:border-white/20 transition-all"
            >
              <Link href={`/dashboard/groups/${group.id || group._id}`} className="flex items-center gap-4 flex-1">
                <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/70">
                  {getCategoryIcon(group.category)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">{group.name}</h3>
                  <p className="text-xs text-white/40">
                    {group.category || 'GENERAL'} • {group.memberCount || (group.members || []).length} members
                  </p>
                </div>
              </Link>
              
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="text-lg font-bold text-white tracking-tight">{formatCurrency(group.balance || 0)}</span>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${getStatusColor(group.status)}`}>
                    {group.status === 'owed' ? 'Owed' : group.status === 'owe' ? 'Owe' : 'Settled'}
                  </p>
                </div>
                {group.inviteCode && (
                  <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-[#27ff9a] font-bold">
                    #{group.inviteCode}
                  </span>
                )}
                <button
                  onClick={(e) => handleDeleteClick(e, group)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 border border-white/10 hover:border-red-500/30 transition-all cursor-pointer"
                  title="Delete Group"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          <div className="flex gap-4 mt-2">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex-1 border-2 border-dashed border-white/10 rounded-xl p-4 flex items-center justify-center gap-2 hover:border-white/20 hover:bg-white/5 transition-all text-sm font-semibold text-white/60 hover:text-white cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create New Group
            </button>
            <button 
              onClick={() => setIsJoinModalOpen(true)}
              className="flex-1 border-2 border-dashed border-white/10 rounded-xl p-4 flex items-center justify-center gap-2 hover:border-[#b2f5d1]/40 hover:bg-[#b2f5d1]/5 transition-all text-sm font-semibold text-white/60 hover:text-[#b2f5d1] cursor-pointer"
            >
              <LinkIcon className="w-4 h-4" /> Join Group via Code
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Group Deletion */}
      {groupToDelete && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => !isDeleting && setGroupToDelete(null)}
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
              Are you sure you want to permanently delete <strong className="text-white">"{groupToDelete.name}"</strong>? All expenses, split records, and messages associated with this group will be deleted.
            </p>

            {deleteError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setGroupToDelete(null)}
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

      {isModalOpen && (
        <CreateGroupModal 
          onClose={() => setIsModalOpen(false)} 
          onGroupCreated={() => window.location.reload()} 
          apiUrl={`${API_BASE}/groups`} 
        />
      )}
      
      {isJoinModalOpen && (
        <JoinGroupModal 
          onClose={() => setIsJoinModalOpen(false)} 
          onJoined={() => window.location.reload()} 
        />
      )}
    </div>
  );
}
