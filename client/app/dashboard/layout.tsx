'use client';

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Clock, Users, UserPlus, Settings, LogOut, Plus, Bell, HelpCircle } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const getLinkClass = (path: string) => {
    const isActive = pathname === path || (path !== '/dashboard' && pathname.startsWith(path));
    return isActive 
      ? "flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 text-white text-sm font-medium border border-white/5"
      : "flex items-center gap-3 px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 text-sm font-medium transition-colors";
  };

  const getIconClass = (path: string) => {
    const isActive = pathname === path || (path !== '/dashboard' && pathname.startsWith(path));
    return isActive ? "w-4 h-4 text-white/70" : "w-4 h-4";
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 border-r border-white/10 bg-[#0f0f0f] flex flex-col justify-between shrink-0">
        <div>
          {/* Logo / Header */}
          <div className="p-4 border-b border-white/5">
            <Link href="/" className="flex items-center justify-between px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all cursor-pointer group shadow-sm">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-bold text-white tracking-wide group-hover:text-[#b2f5d1] transition-colors">SmartSplit Pro</span>
                <span className="text-[9px] font-semibold text-white/40 tracking-widest uppercase">Go to Landing Page</span>
              </div>
              <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#b2f5d1]/20 transition-colors">
                <svg className="w-3 h-3 text-white/50 group-hover:text-[#b2f5d1] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
            </Link>
          </div>

          <div className="p-4">
            <Link href="/dashboard/expenses/new" className="w-full bg-[#b2f5d1] hover:bg-[#9de4c2] text-black rounded-lg py-2 flex items-center justify-center gap-2 text-sm font-bold transition-colors mb-5 shadow-[0_0_15px_rgba(178,245,209,0.3)]">
              <Plus className="w-4 h-4" /> Add Expense
            </Link>

            <nav className="flex flex-col gap-1.5">
              <Link href="/dashboard" className={getLinkClass("/dashboard")}>
                <LayoutDashboard className={getIconClass("/dashboard")} /> Dashboard
              </Link>
              <Link href="/dashboard/activity" className={getLinkClass("/dashboard/activity")}>
                <Clock className={getIconClass("/dashboard/activity")} /> Recent Activity
              </Link>
              <Link href="/dashboard/groups" className={getLinkClass("/dashboard/groups")}>
                <Users className={getIconClass("/dashboard/groups")} /> Groups
              </Link>
              <Link href="/dashboard/friends" className={getLinkClass("/dashboard/friends")}>
                <UserPlus className={getIconClass("/dashboard/friends")} /> Friends
              </Link>
              <Link href="/dashboard/profile" className={getLinkClass("/dashboard/profile")}>
                <svg className={getIconClass("/dashboard/profile")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg> Profile
              </Link>
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-white/5 flex flex-col gap-1.5">
          <Link href="/dashboard/settings" className={getLinkClass("/dashboard/settings")}>
            <Settings className={getIconClass("/dashboard/settings")} /> Settings
          </Link>
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/60 text-sm font-medium">
            <LogOut className="w-4 h-4" /> 
            <span className="flex-1 text-left">Logout</span>
            <div className="scale-[0.65] origin-right">
              <UserButton />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative bg-[#0a0a0a]">
        {/* Top Navbar */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 shrink-0 sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-md z-20">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-sm font-bold text-white border-b-2 border-[#b2f5d1] pb-5 translate-y-[10px]">Overview</Link>
            <Link href="#" className="text-sm font-medium text-white/50 hover:text-white transition-colors">Settlements</Link>
            <Link href="#" className="text-sm font-medium text-white/50 hover:text-white transition-colors">Reports</Link>
            <Link href="#" className="text-sm font-medium text-white/50 hover:text-white transition-colors">Settings</Link>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <input type="text" placeholder="Search transactions..." className="bg-transparent border border-white/10 rounded-full py-1.5 pl-4 pr-10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 w-56 transition-colors" />
            </div>
            
            <button className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-white/20 transition-all">
              <Bell className="w-3.5 h-3.5" />
            </button>
            <button className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-white/20 transition-all">
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
            <button className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-4 py-1.5 text-xs font-bold text-white transition-all flex items-center gap-1.5">
              <svg className="w-3 h-3 text-[#b2f5d1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg> Quick Split
            </button>
            <div className="pl-2 border-l border-white/10">
              <UserButton appearance={{ elements: { avatarBox: "w-8 h-8 rounded-full border border-white/10" } }} />
            </div>
          </div>
        </header>

        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
