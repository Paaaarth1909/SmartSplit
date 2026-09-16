'use client';

import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';

interface Props {
  onClose: () => void;
  onGroupCreated: () => void;
  apiUrl: string;
}

const CreateGroupModal: React.FC<Props> = ({ onClose, onGroupCreated, apiUrl }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { getToken } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Group name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      
      const token = await getToken();
      
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, description })
      });

      if (!res.ok) {
        throw new Error('Failed to create group');
      }

      onGroupCreated();
      onClose();
    } catch (err) {
      setError('Failed to create group. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-[#121214] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle background glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#b2f5d1]/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10 p-6 sm:p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white tracking-tight">Create New Group</h2>
            <button 
              className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors" 
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2" htmlFor="groupName">
                Group Name
              </label>
              <input 
                id="groupName"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#b2f5d1]/50 focus:bg-white/10 transition-colors" 
                type="text" 
                placeholder="e.g., Trip to Bali, Apartment 4B"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2" htmlFor="groupDesc">
                Description (Optional)
              </label>
              <textarea 
                id="groupDesc"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#b2f5d1]/50 focus:bg-white/10 transition-colors resize-none" 
                rows={3}
                placeholder="What is this group for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end gap-3 mt-4">
              <button 
                type="button" 
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white/70 hover:text-white hover:bg-white/5 transition-colors" 
                onClick={onClose}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-[#b2f5d1] hover:bg-[#9de4c2] text-black shadow-[0_0_15px_rgba(178,245,209,0.3)] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : <><Check size={18} /> Create Group</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;
