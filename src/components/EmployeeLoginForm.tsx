import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  Building2,
  Clock,
  Eye,
  EyeOff,
  HardHat,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import PWAInstallButton from '@/components/common/PWAInstallButton';
import LoginLoading from '@/components/common/LoginLoading';

const FEATURES = [
  { icon: Clock,      text: 'Clock in & out from any jobsite' },
  { icon: ShieldCheck,text: 'View timesheets & approved hours' },
  { icon: Award,      text: 'Upload safety certificates easily' },
  { icon: Smartphone, text: 'Works offline on your phone' },
];

const STATS = [
  { value: '1-tap',   label: 'Clock in/out' },
  { value: 'Offline', label: 'Works anywhere' },
  { value: 'Instant', label: 'Timesheets' },
];

const EmployeeLoginForm = () => {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [fieldError, setFieldError]     = useState('');
  const emailRef = useRef<HTMLInputElement>(null);

  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      setLoading(false);
      switch (user.role) {
        case 'admin':
        case 'super_admin': navigate('/admin/dashboard',      { replace: true }); break;
        case 'management':  navigate('/management/dashboard', { replace: true }); break;
        case 'foreman':     navigate('/foreman/dashboard',    { replace: true }); break;
        case 'employee':    navigate('/employee/dashboard',   { replace: true }); break;
        default:            navigate('/',                     { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError('');
    setLoading(true);
    try {
      const { error } = await login(email, password, 'employee');
      if (error) {
        setFieldError(error.message || 'Invalid email or password');
        setLoading(false);
      }
    } catch {
      setFieldError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <>
      {loading && isAuthenticated && user && (
        <LoginLoading message="Setting up your employee dashboard…" />
      )}

      <div className="min-h-screen lg:h-screen lg:overflow-hidden flex flex-col lg:flex-row bg-slate-950">

        {/* ── Left branding panel (desktop only) ─────────────────────────── */}
        <div className="hidden lg:flex lg:w-5/12 xl:w-[46%] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex-col p-8 xl:p-12 relative overflow-hidden">

          {/* Atmospheric glows — blue tint for employee portal */}
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-blue-500/25 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute top-1/3 right-0 w-72 h-72 bg-sky-400/10 rounded-full blur-[80px] pointer-events-none" />

          {/* Subtle grid texture */}
          <div
            className="absolute inset-0 opacity-[0.035] pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          {/* Logo + version chip */}
          <div className="relative z-10 flex items-center justify-between">
            <img
              src="/lovable-uploads/3496e725-3945-4e97-9e3b-23e2b57ac36b.png"
              alt="StackBuild"
              className="h-9 w-auto brightness-0 invert"
            />
            <span className="text-[11px] font-semibold tracking-[0.12em] text-blue-300 bg-blue-500/10 border border-blue-500/25 rounded-full px-2.5 py-1">
              VERSION 2.0
            </span>
          </div>

          {/* Center content */}
          <div className="relative z-10 flex-1 flex flex-col justify-center py-6 min-h-0">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/25 w-fit mb-5 animate-in fade-in slide-in-from-bottom-2 duration-700">
              <HardHat className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-blue-300 text-xs font-medium tracking-wide">Employee portal</span>
            </div>

            <h2 className="text-3xl xl:text-[2.5rem] font-bold text-white leading-[1.15] mb-4 animate-in fade-in slide-in-from-bottom-3 duration-700">
              Track your hours.<br />
              Get{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-400 to-sky-300">
                paid on time.
              </span>
            </h2>
            <p className="text-slate-400 text-[15px] leading-relaxed mb-7 max-w-md">
              Clock in from the jobsite, view your timesheets, and submit safety certificates — all from your phone.
            </p>

            <div className="space-y-3">
              {FEATURES.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-[15px] w-[15px] text-blue-400" />
                  </div>
                  <span className="text-slate-300 text-sm">{text}</span>
                </div>
              ))}
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-3 gap-3 mt-7 max-w-md">
              {STATS.map(({ value, label }) => (
                <div
                  key={label}
                  className="rounded-xl bg-white/[0.03] border border-white/10 px-3 py-3 text-center backdrop-blur-sm"
                >
                  <p className="text-blue-400 text-lg font-bold leading-none">{value}</p>
                  <p className="text-slate-400 text-[11px] mt-1.5 leading-tight">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer note */}
          <div className="relative z-10 border-t border-slate-800/80 pt-6">
            <p className="text-slate-400 text-sm leading-relaxed">
              Need help signing in? Contact your company administrator or foreman for account assistance.
            </p>
          </div>
        </div>

        {/* ── Right form panel ─────────────────────────────────────────────── */}
        <div className="flex flex-1 items-center justify-center bg-gradient-to-b from-slate-50 via-white to-slate-50 min-h-screen lg:min-h-0 lg:h-screen px-6 py-10 lg:py-6 lg:px-14 relative overflow-y-auto">

          {/* faint top accent bar */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />

          <div className="w-full max-w-[380px] animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Mobile logo + version */}
            <div className="lg:hidden text-center mb-9">
              <img
                src="/lovable-uploads/3496e725-3945-4e97-9e3b-23e2b57ac36b.png"
                alt="StackBuild"
                className="h-11 w-auto mx-auto"
              />
              <span className="inline-block mt-3 text-[10px] font-semibold tracking-[0.12em] text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-1">
                VERSION 2.0
              </span>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-300/30 p-7 sm:p-8">
              {/* Header */}
              <div className="mb-7">
                <h1 className="text-[1.65rem] font-bold text-slate-900 leading-tight">Employee Login</h1>
                <p className="text-slate-500 text-sm mt-1.5">Access your work portal</p>
              </div>

              {/* Inline error */}
              {fieldError && (
                <div className="mb-5 flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                  <div className="mt-0.5 h-2 w-2 rounded-full bg-red-500 flex-shrink-0" />
                  <p className="text-red-700 text-sm leading-snug">{fieldError}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-4">

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[15px] w-[15px] text-slate-400 pointer-events-none" />
                    <input
                      ref={emailRef}
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setFieldError(''); }}
                      required
                      className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder-slate-400 outline-none transition-all duration-150 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:bg-white hover:border-slate-300"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[15px] w-[15px] text-slate-400 pointer-events-none" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setFieldError(''); }}
                      required
                      className="w-full h-11 pl-10 pr-11 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder-slate-400 outline-none transition-all duration-150 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:bg-white hover:border-slate-300"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword
                        ? <EyeOff className="h-4 w-4" />
                        : <Eye className="h-4 w-4" />
                      }
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:from-blue-800 active:to-blue-900 text-white font-semibold text-sm transition-all duration-150 shadow-lg shadow-blue-600/25 hover:shadow-blue-600/35 disabled:opacity-55 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Signing in…</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Help text */}
              <p className="mt-5 text-center text-xs text-slate-400 leading-relaxed">
                Forgot your password? Contact your company<br />administrator for account assistance.
              </p>
            </div>

            {/* Manager redirect */}
            <div className="mt-5">
              <Link
                to="/admin-login"
                className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl border border-slate-200 bg-white/70 hover:border-blue-200 hover:bg-blue-50/40 transition-all duration-150 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                    <Building2 className="h-4 w-4 text-slate-500 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">Are you a manager or admin?</p>
                    <p className="text-xs text-slate-400 mt-0.5">Access the company portal</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </Link>
            </div>

            {/* PWA install — only shows when installable */}
            <div className="mt-5 flex justify-center">
              <PWAInstallButton />
            </div>

          </div>
        </div>

      </div>
    </>
  );
};

export default EmployeeLoginForm;
