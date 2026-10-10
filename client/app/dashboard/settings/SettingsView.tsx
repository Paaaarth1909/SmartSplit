'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import { API_BASE, getAuthHeaders } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface SettingsViewProps {
  initialData: any;
  token?: string | null;
}

export default function SettingsView({ initialData }: SettingsViewProps) {
  const { refreshUser, setTheme, user } = useAuth();

  const [formData, setFormData] = useState({
    fullName: initialData?.fullName || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    currency: initialData?.preferences?.currency || 'INR',
    avatar: initialData?.avatar || ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize theme from localStorage first if available, then initialData/user, fallback to dark
  const [preferences, setPreferences] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('smartsplit_theme');
      if (stored) return { theme: stored === 'dark' };
    }
    const initialTheme = initialData?.preferences?.theme || user?.preferences?.theme || 'dark';
    return { theme: initialTheme === 'dark' };
  });

  // Keep in sync if user state updates from external source
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('smartsplit_theme');
      if (stored) {
        setPreferences({ theme: stored === 'dark' });
      } else if (initialData?.preferences?.theme) {
        setPreferences({ theme: initialData.preferences.theme === 'dark' });
      }
    }
  }, [initialData?.preferences?.theme]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleTheme = () => {
    const nextThemeState = !preferences.theme;
    const nextThemeString = nextThemeState ? 'dark' : 'light';
    setPreferences({ theme: nextThemeState });
    setTheme(nextThemeString);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
        setImgError(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarRemove = () => {
    setFormData(prev => ({ ...prev, avatar: '' }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch(`${API_BASE}/users/me`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...formData,
          theme: preferences.theme ? 'dark' : 'light'
        })
      });
      if (res.ok) {
        setSaveSuccess(true);
        await refreshUser();
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        console.error("Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
    }
    setIsSaving(false);
  };

  return (
    <div className="flex flex-col gap-6 h-full pb-10 max-w-4xl mx-auto w-full">
      
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">Settings & Preferences</h1>
        <p className="text-white/50 text-xs sm:text-sm">Manage your personal credentials, digital ledger behaviors, and interface theme.</p>
      </div>

      {/* Main Settings Card */}
      <div className="bg-[#121214] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-8 flex flex-col gap-6 sm:gap-8 shadow-xl">
        
        {/* Profile Info Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-white/5 pb-6 sm:pb-8">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#1a2e22] border border-[#b2f5d1]/20 flex items-center justify-center text-lg sm:text-xl font-black text-[#b2f5d1] relative shadow-[0_0_20px_rgba(178,245,209,0.1)] shrink-0 aspect-square overflow-hidden">
              {formData.avatar && !imgError ? (
                <img 
                  src={formData.avatar} 
                  alt="Avatar" 
                  className="w-full h-full object-cover" 
                  onError={() => setImgError(true)}
                />
              ) : (
                formData.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0,2) || 'SM'
              )}
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-[#b2f5d1] rounded-full border-2 border-[#121214]" />
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="text-base sm:text-lg font-bold text-white truncate max-w-[180px] sm:max-w-xs">{formData.fullName || 'Alex Morgan'}</h3>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[#1a2e22] text-[#b2f5d1] border border-[#b2f5d1]/20 uppercase tracking-widest shrink-0">
                  PRO MEMBER
                </span>
              </div>
              <p className="text-xs text-white/40 font-medium">Primary Ledger Holder</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 self-start sm:self-center">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleAvatarUpload} 
            />
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 sm:px-5 py-2 rounded-xl border border-white/10 text-xs font-bold text-white hover:bg-white/5 transition-colors whitespace-nowrap cursor-pointer"
            >
              Upload New
            </button>
            <button 
              type="button"
              onClick={handleAvatarRemove}
              className="text-xs font-bold text-white/40 hover:text-red-400 transition-colors px-2 cursor-pointer"
            >
              Remove
            </button>
          </div>
        </div>

        {/* Form Fields - 1 column on mobile, 2 columns on tablet/desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-x-8 sm:gap-y-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-white/60">Full Name</label>
            <input 
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              placeholder="Your full name"
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
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
              placeholder="your@email.com"
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-white/60">Phone Number</label>
            <input 
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+1 (555) 000-0000"
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-white/60">Default Currency</label>
            <select 
              name="currency"
              value={formData.currency}
              onChange={handleInputChange}
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 transition-colors appearance-none truncate pr-8 cursor-pointer"
            >
              <option value="USD">USD ($) — United States Dollar</option>
              <option value="INR">INR (₹) — Indian Rupee</option>
              <option value="EUR">EUR (€) — Euro</option>
              <option value="GBP">GBP (£) — British Pound</option>
            </select>
          </div>
        </div>

        {/* Action Footer */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2 border-t border-white/5 pt-6">
          <p className="text-[11px] text-white/40 font-medium">Changes will reflect instantly across all shared group ledgers.</p>
          <button 
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto bg-[#b2f5d1] hover:bg-[#9de4c2] text-black px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(178,245,209,0.2)] disabled:opacity-50 cursor-pointer text-center whitespace-nowrap"
          >
            {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Ergonomics Section */}
      <div className="bg-[#121214] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-8 flex flex-col gap-6 sm:gap-8 shadow-xl">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">Display & Visual Ergonomics</h3>
          <p className="text-xs text-white/50 mt-1">Customize your interface theme.</p>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 pr-2">
              <h4 className="text-sm font-bold text-white mb-0.5">Dark Mode</h4>
              <p className="text-xs text-white/40 leading-relaxed">
                High contrast obsidian canvas optimized for late night expense tracking & battery efficiency.
              </p>
            </div>
            
            {/* Highly visible, reliable toggle switch */}
            <button 
              type="button"
              role="switch"
              aria-checked={preferences.theme}
              aria-label="Toggle dark mode"
              onClick={handleToggleTheme}
              className={`w-14 h-8 rounded-full p-1 transition-all duration-300 relative cursor-pointer shrink-0 focus:outline-none focus:ring-2 focus:ring-[#b2f5d1]/50 border border-white/10 ${
                preferences.theme 
                  ? 'bg-[#10b981] shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                  : 'bg-zinc-700 hover:bg-zinc-600'
              }`}
            >
              <div 
                className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 ease-in-out flex items-center justify-center ${
                  preferences.theme ? 'translate-x-6' : 'translate-x-0'
                }`}
              >
                {preferences.theme ? (
                  <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                ) : (
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
                )}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
