import React, { useState } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { Lock, User, Eye, EyeOff, ShieldCheck, Cpu, ArrowRight, AlertCircle, KeyRound } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (userIdentifier: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPass = password.trim();
    if (cleanPass === '01dkautomacao') {
      if (rememberMe) {
        localStorage.setItem('dk_auth_token', '01dkautomacao_authenticated');
        localStorage.setItem('dk_auth_user', username || 'Técnico DK');
      }
      onLoginSuccess(username || 'Técnico DK');
    } else {
      setError(t('loginError'));
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
              {t('loginTitle')}
            </h1>
            <p className="text-xs text-slate-400">
              {t('loginSubtitle')}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error notice */}
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
                {t('userLabel')}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('userPlaceholder')}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono transition-colors"
                required
              />
            </div>

            {/* Password input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                  {t('passwordLabel')}
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
                  placeholder={t('passwordPlaceholder')}
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
            </div>

            {/* Remember me option */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 cursor-pointer"
              />
              <label htmlFor="remember" className="text-xs text-slate-300 cursor-pointer select-none">
                {t('rememberMe')}
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="btn-login-submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-700/30 flex items-center justify-center gap-2 text-xs uppercase tracking-wider transition-all duration-150 active:scale-98 cursor-pointer mt-2"
            >
              <span>{t('loginButton')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Security statement */}
          <div className="pt-2 border-t border-slate-800 text-center">
            <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{t('secureNotice')}</span>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-4 py-3 text-center text-xs text-slate-500 border-t border-slate-900 z-10">
        <p>DK Automação Industrial • Versão 2.4.0 • Slogan: &ldquo;{t('slogan')}&rdquo;</p>
      </footer>
    </div>
  );
};
