import React, { useState, useEffect } from 'react';
import { IndustrialFailure } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import { alarmAudioService } from '../services/alarmAudioService';
import { AlertOctagon, Volume2, VolumeX, ArrowRight, Eye, ShieldAlert } from 'lucide-react';

interface CriticalAlarmBannerProps {
  unacknowledgedFailures: IndustrialFailure[];
  onViewAlarm: (failure: IndustrialFailure) => void;
  onOpenDiagnostic: (failure: IndustrialFailure) => void;
}

export const CriticalAlarmBanner: React.FC<CriticalAlarmBannerProps> = ({
  unacknowledgedFailures,
  onViewAlarm,
  onOpenDiagnostic,
}) => {
  const { t } = useTranslation();
  const [isMuted, setIsMuted] = useState<boolean>(() => alarmAudioService.isMuted());
  const [isPlaying, setIsPlaying] = useState<boolean>(() => alarmAudioService.isAlarmPlaying());

  useEffect(() => {
    const unsub = alarmAudioService.subscribe((playing) => {
      setIsPlaying(playing);
      setIsMuted(alarmAudioService.isMuted());
    });
    return () => unsub();
  }, []);

  if (unacknowledgedFailures.length === 0) return null;

  const latestCritical = unacknowledgedFailures[0];

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const muted = alarmAudioService.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      alarmAudioService.playCriticalAlarm();
    }
  };

  return (
    <div
      role="alert"
      className="bg-gradient-to-r from-rose-950 via-rose-900 to-red-950 border-y sm:border sm:rounded-xl border-rose-500/80 px-4 py-2.5 shadow-xl shadow-rose-950/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pulse"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
          <AlertOctagon className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-rose-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider">
              {t('criticalAlarmBannerText')} ({unacknowledgedFailures.length})
            </span>
            <span className="text-rose-200 font-mono text-xs font-bold">
              {latestCritical.errorCode}
            </span>
          </div>
          <p className="text-xs text-rose-100 font-medium truncate max-w-xl mt-0.5">
            <b className="text-white">{latestCritical.machineName}</b>: {latestCritical.symptom}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
        <button
          type="button"
          onClick={handleToggleMute}
          title={isMuted ? t('criticalAlarmUnmuteBtn') : t('criticalAlarmMuteBtn')}
          className="p-1.5 rounded-lg bg-rose-900/80 hover:bg-rose-800 text-rose-200 border border-rose-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-300" /> : <Volume2 className="w-4 h-4 text-emerald-300 animate-pulse" />}
          <span className="text-[11px] hidden md:inline">
            {isMuted ? t('criticalAlarmAudioMuted') : t('criticalAlarmMuteBtn')}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onViewAlarm(latestCritical)}
          className="bg-white hover:bg-slate-100 text-rose-950 px-3 py-1.5 rounded-lg font-black text-xs flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{t('criticalAlarmBannerView')}</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenDiagnostic(latestCritical)}
          className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
        >
          <span>Diagnosticar</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
