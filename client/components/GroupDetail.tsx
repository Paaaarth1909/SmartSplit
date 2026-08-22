'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { ArrowLeft, UserPlus, Trash2, Mail, User, Shield, Users, Phone, Plus, Receipt } from 'lucide-react';
import { Group } from './types';
import AddExpenseModal from './AddExpenseModal';

interface Props {
  group: Group;
  onBack: () => void;
  onMemberAdded: (group: Group) => void;
  onMemberRemoved: (group: Group) => void;
  onGroupDeleted: () => void;
  apiUrl: string;
}

const GroupDetail: React.FC<Props> = ({ group, onBack, onMemberAdded, onMemberRemoved, onGroupDeleted, apiUrl }) => {
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [error, setError] = useState('');
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) {
      setError('Name is required');
      return;
    }

    try {
      setIsAddingMember(true);
      const res = await axios.post(`${apiUrl}/${group._id}/members`, {
        name: newMemberName,
        email: newMemberEmail,
        phone: newMemberPhone,
        role: 'member'
      });
      onMemberAdded(res.data.data);
      setNewMemberName('');
      setNewMemberEmail('');
      setNewMemberPhone('');
      setError('');
    } catch {
      setError('Failed to add member');
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    
    try {
      const res = await axios.delete(`${apiUrl}/${group._id}/members/${memberId}`);
      onMemberRemoved(res.data.data);
    } catch {
      alert('Failed to remove member');
    }
  };

  const handleDeleteGroup = async () => {
    if (!confirm(`Are you sure you want to delete "${group.name}"? This cannot be undone.`)) return;

    try {
      await axios.delete(`${apiUrl}/${group._id}`);
      onGroupDeleted();
    } catch {
      alert('Failed to delete group');
    }
  };

  return (
    <div>
      <div className="group-detail-header">
        <button className="btn" onClick={onBack} style={{ background: 'rgba(255,255,255,0.05)' }}>
          <ArrowLeft size={18} /> Back to Groups
        </button>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary" onClick={() => setShowExpenseModal(true)}>
            <Plus size={16} /> Add Expense
          </button>
          <button className="btn btn-danger" onClick={handleDeleteGroup}>
            <Trash2 size={16} /> Delete Group
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{group.name}</h2>
        {group.description && <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{group.description}</p>}
        
        <div style={{ display: 'flex', gap: '2rem', color: 'var(--text-secondary)', fontSize: '0.9rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
          <div><strong>Created:</strong> {new Date(group.createdAt).toLocaleDateString()}</div>
          <div><strong>Total Members:</strong> {group.members.length}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', alignItems: 'start' }}>
        
        {/* Members List */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={20} color="var(--accent-primary)" /> Members
          </h3>
          
          {group.members.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>No members yet. Add someone!</p>
          ) : (
            <div className="members-list">
              {group.members.map((member) => (
                <div key={member._id} className="member-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a5b4fc' }}>
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="member-info">
                      <h4>
                        {member.name}
                        {member.role === 'admin' && <span className="member-role-badge"><Shield size={10} style={{ display: 'inline', marginRight: '2px' }} /> Admin</span>}
                      </h4>
                      {member.email && <p><Mail size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />{member.email}</p>}
                    </div>
                  </div>
                  <button 
                    className="btn btn-danger" 
                    style={{ padding: '0.5rem' }}
                    onClick={() => handleRemoveMember(member._id)}
                    title="Remove member"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Member Form */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserPlus size={20} color="var(--accent-primary)" /> Add Member
          </h3>
          
          {error && <div style={{ color: 'var(--accent-danger)', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

          <form onSubmit={handleAddMember}>
            <div className="form-group">
              <label className="form-label">Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-secondary)' }} />
                <input 
                  className="form-input" 
                  type="text" 
                  placeholder="John Doe"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  style={{ paddingLeft: '2.5rem', width: '100%' }}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Email (Optional)</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-secondary)' }} />
                <input 
                  className="form-input" 
                  type="email" 
                  placeholder="john@example.com"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  style={{ paddingLeft: '2.5rem', width: '100%' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Phone (Optional)</label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-secondary)' }} />
                <input 
                  className="form-input" 
                  type="tel" 
                  placeholder="+1 (555) 000-0000"
                  value={newMemberPhone}
                  onChange={(e) => setNewMemberPhone(e.target.value)}
                  style={{ paddingLeft: '2.5rem', width: '100%' }}
                />
              </div>
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={isAddingMember}>
              {isAddingMember ? 'Adding...' : 'Add Member'}
            </button>
          </form>
        </div>

      </div>

      {showExpenseModal && (
        <AddExpenseModal
          group={group}
          onClose={() => setShowExpenseModal(false)}
          onExpenseCreated={() => {
            setShowExpenseModal(false);
            // Optionally refresh expenses here
          }}
        />
      )}
    </div>
  );
};

export default GroupDetail;
