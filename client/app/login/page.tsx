"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { Lock, Mail, ArrowRight, Eye, EyeOff, Sparkles } from "lucide-react";
import DotGrid from "@/components/DotGrid";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 selection:bg-[#27ff9a]/30 overflow-hidden">
      {/* Background DotGrid */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <DotGrid
          dotSize={2}
          gap={16}
          baseColor="#27ff9a"
          activeColor="#27ff9a"
          proximity={120}
          shockRadius={250}
          shockStrength={5}
          resistance={750}
          returnDuration={1.5}
        />
      </div>

      {/* Ambient background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[400px] bg-[#27ff9a]/[0.05] rounded-full blur-[140px] pointer-events-none" />

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md bg-[#121214]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl"
      >
        {/* Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-3 group">
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-[#27ff9a]/40 transition-colors">
              <Sparkles className="w-4 h-4 text-[#27ff9a]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              SmartSplit <span className="text-[#27ff9a]">Pro</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h1>
          <p className="text-xs text-white/50 mt-1">
            Log in to manage your groups, expenses, and optimized debt ledgers.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/60 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#27ff9a]/50 focus:ring-1 focus:ring-[#27ff9a]/30 transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/60">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-[#27ff9a] hover:underline transition-colors font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#27ff9a]/50 focus:ring-1 focus:ring-[#27ff9a]/30 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-[#27ff9a] hover:bg-[#1fe388] text-black font-bold text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(39,255,154,0.3)] hover:shadow-[0_0_25px_rgba(39,255,154,0.45)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Sign In <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-white/50">
          Don&apos;t have an account yet?{" "}
          <Link
            href="/register"
            className="text-[#27ff9a] font-semibold hover:underline transition-colors"
          >
            Create an account
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
