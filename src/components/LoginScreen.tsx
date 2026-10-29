import React, { useState } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { supabase } from '../lib/supabase';
import { Lock, User, Eye, EyeOff, ShieldCheck, Cpu, ArrowRight, AlertCircle, KeyRound } from 'lucide-react';

type Mode = 'signin' | 'signup' | 'reset';

const L: Record<string, Record<string, string>> = {
  pt: {
    email: 'E-mail', emailPh: 'voce@empresa.com', pass: 'Senha', passPh: 'Mínimo 8 caracteres',
    signin: 'ENTRAR', signup: 'CRIAR CONTA', reset: 'ENVIAR LINK DE RECUPERAÇÃO',
    toSignup: 'Não tem conta? Criar conta grátis', toSignin: 'Já tem conta? Entrar', forgot: 'Esqueci minha senha',
    titleSignup: 'Criar conta', titleReset: 'Recuperar senha',
    checkEmail: 'Enviamos um e-mail de confirmação. Abra o link e depois entre aqui.',
    resetSent: 'Se o e-mail existir, enviamos um link para redefinir a senha.',
    badLogin: 'E-mail ou senha incorretos.', shortPass: 'A senha precisa ter pelo menos 8 caracteres.',
    notice: 'Seus dados ficam na sua conta, isolados por usuário.',
  },
  en: {
    email: 'Email', emailPh: 'you@company.com', pass: 'Password', passPh: 'At least 8 characters',
    signin: 'SIGN IN', signup: 'CREATE ACCOUNT', reset: 'SEND RESET LINK',
    toSignup: 'No account? Create one for free', toSignin: 'Already have an account? Sign in', forgot: 'Forgot password',
    titleSignup: 'Create account', titleReset: 'Reset password',
    checkEmail: 'We sent a confirmation email. Open the link, then sign in here.',
    resetSent: 'If the email exists, we sent a password reset link.',
    badLogin: 'Wrong email or password.', shortPass: 'Password must be at least 8 characters.',
    notice: 'Your data stays in your account, isolated per user.',
  },
  es: {
    email: 'Correo', emailPh: 'tu@empresa.com', pass: 'Contraseña', passPh: 'Mínimo 8 caracteres',
    signin: 'ENTRAR', signup: 'CREAR CUENTA', reset: 'ENVIAR ENLACE',
    toSignup: '¿No tienes cuenta? Créala gratis', toSignin: '¿Ya tienes cuenta? Entrar', forgot: 'Olvidé mi contraseña',
    titleSignup: 'Crear cuenta', titleReset: 'Recuperar contraseña',
    checkEmail: 'Te enviamos un correo de confirmación. Abre el enlace y luego entra aquí.',
    resetSent: 'Si el correo existe, enviamos un enlace para restablecer la contraseña.',
    badLogin: 'Correo o contraseña incorrectos.', shortPass: 'La contraseña debe tener al menos 8 caracteres.',
    notice: 'Tus datos quedan en tu cuenta, aislados por usuario.',
  },
};

export const LoginScreen: React.FC = () => {
  const { t, language } = useTranslation();
  const tx = (k: string) => (L[language] || L.pt)[k] ?? L.pt[k];
  const [mode, setMode] = useState<Mode>('signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setInfo(null);
    const email = username.trim();
    if (mode !== 'reset' && password.length < 8 && mode === 'signup') { setError(tx('shortPass')); return; }
    setBusy(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setError(tx('badLogin'));
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
        if (error) setError(error.message);
        else if (!data.session) { setInfo(tx('checkEmail')); setMode('signin'); }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
        if (error) setError(error.message); else setInfo(tx('resetSent'));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Subtle industrial background mesh/accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-blue-600/10 via-cyan-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* Top Header bar with Language Selector */}
      <header className="px-4 sm:px-8 py-4 flex items-center justify-between border-b border-slate-900 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-slate-900 border border-blue-400/40 flex items-center justify-center shadow-lg shadow-blue-900/30">
            <span className="text-lg font-black tracking-tighter text-white">DK</span>
          </div>
          <div>
            <span className="font-black text-sm sm:text-base tracking-wider text-white">DK AUTOMAÇÃO</span>
            <span className="ml-2 bg-blue-600/30 border border-blue-500/50 text-blue-300 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
              INDUSTRIAL IA
            </span>
          </div>
        </div>

        {/* Global Language Selector */}
        <div className="flex items-center gap-2">
          <LanguageSelector variant="full" />
        </div>
      </header>

      {/* Center Card Container */}
      <main className="flex-1 flex items-center justify-center p-4 z-10">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 relative">
          {/* Card Title & Icon */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {mode === 'signin' ? t('loginTitle') : mode === 'signup' ? tx('titleSignup') : tx('titleReset')}
            </h1>
            <p className="text-xs text-slate-400">
              {t('loginSubtitle')}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error notice */}
            {info && (
              <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs">{info}</div>
            )}
            {error && (
              <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Operator / User input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-400" />
                {tx('email')}
              </label>
              <input
                type="email"
                autoComplete="email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={tx('emailPh')}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono transition-colors"
                required
              />
            </div>

            {/* Password input */}
            {mode !== 'reset' && <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                  {tx('pass')}
                </label>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder={tx('passPh')}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>}

            <div className="flex items-center justify-between pt-1 text-xs">
              {mode === 'signin' ? (
                <button type="button" onClick={() => { setMode('reset'); setError(null); setInfo(null); }} className="text-slate-400 hover:text-white">{tx('forgot')}</button>
              ) : <span />}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="btn-login-submit"
              disabled={busy}
              className="w-full disabled:opacity-60 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-700/30 flex items-center justify-center gap-2 text-xs uppercase tracking-wider transition-all duration-150 active:scale-98 cursor-pointer mt-2"
            >
              <span>{mode === 'signin' ? tx('signin') : mode === 'signup' ? tx('signup') : tx('reset')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center">
            <button type="button" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); setInfo(null); }} className="text-xs font-semibold text-blue-400 hover:text-blue-300">
              {mode === 'signin' ? tx('toSignup') : tx('toSignin')}
            </button>
          </div>

          {/* Security statement */}
          <div className="pt-2 border-t border-slate-800 text-center">
            <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{tx('notice')}</span>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-4 py-3 text-center text-xs text-slate-500 border-t border-slate-900 z-10">
        <p>DK Automação Industrial • &ldquo;{t('slogan')}&rdquo;</p>
      </footer>
    </div>
  );
};
