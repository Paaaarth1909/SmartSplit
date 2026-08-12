'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Users } from 'lucide-react';
import CreateGroupModal from '../components/CreateGroupModal';
import GroupList from '../components/GroupList';
import GroupDetail from '../components/GroupDetail';
import { Group } from '../components/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/groups` : 'http://localhost:5050/api/groups';

export default function HomePage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(API_URL);
      setGroups(res.data.data);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleGroupCreated = () => {
    fetchGroups();
  };

  const handleGroupSelected = async (groupId: string) => {
    try {
      const res = await axios.get(`${API_URL}/${groupId}`);
      setSelectedGroup(res.data.data);
    } catch (error) {
      console.error('Failed to fetch group details:', error);
    }
  };

  const handleMemberAdded = (updatedGroup: Group) => {
    setSelectedGroup(updatedGroup);
    fetchGroups();
  };

  const handleMemberRemoved = (updatedGroup: Group) => {
    setSelectedGroup(updatedGroup);
    fetchGroups();
  };

  const handleBack = () => {
    setSelectedGroup(null);
  };

  const handleGroupDeleted = () => {
    setSelectedGroup(null);
    fetchGroups();
  };

  return (
    <div className="app-container">
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Users size={32} color="var(--accent-primary)" />
          <h1 className="header-title">SmartSplit</h1>
        </div>
        {!selectedGroup && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> New Group
          </button>
        )}
      </header>

      <main>
        {isLoading ? (
          <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-secondary)' }}>
            Loading groups...
          </div>
        ) : selectedGroup ? (
          <GroupDetail 
            group={selectedGroup} 
            onBack={handleBack} 
            onMemberAdded={handleMemberAdded}
            onMemberRemoved={handleMemberRemoved}
            onGroupDeleted={handleGroupDeleted}
            apiUrl={API_URL}
          />
        ) : (
          <GroupList groups={groups} onSelectGroup={handleGroupSelected} />
        )}
      </main>

      {isModalOpen && (
        <CreateGroupModal 
          onClose={() => setIsModalOpen(false)} 
          onGroupCreated={handleGroupCreated}
          apiUrl={API_URL}
        />
      )}
    </div>
  );
}
