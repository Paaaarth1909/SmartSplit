'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { X, Check } from 'lucide-react';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Group name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await axios.post(apiUrl, { name, description });
      onGroupCreated();
      onClose();
    } catch {
      setError('Failed to create group. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create New Group</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {error && <div style={{ color: 'var(--accent-danger)', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="groupName">Group Name</label>
            <input 
              id="groupName"
              className="form-input" 
              type="text" 
              placeholder="e.g., Trip to Bali, Apartment 4B"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="groupDesc">Description (Optional)</label>
            <textarea 
              id="groupDesc"
              className="form-input" 
              rows={3}
              placeholder="What is this group for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" className="btn" onClick={onClose} style={{ background: 'transparent' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : <><Check size={18} /> Create Group</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
