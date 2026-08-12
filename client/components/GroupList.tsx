'use client';

import React from 'react';
import { Group } from './types';
import { Users } from 'lucide-react';

interface Props {
  groups: Group[];
  onSelectGroup: (id: string) => void;
}

const GroupList: React.FC<Props> = ({ groups, onSelectGroup }) => {
  if (groups.length === 0) {
    return (
      <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-secondary)' }}>
        <Users size={48} style={{ margin: '0 auto', opacity: 0.5, marginBottom: '1rem' }} />
        <h2>No groups found</h2>
        <p>Create a new group to get started splitting expenses.</p>
      </div>
    );
  }

  return (
    <div className="groups-grid">
      {groups.map((group) => (
        <div key={group._id} className="glass-panel group-card" onClick={() => onSelectGroup(group._id)}>
          <div className="group-card-header">
            <h3 className="group-card-title">{group.name}</h3>
            <span className="group-card-meta">
              <Users size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              {group.members.length} members
            </span>
          </div>
          {group.description && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              {group.description.length > 60 ? group.description.substring(0, 60) + '...' : group.description}
            </p>
          )}
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 'auto' }}>
            Created: {new Date(group.createdAt).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
};

export default GroupList;
