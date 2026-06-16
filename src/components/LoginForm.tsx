import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight,
  Clock,
  DollarSign,
  Eye,
  EyeOff,
  HardHat,
  Loader2,
  Lock,
  Mail,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import PWAInstallButton from '@/components/common/PWAInstallButton';
import LoginLoading from '@/components/common/LoginLoading';
import ForgotPasswordForm from '@/components/ForgotPasswordForm';

const FEATURES = [
  { icon: Clock,       text: 'Real-time punch tracking from any jobsite' },
  { icon: DollarSign,  text: 'Payroll calculated automatically, every week' },
  { icon: MapPin,      text: 'Jobsite management & daily task tracking' },
  { icon: ShieldCheck, text: 'Cert expiry alerts & safety compliance' },
];

const STATS = [
  { value: '8 hrs',   label: 'Saved weekly' },
  { value: 'Auto',    label: 'Payroll runs' },
  { value: 'Live',    label: 'Punch sync' },
];

const LoginForm = () => {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [fieldError, setFieldError]     = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  const { login, logout, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    if (user.role === 'employee') {
      // Employee tried to sign in via the company portal — sign them out immediately
      // then show the "wrong portal" error. RoleBasedRedirect is patched to not
      // race here, so we have time to call logout before any navigation fires.
      (async () => {
        await logout();
        setLoading(false);
        setFieldError('employee-portal');
      })();
      return;
    }

    setLoading(false);
    switch (user.role) {
      case 'super_admin': navigate('/super-admin/dashboard', { replace: true }); break;
      case 'admin':       navigate('/admin/dashboard',      { replace: true }); break;
      case 'management':  navigate('/management/dashboard', { replace: true }); break;
      case 'foreman':     navigate('/foreman/dashboard',    { replace: true }); break;
      default:            navigate('/',                     { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError('');
    setLoading(true);
    try {
      const { error } = await login(email, password, 'admin');
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
        <LoginLoading message="Setting up your dashboard…" />
      )}

      <div className="min-h-screen lg:h-screen lg:overflow-hidden flex flex-col lg:flex-row bg-slate-950">

        {/* ── Left branding panel (desktop only) ─────────────────────────── */}
        <div className="hidden lg:flex lg:w-5/12 xl:w-[46%] bg-slate-950 flex-col justify-between p-7 xl:p-10 relative overflow-hidden">

          {/* Background construction photo — biased right so both workers stay in frame */}
          <div
            className="absolute inset-0 bg-cover pointer-events-none"
            style={{ backgroundImage: 'url(/images/login-hero.png)', backgroundPosition: '62% center' }}
          />
          {/* Legibility gradients: dark on the left (text) fading toward the people on the right */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/75 to-slate-950/5 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/10 to-slate-950/45 pointer-events-none" />

          {/* Logo + version chip */}
          <div className="relative z-10 flex items-center justify-between flex-shrink-0">
            <img
              src="/lovable-uploads/3496e725-3945-4e97-9e3b-23e2b57ac36b.png"
              alt="StackBuild"
              className="h-8 w-auto brightness-0 invert drop-shadow-lg"
            />
            <span className="text-[10px] font-semibold tracking-[0.12em] text-orange-300 bg-orange-500/15 border border-orange-500/30 rounded-full px-2.5 py-1 backdrop-blur-sm">
              VERSION 2.0
            </span>
          </div>

          {/* Center content */}
          <div className="relative z-10 flex flex-col justify-center py-4 min-h-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 w-fit mb-3 backdrop-blur-sm">
              <HardHat className="h-3.5 w-3.5 text-orange-400" />
              <span className="text-orange-200 text-[11px] font-medium tracking-wide">Built for construction teams</span>
            </div>

            <h2 className="text-[1.7rem] xl:text-[2.15rem] font-bold text-white leading-[1.1] mb-3 drop-shadow-xl">
              Powering construction<br />
              teams to build a{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-400 to-amber-300">
                better tomorrow.
              </span>
            </h2>
            <p className="text-slate-200 text-[13.5px] leading-relaxed mb-5 max-w-md drop-shadow">
              Real-time payroll, timesheets, and jobsite management — all in one platform.
            </p>

            <div className="space-y-2">
              {FEATURES.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                    <Icon className="h-[14px] w-[14px] text-orange-400" />
                  </div>
                  <span className="text-slate-100 text-[13px] drop-shadow">{text}</span>
                </div>
              ))}
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-3 gap-2.5 mt-5 max-w-md">
              {STATS.map(({ value, label }) => (
                <div
                  key={label}
                  className="rounded-xl bg-slate-900/55 border border-white/15 px-2.5 py-2.5 text-center backdrop-blur-md"
                >
                  <p className="text-orange-400 text-base font-bold leading-none">{value}</p>
                  <p className="text-slate-300 text-[10px] mt-1 leading-tight">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial */}
          <div className="relative z-10 border-t border-white/15 pt-4 flex-shrink-0">
            <p className="text-slate-100 text-[13px] leading-relaxed drop-shadow">
              "StackBuild saved us over 8 hours of admin work every week."
            </p>
            <div className="flex items-center gap-2.5 mt-3">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">J</div>
              <div className="flex items-center gap-2">
                <div>
                  <p className="text-white text-xs font-semibold leading-tight">James R.</p>
                  <p className="text-slate-300 text-[11px] leading-tight">Construction Owner · Ontario, CA</p>
                </div>
                <div className="flex gap-0.5 ml-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className="text-orange-400 text-[11px]">★</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right form panel ─────────────────────────────────────────────── */}
        <div className="flex flex-1 items-center justify-center bg-gradient-to-b from-slate-50 via-white to-slate-50 min-h-screen lg:min-h-0 lg:h-screen px-6 py-10 lg:py-6 lg:px-14 relative overflow-y-auto">

          {/* faint top accent bar */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-orange-400/60 to-transparent" />

          <div className="w-full max-w-[380px] animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Mobile logo + version */}
            <div className="lg:hidden text-center mb-9">
              <img
                src="/lovable-uploads/3496e725-3945-4e97-9e3b-23e2b57ac36b.png"
                alt="StackBuild"
                className="h-11 w-auto mx-auto"
              />
              <span className="inline-block mt-3 text-[10px] font-semibold tracking-[0.12em] text-orange-600 bg-orange-50 border border-orange-200 rounded-full px-2.5 py-1">
                VERSION 2.0
              </span>
            </div>

            {showForgotPassword ? (
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-300/30 p-7 sm:p-8">
                <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />
              </div>
            ) : (
              <>
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-300/30 p-7 sm:p-8">
                  {/* Header */}
                  <div className="mb-7">
                    <h1 className="text-[1.65rem] font-bold text-slate-900 leading-tight">Welcome back</h1>
                    <p className="text-slate-500 text-sm mt-1.5">Sign in to your StackBuild account</p>
                  </div>

                  {/* Inline error */}
                  {fieldError === 'employee-portal' ? (
                    <div className="mb-5 px-4 py-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="text-amber-800 text-sm font-medium mb-1">Wrong portal</p>
                      <p className="text-amber-700 text-sm leading-snug mb-3">
                        This account is registered as an employee. Please sign in through the employee portal.
                      </p>
                      <Link
                        to="/employee-login"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 hover:text-amber-900 transition-colors"
                      >
                        Go to Employee Login
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  ) : fieldError ? (
                    <div className="mb-5 flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                      <div className="mt-0.5 h-2 w-2 rounded-full bg-red-500 flex-shrink-0" />
                      <p className="text-red-700 text-sm leading-snug">{fieldError}</p>
                    </div>
                  ) : null}

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
                          className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder-slate-400 outline-none transition-all duration-150 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:bg-white hover:border-slate-300"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-xs font-medium text-slate-400 hover:text-orange-600 transition-colors"
                        >
                          Forgot?
                        </button>
                      </div>
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
                          className="w-full h-11 pl-10 pr-11 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder-slate-400 outline-none transition-all duration-150 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:bg-white hover:border-slate-300"
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
                        className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 active:from-orange-700 active:to-orange-800 text-white font-semibold text-sm transition-all duration-150 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/35 disabled:opacity-55 disabled:cursor-not-allowed disabled:shadow-none"
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
                </div>

                {/* Employee redirect */}
                <div className="mt-5">
                  <Link
                    to="/employee-login"
                    className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl border border-slate-200 bg-white/70 hover:border-orange-200 hover:bg-orange-50/40 transition-all duration-150 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-orange-100 flex items-center justify-center transition-colors">
                        <HardHat className="h-4 w-4 text-slate-500 group-hover:text-orange-600 transition-colors" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">Are you an employee?</p>
                        <p className="text-xs text-slate-400 mt-0.5">Access the employee portal</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </Link>
                </div>

                {/* PWA install — only shows when installable */}
                <div className="mt-5 flex justify-center">
                  <PWAInstallButton />
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </>
  );
};

export default LoginForm;
