'use client';

import React, { useState } from 'react';
import { Check } from 'lucide-react';

interface SettingsViewProps {
  initialData: any;
  token: string | null;
}

export default function SettingsView({ initialData, token }: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState('General & Account');
  const tabs = [
    'General & Account', 
    'Split & Ledger Engine', 
    'Security & Sessions', 
    'Notification Rules', 
    'Billing & Membership', 
    'Developer API'
  ];

  const [formData, setFormData] = useState({
    fullName: initialData?.fullName || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    currency: initialData?.preferences?.currency || 'USD',
    avatar: initialData?.avatar || ''
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [preferences, setPreferences] = useState({
    theme: initialData?.preferences?.theme === 'dark',
    compactDensity: initialData?.preferences?.compactDensity || false,
    liveForex: initialData?.preferences?.liveForex !== false,
    acousticFeedback: initialData?.preferences?.acousticFeedback !== false
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarRemove = () => {
    setFormData(prev => ({ ...prev, avatar: '' }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('http://127.0.0.1:5050/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          theme: preferences.theme ? 'dark' : 'light',
          compactDensity: preferences.compactDensity,
          liveForex: preferences.liveForex,
          acousticFeedback: preferences.acousticFeedback
        })
      });
      if (res.ok) {
        // Success
      } else {
        console.error("Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
    }
    setIsSaving(false);
  };

  return (
    <div className="flex flex-col gap-6 h-full pb-10">
      
      {/* Top Nav */}
      <div className="flex items-center gap-8 border-b border-white/10 pb-4 mb-2 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = tab === activeTab;
          const isPro = tab === 'Billing & Membership';
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-sm font-bold whitespace-nowrap transition-colors relative flex items-center gap-2 ${
                isActive ? 'text-white' : 'text-white/40 hover:text-white/80'
              }`}
            >
              {tab}
              {isPro && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1a2e22] text-[#b2f5d1] border border-[#b2f5d1]/20">
                  PRO
                </span>
              )}
              {isActive && (
                <div className="absolute -bottom-[17px] left-0 right-0 h-[2px] bg-[#b2f5d1] rounded-t-full shadow-[0_-2px_10px_rgba(178,245,209,0.5)]" />
              )}
            </button>
          );
        })}
      </div>

      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Settings & Preferences</h1>
        <p className="text-white/50 text-sm">Manage your personal credentials, digital ledger behaviors, real-time conversion engine, and session safety parameters across your devices.</p>
      </div>

      {/* Main Settings Card */}
      <div className="bg-[#121214] border border-white/10 rounded-3xl p-8 flex flex-col gap-8">
        
        {/* Profile Info Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#1a2e22] border border-[#b2f5d1]/20 flex items-center justify-center text-xl font-black text-[#b2f5d1] relative shadow-[0_0_20px_rgba(178,245,209,0.1)] overflow-hidden">
              {formData.avatar ? (
                <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                formData.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0,2) || 'AM'
              )}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#b2f5d1] rounded-full border-2 border-[#121214]" />
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-white">{formData.fullName || 'Alex Morgan'}</h3>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[#1a2e22] text-[#b2f5d1] border border-[#b2f5d1]/20 uppercase tracking-widest">
                  PRO MEMBER
                </span>
              </div>
              <p className="text-xs text-white/40 font-medium">Primary Ledger Holder • Last synced 2 mins ago</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleAvatarUpload} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2 rounded-xl border border-white/10 text-xs font-bold text-white hover:bg-white/5 transition-colors"
            >
              Upload New
            </button>
            <button 
              onClick={handleAvatarRemove}
              className="text-xs font-bold text-white/40 hover:text-red-400 transition-colors px-2"
            >
              Remove
            </button>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-white/60">Full Name</label>
            <input 
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              className="bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white/60">Email Address</label>
              <span className="text-[10px] font-bold text-[#b2f5d1] flex items-center gap-1">
                <Check className="w-3 h-3" /> Verified
              </span>
            </div>
            <input 
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-white/60">Phone Number</label>
            <input 
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-white/60">Default Currency</label>
            <select 
              name="currency"
              value={formData.currency}
              onChange={handleInputChange}
              className="bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 transition-colors appearance-none"
            >
              <option value="USD">USD ($) — United States Dollar</option>
              <option value="INR">INR (₹) — Indian Rupee</option>
              <option value="EUR">EUR (€) — Euro</option>
              <option value="GBP">GBP (£) — British Pound</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 border-t border-white/5 pt-6">
          <p className="text-[11px] text-white/40 font-medium">Changes will reflect instantly across all shared group ledgers.</p>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#b2f5d1] hover:bg-[#9de4c2] text-black px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(178,245,209,0.2)] disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Ergonomics Section */}
      <div className="bg-[#121214] border border-white/10 rounded-3xl p-8 flex flex-col gap-8">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">Display & Visual Ergonomics</h3>
          <p className="text-xs text-white/50 mt-1">Customize your interface theme and real-time ledger telemetry.</p>
        </div>

        <div className="flex flex-col gap-6">
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white mb-0.5">Serene Dark Pulse Theme</h4>
              <p className="text-xs text-white/40">High contrast obsidian canvas optimized for late night expense tracking & battery efficiency.</p>
            </div>
            <button 
              onClick={() => handleToggle('theme')}
              className={`w-12 h-6 rounded-full transition-colors relative ${preferences.theme ? 'bg-[#b2f5d1]' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full transition-transform ${preferences.theme ? 'bg-black translate-x-7' : 'bg-white translate-x-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white mb-0.5">Compact Ledger Density</h4>
              <p className="text-xs text-white/40">Display more transaction rows per screen by reducing spacing and hiding group avatars.</p>
            </div>
            <button 
              onClick={() => handleToggle('compactDensity')}
              className={`w-12 h-6 rounded-full transition-colors relative ${preferences.compactDensity ? 'bg-[#b2f5d1]' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full transition-transform ${preferences.compactDensity ? 'bg-black translate-x-7' : 'bg-white translate-x-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white mb-0.5">Live Forex Market Conversion</h4>
              <p className="text-xs text-white/40">Continuously convert cross-border transactions using real-time mid-market interbank exchange rates.</p>
            </div>
            <button 
              onClick={() => handleToggle('liveForex')}
              className={`w-12 h-6 rounded-full transition-colors relative ${preferences.liveForex ? 'bg-[#b2f5d1]' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full transition-transform ${preferences.liveForex ? 'bg-black translate-x-7' : 'bg-white translate-x-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white mb-0.5">Acoustic Settlement Feedback</h4>
              <p className="text-xs text-white/40">Plays an affirmative subtle haptic chime when a debt is marked as settled.</p>
            </div>
            <button 
              onClick={() => handleToggle('acousticFeedback')}
              className={`w-12 h-6 rounded-full transition-colors relative ${preferences.acousticFeedback ? 'bg-[#b2f5d1]' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full transition-transform ${preferences.acousticFeedback ? 'bg-black translate-x-7' : 'bg-white translate-x-1'}`} />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
