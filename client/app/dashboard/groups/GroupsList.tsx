'use client';

import React, { useState } from 'react';
import { Home, Plane, Utensils, LayoutGrid, List, Plus, Settings } from 'lucide-react';
import CreateGroupModal from '@/components/CreateGroupModal';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';

export default function GroupsList({ initialGroups }: { initialGroups: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { getToken } = useAuth();

  const getCategoryIcon = (category: string) => {
    switch (category.toUpperCase()) {
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

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Active Groups</h1>
          <p className="text-sm text-white/50">
            Manage your shared expenses across {initialGroups.length} active groups.
          </p>
        </div>
        
        {/* Toggle buttons */}
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <button 
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg border transition-colors ${viewMode === 'list' ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/5 text-white/40 hover:text-white/70'}`}
          >
            <List className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg border transition-colors ${viewMode === 'grid' ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/5 text-white/40 hover:text-white/70'}`}
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
        
        {/* Group Cards */}
        {initialGroups.map(group => (
          <Link href={`/dashboard/groups/${group.id}`} key={group.id} className="bg-[#121214] border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-white/20 transition-all group cursor-pointer block">
            <div>
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70 mb-5 group-hover:bg-white/10 transition-colors">
                {getCategoryIcon(group.category)}
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight mb-1">{group.name}</h2>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-6">
                {group.category} • {group.memberCount} MEMBERS
              </p>
            </div>
            
            <div className="border-t border-white/5 pt-5 flex items-end justify-between">
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${getStatusColor(group.status)}`}>
                  {group.status === 'owed' ? 'You are owed' : group.status === 'owe' ? 'You owe' : 'Settled up'}
                </p>
                <p className="text-3xl font-bold text-white tracking-tighter">
                  {formatCurrency(group.balance)}
                </p>
              </div>
              
              {/* Member Avatars */}
              <div className="flex -space-x-2">
                {group.members.slice(0, 3).map((member: any, i: number) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-[#1a1a1c] border-2 border-[#121214] flex items-center justify-center text-xs text-white/50 font-bold shadow-sm">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                ))}
                {group.members.length > 3 && (
                  <div className="w-8 h-8 rounded-full bg-white/10 border-2 border-[#121214] flex items-center justify-center text-xs text-white font-bold shadow-sm">
                    +{group.members.length - 3}
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}

        {/* Create New Group Card */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="border-2 border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[220px] hover:border-white/20 hover:bg-white/5 transition-all group"
        >
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Plus className="w-6 h-6 text-white/60" />
          </div>
          <p className="text-sm font-semibold text-white/60 group-hover:text-white transition-colors">Create New Group</p>
        </button>

      </div>

      {isModalOpen && (
        <CreateGroupModal 
          onClose={() => setIsModalOpen(false)} 
          onGroupCreated={() => window.location.reload()} 
          apiUrl="http://127.0.0.1:5050/api/groups" 
        />
      )}
    </div>
  );
}
