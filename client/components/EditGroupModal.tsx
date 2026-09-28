import React, { useState } from 'react';
import { X } from 'lucide-react';
import { API_BASE, getAuthHeaders } from '@/lib/api';
import { Group } from './types';

interface Props {
  group: Group;
  onClose: () => void;
  onGroupUpdated: () => void;
}

const EditGroupModal: React.FC<Props> = ({ group, onClose, onGroupUpdated }) => {
  const [name, setName] = useState(group.name || '');
  const [description, setDescription] = useState(group.description || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Group name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      
      const groupId = group._id || (group as any).id;
      const res = await fetch(`${API_BASE}/groups/${groupId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          name, 
          description
        })
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to update group');
      }

      onGroupUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update group. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-[#121214] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#b2f5d1]/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10 p-6 sm:p-8 flex-shrink-0 border-b border-white/5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white tracking-tight">Edit Group</h2>
            <button 
              className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors" 
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="relative z-10 p-6 sm:p-8 overflow-y-auto custom-scrollbar">
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-sm font-semibold text-white/80">
                Group Name <span className="text-red-400">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="E.g., Weekend Trip, Apartment, etc."
                className="bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#b2f5d1]/50 transition-colors"
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="description" className="text-sm font-semibold text-white/80">
                Description <span className="text-white/40 font-normal">(Optional)</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this group for?"
                rows={3}
                className="bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#b2f5d1]/50 transition-colors resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-4 w-full bg-[#b2f5d1] hover:bg-[#9de4c2] text-[#121214] font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center shadow-[0_0_20px_rgba(178,245,209,0.2)]"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditGroupModal;
