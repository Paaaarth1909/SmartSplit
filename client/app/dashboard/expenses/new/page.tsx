'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE, getAuthHeaders } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Users, Plus, ArrowRight, Receipt } from 'lucide-react';
import Link from 'next/link';
import AddExpenseModal from '@/components/AddExpenseModal';

export default function NewExpensePage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${API_BASE}/groups`, {
          headers: getAuthHeaders(),
          cache: 'no-store'
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            setGroups(data.data);
            if (data.data.length === 1) {
              setSelectedGroup(data.data[0]);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch groups:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchGroups();
    }
  }, [user]);

  if (isAuthLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#b2f5d1] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 flex flex-col gap-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <Receipt className="w-8 h-8 text-[#b2f5d1]" /> Add New Expense
        </h1>
        <p className="text-white/50 text-sm mt-1">Select a group to split your expense with friends and members.</p>
      </div>

      {groups.length === 0 ? (
        <div className="bg-[#121214] border border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/40">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">No Groups Found</h3>
            <p className="text-sm text-white/50 max-w-sm mt-1">You must create or join a group before splitting an expense.</p>
          </div>
          <Link
            href="/dashboard/groups"
            className="px-5 py-2.5 bg-[#b2f5d1] text-[#121214] font-bold text-xs rounded-xl hover:bg-[#a0f0c4] transition-all shadow-[0_0_15px_rgba(178,245,209,0.25)] flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Go to Groups
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest">Select Group</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.map((group) => {
              const groupId = group.id || group._id;
              return (
                <div
                  key={groupId}
                  onClick={() => setSelectedGroup(group)}
                  className="bg-[#121214] border border-white/10 hover:border-[#b2f5d1]/40 rounded-2xl p-5 flex items-center justify-between transition-all cursor-pointer group hover:bg-[#b2f5d1]/5 shadow-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#b2f5d1]/10 border border-[#b2f5d1]/20 flex items-center justify-center text-lg font-bold text-[#b2f5d1] group-hover:scale-105 transition-transform">
                      {group.name?.charAt(0).toUpperCase() || 'G'}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-[#b2f5d1] transition-colors">{group.name}</h3>
                      <p className="text-xs text-white/50">{group.members?.length || 0} members</p>
                    </div>
                  </div>
                  <button className="px-3.5 py-1.5 rounded-lg bg-white/5 group-hover:bg-[#b2f5d1] group-hover:text-[#121214] text-white/70 text-xs font-bold transition-all flex items-center gap-1.5">
                    Select <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedGroup && (
        <AddExpenseModal
          group={{ ...selectedGroup, _id: selectedGroup.id || selectedGroup._id }}
          onClose={() => setSelectedGroup(null)}
          onExpenseCreated={() => {
            const gid = selectedGroup.id || selectedGroup._id;
            setSelectedGroup(null);
            router.push(`/dashboard/groups/${gid}`);
          }}
        />
      )}
    </div>
  );
}
