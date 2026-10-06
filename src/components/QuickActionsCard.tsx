import React from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { Camera, QrCode, Sparkles, Video, ArrowRight, ShieldCheck, AlertOctagon } from 'lucide-react';

interface QuickActionsCardProps {
  onStartDiagnostic: () => void;
  onCameraHMI: () => void;
  onCameraPlate: () => void;
  onErrorCode: () => void;
  onSimulateCriticalFault?: () => void;
}

export const QuickActionsCard: React.FC<QuickActionsCardProps> = ({
  onStartDiagnostic,
  onCameraHMI,
  onCameraPlate,
  onErrorCode,
  onSimulateCriticalFault,
}) => {
  const { t } = useTranslation();

  return (
    <div
      id="card-novo-diagnostico"
      className="bg-gradient-to-br from-blue-900/40 via-slate-900 to-slate-950 border border-blue-500/40 rounded-xl p-5 sm:p-6 shadow-xl relative overflow-hidden"
    >
      {/* Background industrial glow */}
      <div className="absolute -right-16 -top-16 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="bg-blue-500 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
              {t('priorityFlow')}
            </span>
            <span className="text-xs text-blue-300 font-mono flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              {t('aiMultimodal')}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {t('quickHeroTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {t('quickHeroSubtitle')}
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" /> {t('safetyProtocol')}
            </span>
            <span>•</span>
            <span>{t('evidenceVsHypothesis')}</span>
          </div>
        </div>

        {/* Primary CTA */}
        <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-2.5">
          <button
            onClick={onStartDiagnostic}
            id="btn-iniciar-diagnostico-principal"
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 text-sm transition-transform active:scale-95 cursor-pointer"
          >
            <span>{t('startFullDiagnostic')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {onSimulateCriticalFault && (
            <button
              onClick={onSimulateCriticalFault}
              id="btn-simular-falha-critica"
              title="Testar alarme sonoro industrial e pop-up persistente"
              className="w-full sm:w-auto bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-500/60 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shadow-md shadow-rose-950/40"
            >
              <AlertOctagon className="w-4 h-4 text-rose-400 animate-pulse" />
              <span>{t('criticalAlarmSimulate')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile-first Quick Action Buttons (Large Touch Targets) */}
      <div className="mt-5 pt-4 border-t border-slate-800/80">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
          {t('quickAccessTitle')}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <button
            onClick={onCameraHMI}
            id="btn-quick-hmi"
            className="flex items-center gap-2 p-2.5 sm:p-3 rounded-lg bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700/80 text-xs font-semibold hover:text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <div className="w-7 h-7 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="leading-tight">{t('quickHmi')}</div>
              <div className="text-[10px] text-slate-400 font-normal">{t('quickHmiSub')}</div>
            </div>
          </button>

          <button
            onClick={onErrorCode}
            id="btn-quick-code"
            className="flex items-center gap-2 p-2.5 sm:p-3 rounded-lg bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700/80 text-xs font-semibold hover:text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <div className="w-7 h-7 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <QrCode className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="leading-tight">{t('quickCode')}</div>
              <div className="text-[10px] text-slate-400 font-normal">{t('quickCodeSub')}</div>
            </div>
          </button>

          <button
            onClick={onCameraPlate}
            id="btn-quick-plate"
            className="flex items-center gap-2 p-2.5 sm:p-3 rounded-lg bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700/80 text-xs font-semibold hover:text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <div className="w-7 h-7 rounded bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="leading-tight">{t('quickPlate')}</div>
              <div className="text-[10px] text-slate-400 font-normal">{t('quickPlateSub')}</div>
            </div>
          </button>

          <button
            onClick={onStartDiagnostic}
            id="btn-quick-video"
            className="flex items-center gap-2 p-2.5 sm:p-3 rounded-lg bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700/80 text-xs font-semibold hover:text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <div className="w-7 h-7 rounded bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <Video className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="leading-tight">{t('quickVideo')}</div>
              <div className="text-[10px] text-slate-400 font-normal">{t('quickVideoSub')}</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
