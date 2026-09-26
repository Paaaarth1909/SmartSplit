'use client';

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Clock, Users, UserPlus, Settings, LogOut, Plus, Bell, HelpCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

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

  const userInitial = user?.fullName
    ? user.fullName.charAt(0).toUpperCase()
    : "U";

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
            <nav className="flex flex-col gap-1.5 mt-2">
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
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/60 hover:text-red-400 hover:bg-white/5 text-sm font-medium transition-colors w-full cursor-pointer text-left"
          >
            <LogOut className="w-4 h-4" /> 
            <span className="flex-1 text-left">Logout</span>
            <div className="scale-[0.65] origin-right">
              <div className="w-8 h-8 rounded-full bg-[#1a1a1c] border border-white/10 flex items-center justify-center text-xs font-bold text-white">
                {userInitial}
              </div>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative bg-[#0a0a0a]">
        {/* Top Navbar */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 shrink-0 sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-md z-20">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-sm font-bold text-white border-b-2 border-[#b2f5d1] pb-5 translate-y-[10px]">Overview</Link>
          </div>
          
          {pathname === '/dashboard/groups' && (
            <div className="absolute left-1/2 -translate-x-1/2">
              <input type="text" placeholder="Search groups by name..." className="bg-transparent border border-white/10 rounded-full py-1.5 px-5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 w-80 transition-colors bg-white/5" />
            </div>
          )}
          
          <div className="flex items-center gap-4">
            <div className="pl-2 border-l border-white/10">
              <Link href="/dashboard/profile" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#1a1a1c] border border-[#27ff9a]/40 flex items-center justify-center text-xs font-bold text-[#27ff9a] hover:border-[#27ff9a] transition-colors">
                  {userInitial}
                </div>
              </Link>
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
