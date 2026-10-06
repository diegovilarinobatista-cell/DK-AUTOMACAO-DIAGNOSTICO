import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IndustrialFailure, Machine } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import { alarmAudioService } from '../services/alarmAudioService';
import {
  AlertOctagon,
  Volume2,
  VolumeX,
  ShieldAlert,
  Clock,
  ArrowRight,
  CheckCircle,
  FileSearch,
  Radio,
  Cpu,
  MapPin,
  AlertTriangle,
} from 'lucide-react';

interface CriticalAlarmModalProps {
  isOpen: boolean;
  failure: IndustrialFailure | null;
  machine?: Machine | null;
  currentUser: string;
  onAcknowledge: (failure: IndustrialFailure) => void;
  onOpenDiagnostic: (failure: IndustrialFailure) => void;
}

export const CriticalAlarmModal: React.FC<CriticalAlarmModalProps> = ({
  isOpen,
  failure,
  machine,
  currentUser,
  onAcknowledge,
  onOpenDiagnostic,
}) => {
  const { t } = useTranslation();
  const [isAlarmSounding, setIsAlarmSounding] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => alarmAudioService.isMuted());

  // Subscribe to audio state
  useEffect(() => {
    const unsubscribe = alarmAudioService.subscribe((playing) => {
      setIsAlarmSounding(playing);
      setIsMuted(alarmAudioService.isMuted());
    });
    return () => unsubscribe();
  }, []);

  if (!isOpen || !failure) return null;

  const handleToggleSound = () => {
    const nextMuted = alarmAudioService.toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted && isOpen) {
      alarmAudioService.playCriticalAlarm();
    }
  };

  const handleTestSound = () => {
    alarmAudioService.testAlarm();
  };

  const handleAcknowledge = () => {
    alarmAudioService.stopAlarm();
    const acknowledgedFailure: IndustrialFailure = {
      ...failure,
      acknowledgedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      acknowledgedBy: currentUser,
    };
    onAcknowledge(acknowledgedFailure);
  };

  const handleDiagnostic = () => {
    alarmAudioService.stopAlarm();
    onOpenDiagnostic(failure);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
        {/* Animated Background Warning Glow */}
        <div className="absolute inset-0 bg-rose-950/30 pointer-events-none animate-pulse" />

        <motion.div
          key="critical-alarm-dialog"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-slate-900 border-2 border-rose-500 rounded-2xl w-full max-w-2xl shadow-2xl shadow-rose-950/80 overflow-hidden ring-4 ring-rose-500/30 flex flex-col my-auto"
        >
          {/* Emergency Industrial Header Strip */}
          <div className="bg-gradient-to-r from-rose-700 via-rose-600 to-red-700 px-5 py-4 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black/30 border border-white/20 flex items-center justify-center shrink-0">
                <AlertOctagon className="w-6 h-6 text-white animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-black/40 text-rose-100 text-[10px] font-black tracking-widest px-2 py-0.5 rounded border border-white/20 uppercase">
                    SCADA PRIORITY 1 • EMERGÊNCIA
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-mono text-white/90">
                    <Radio className="w-3 h-3 animate-pulse text-amber-300" />
                    AO VIVO
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-black tracking-tight mt-0.5">
                  {t('criticalAlarmTitle')}
                </h2>
              </div>
            </div>

            {/* Audio Siren Control Indicator */}
            <div className="flex items-center gap-1.5 shrink-0 bg-black/40 px-2.5 py-1.5 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={handleToggleSound}
                title={isMuted ? t('criticalAlarmUnmuteBtn') : t('criticalAlarmMuteBtn')}
                className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isAlarmSounding && !isMuted
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {isMuted ? (
                  <>
                    <VolumeX className="w-4 h-4 text-rose-300" />
                    <span className="text-[10px] hidden sm:inline">{t('criticalAlarmAudioMuted')}</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 text-emerald-300 animate-pulse" />
                    <span className="text-[10px] hidden sm:inline">{t('criticalAlarmAudioActive')}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Alarm Details Body */}
          <div className="p-5 sm:p-6 space-y-4 text-slate-200">
            {/* Urgent Notice Alert Banner */}
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/50 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-rose-200 leading-snug">
                  {t('criticalAlarmEmergencyNotice')}
                </p>
                <p className="text-rose-300/80 text-[11px] leading-relaxed">
                  {t('criticalAlarmLotoWarning')}
                </p>
              </div>
            </div>

            {/* Equipment & Fault Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Machine Card */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 font-bold uppercase tracking-wider text-slate-400">
                    <Cpu className="w-3.5 h-3.5 text-blue-400" />
                    {t('criticalAlarmEquipment')}
                  </span>
                  <span className="font-mono bg-blue-950/80 text-blue-300 px-1.5 py-0.5 rounded border border-blue-800 text-[10px]">
                    {machine?.code || 'TAG-01'}
                  </span>
                </div>
                <div className="text-sm font-bold text-white">
                  {failure.machineName || machine?.name || 'Equipamento Principal'}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                  <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span>Planta: <b className="text-slate-200">{failure.plant || machine?.plant || 'Planta Industrial 01'}</b></span>
                  <span>•</span>
                  <span>Local: <b className="text-slate-200">{failure.location || machine?.location || machine?.sector || 'Produção / Linha 01'}</b></span>
                  {machine?.model && (
                    <>
                      <span>•</span>
                      <span className="truncate max-w-[150px]">{machine.model}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Error Code & Status Card */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 font-bold uppercase tracking-wider text-rose-400">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    {t('criticalAlarmCode')}
                  </span>
                  <span className="bg-rose-500/20 text-rose-300 font-black px-2 py-0.5 rounded text-[10px] border border-rose-500/40">
                    SEVERIDADE CRÍTICA
                  </span>
                </div>
                <div className="text-base font-black font-mono text-rose-400 tracking-wide">
                  {failure.errorCode || 'ERR-CRIT-990'}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>{failure.reportedAt || 'Agora'}</span>
                  <span>•</span>
                  <span>{failure.shift || 'Turno 1'}</span>
                </div>
              </div>
            </div>

            {/* Observed Symptom Box */}
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                {t('criticalAlarmSymptom')}
              </span>
              <p className="text-slate-200 leading-relaxed font-sans">
                {failure.symptom || 'Parada inesperada da linha com desarme de proteção e sobrecarga.'}
              </p>
              {failure.probableCause && (
                <div className="pt-1 text-[11px] text-amber-300/90 flex items-center gap-1.5">
                  <span className="font-bold text-amber-400">Causa Provável:</span>
                  <span>{failure.probableCause}</span>
                </div>
              )}
            </div>

            {/* Operator Notification Footer Information */}
            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 px-1 pt-1 gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Operador em Turno: <b className="text-slate-300 font-medium">{currentUser}</b></span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestSound}
                  className="text-slate-400 hover:text-white underline text-[11px] cursor-pointer"
                >
                  {t('criticalAlarmTestSound')}
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons: Explicit Operator Attention Required */}
          <div className="bg-slate-950 px-5 py-4 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
            {/* Primary Action 1: Acknowledge Alarm */}
            <button
              type="button"
              onClick={handleAcknowledge}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer active:scale-98"
            >
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>{t('criticalAlarmAcknowledgeBtn')}</span>
            </button>

            {/* Primary Action 2: Open Diagnostic Directly */}
            <button
              type="button"
              onClick={handleDiagnostic}
              className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-colors cursor-pointer active:scale-98"
            >
              <FileSearch className="w-4 h-4" />
              <span>{t('criticalAlarmOpenDiagBtn')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
