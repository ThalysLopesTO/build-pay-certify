import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, Loader2, Mail, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ForgotPasswordFormProps {
  onBack: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBack }) => {
  const [email, setEmail]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [emailError, setEmailError] = useState('');
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setEmailError('');

    try {
      const { error } = await supabase.functions.invoke('send-password-reset', {
        body: { email: email.toLowerCase() },
      });

      if (error) {
        setEmailError('Failed to send reset email. Please try again.');
        return;
      }

      setSubmitted(true);
    } catch {
      setEmailError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-5">
          <CheckCircle2 className="h-7 w-7 text-emerald-500" />
        </div>
        <h2 className="text-[1.4rem] font-bold text-slate-900 mb-2">Check your inbox</h2>
        <p className="text-slate-500 text-sm leading-relaxed mb-1">
          If an account exists for <span className="font-medium text-slate-700">{email}</span>, a password reset link has been sent.
        </p>
        <p className="text-slate-400 text-xs mb-8">
          Didn't receive it? Check your spam folder.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium text-sm transition-all duration-150"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to login
        </button>
        <h2 className="text-[1.6rem] font-bold text-slate-900 leading-tight">Reset password</h2>
        <p className="text-slate-500 text-sm mt-1.5">
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      {/* Error */}
      {emailError && (
        <div className="mb-5 flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
          <div className="mt-0.5 h-2 w-2 rounded-full bg-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm leading-snug">{emailError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="reset-email" className="block text-sm font-medium text-slate-700 mb-1.5">
            Email address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[15px] w-[15px] text-slate-400 pointer-events-none" />
            <input
              ref={emailRef}
              id="reset-email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
              required
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder-slate-400 outline-none transition-all duration-150 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:bg-white hover:border-slate-300"
            />
          </div>
        </div>

        <div className="pt-1">
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold text-sm transition-all duration-150 shadow-sm hover:shadow-md disabled:opacity-55 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Sending…</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Send Reset Link</span>
              </>
            )}
          </button>
        </div>
      </form>
    </>
  );
};

export default ForgotPasswordForm;
