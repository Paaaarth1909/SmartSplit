"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { Lock, Mail, ArrowRight, Eye, EyeOff, Sparkles, KeyRound, CheckCircle2 } from "lucide-react";
import DotGrid from "@/components/DotGrid";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim() || !newPassword) {
      setError("Please enter your account email and new password.");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setError("Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      await resetPassword(email.trim(), newPassword);
      setSuccess("Password updated successfully! Redirecting to your dashboard...");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Failed to reset password. Please verify your email.");
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
        className="relative z-10 w-full max-w-md bg-[#121214]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl my-8"
      >
        {/* Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-3 group">
            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-[#27ff9a]/40 transition-colors">
              <KeyRound className="w-4 h-4 text-[#27ff9a]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              SmartSplit <span className="text-[#27ff9a]">Pro</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white tracking-tight">Reset Password</h1>
          <p className="text-xs text-white/50 mt-1">
            Already have an account? Enter your email and choose a new password.
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

        {/* Success Alert */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center justify-center gap-2 text-center"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/60 mb-2">
              Registered Email Address
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/60 mb-2">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 chars with uppercase, lowercase, number & symbol"
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
            {newPassword.length > 0 && (
              <div className="mt-2 text-[11px] grid grid-cols-2 gap-1.5 text-white/50 bg-white/5 p-2.5 rounded-lg border border-white/5">
                <span className={newPassword.length >= 8 ? "text-[#27ff9a] font-medium" : "text-white/40"}>
                  {newPassword.length >= 8 ? "✓" : "○"} 8+ characters
                </span>
                <span className={/[A-Z]/.test(newPassword) ? "text-[#27ff9a] font-medium" : "text-white/40"}>
                  {/[A-Z]/.test(newPassword) ? "✓" : "○"} Uppercase letter
                </span>
                <span className={/[a-z]/.test(newPassword) ? "text-[#27ff9a] font-medium" : "text-white/40"}>
                  {/[a-z]/.test(newPassword) ? "✓" : "○"} Lowercase letter
                </span>
                <span className={/\d/.test(newPassword) ? "text-[#27ff9a] font-medium" : "text-white/40"}>
                  {/\d/.test(newPassword) ? "✓" : "○"} Number (0-9)
                </span>
                <span className={/[@$!%*?&]/.test(newPassword) ? "text-[#27ff9a] font-medium" : "text-white/40"}>
                  {/[@$!%*?&]/.test(newPassword) ? "✓" : "○"} Symbol (@$!%*?&)
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/60 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#27ff9a]/50 focus:ring-1 focus:ring-[#27ff9a]/30 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3 bg-[#27ff9a] hover:bg-[#1fe388] text-black font-bold text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(39,255,154,0.3)] hover:shadow-[0_0_25px_rgba(39,255,154,0.45)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Update Password &amp; Sign In <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 flex items-center justify-between text-xs text-white/50">
          <Link
            href="/login"
            className="hover:text-white transition-colors"
          >
            ← Back to Login
          </Link>
          <Link
            href="/register"
            className="text-[#27ff9a] font-semibold hover:underline transition-colors"
          >
            Create new account
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
