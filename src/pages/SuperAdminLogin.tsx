import React, { useState } from 'react';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { toast } from '@/hooks/use-toast';
import { ShieldCheck, Lock, Mail, Eye, EyeOff, Loader2, ArrowRight, AlertTriangle } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const SuperAdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const { login, user, isAuthenticated } = useAuth();

  React.useEffect(() => {
    if (isAuthenticated && user && user.role !== 'super_admin') {
      setAccessDenied(true);
      toast({ title: 'Access Denied', description: 'You are not a Super Admin', variant: 'destructive' });
    }
  }, [isAuthenticated, user]);

  if (isAuthenticated && user?.role === 'super_admin') {
    return <Navigate to="/super-admin/dashboard" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAccessDenied(false);
    try {
      const { error } = await login(email, password);
      if (error) {
        toast({ title: 'Login Failed', description: error.message || 'Invalid email or password', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'An error occurred during login', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden px-4 py-10">
      {/* Atmospheric glows */}
      <div className="absolute -top-40 -left-32 w-[520px] h-[520px] bg-violet-600/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-32 w-[520px] h-[520px] bg-indigo-600/20 rounded-full blur-[150px] pointer-events-none" />
      {/* Grid texture */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Brand */}
        <div className="flex flex-col items-center mb-6">
          <img
            src="/lovable-uploads/3496e725-3945-4e97-9e3b-23e2b57ac36b.png"
            alt="StackBuild"
            className="h-8 w-auto brightness-0 invert mb-4"
          />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300 bg-violet-500/10 border border-violet-500/25 rounded-full px-3 py-1">
            Platform Console
          </span>
        </div>

        {accessDenied ? (
          <div className="bg-slate-900/80 backdrop-blur-xl border border-red-500/30 rounded-2xl shadow-2xl p-8 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-center justify-center mb-4">
              <AlertTriangle className="h-7 w-7 text-red-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Access Denied</h1>
            <p className="text-slate-400 text-sm mt-2">This account is not a Super Admin. Access to the platform console is restricted.</p>
            <button
              onClick={() => { setAccessDenied(false); setEmail(''); setPassword(''); }}
              className="mt-6 w-full h-11 rounded-xl border border-white/15 text-white text-sm font-semibold hover:bg-white/5 transition-colors"
            >
              Try a different account
            </button>
          </div>
        ) : (
          <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/40 flex-shrink-0">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white leading-tight">Super Admin</h1>
                <p className="text-slate-400 text-xs">Platform owner access</p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="sa-email" className="block text-xs font-medium text-slate-300 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[15px] w-[15px] text-slate-500 pointer-events-none" />
                  <input
                    id="sa-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@stackbuild.ca"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-800/60 border border-white/10 text-white text-sm placeholder-slate-500 outline-none transition-all focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="sa-password" className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[15px] w-[15px] text-slate-500 pointer-events-none" />
                  <input
                    id="sa-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full h-11 pl-10 pr-11 rounded-xl bg-slate-800/60 border border-white/10 text-white text-sm placeholder-slate-500 outline-none transition-all focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-violet-900/40 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</>
                ) : (
                  <>Sign In <ArrowRight className="h-4 w-4" /></>
                )}
              </button>
            </form>

            {/* Security footer */}
            <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-center gap-2 text-center">
              <ShieldCheck className="h-3.5 w-3.5 text-violet-400 flex-shrink-0" />
              <p className="text-[11px] text-slate-400">Restricted access · all sign-in activity is monitored</p>
            </div>
          </div>
        )}

        <p className="text-center text-[11px] text-slate-600 mt-5">StackBuild · Platform Owner Controls</p>
      </div>
    </div>
  );
};

export default SuperAdminLogin;
