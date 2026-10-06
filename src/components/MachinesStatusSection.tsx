import React from 'react';
import { Machine } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import { Server, ArrowUpRight, PlusCircle, AlertCircle } from 'lucide-react';

interface MachinesStatusSectionProps {
  machines: Machine[];
  onSelectMachine: (machine: Machine) => void;
  onAddMachine?: () => void;
}

export const MachinesStatusSection: React.FC<MachinesStatusSectionProps> = ({
  machines,
  onSelectMachine,
  onAddMachine,
}) => {
  const { t } = useTranslation();

  const getStatusIndicator = (status: Machine['status']) => {
    switch (status) {
      case 'operational':
        return (
          <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            {t('statusOperational')}
          </span>
        );
      case 'warning':
        return (
          <span className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold bg-amber-950/40 border border-amber-800/60 px-2 py-0.5 rounded">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            {t('statusWarning')}
          </span>
        );
      case 'critical_stopped':
        return (
          <span className="flex items-center gap-1.5 text-rose-400 text-xs font-bold bg-rose-950/40 border border-rose-800/60 px-2 py-0.5 rounded">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            {t('statusCritical')}
          </span>
        );
      case 'maintenance':
        return (
          <span className="flex items-center gap-1.5 text-blue-400 text-xs font-semibold bg-blue-950/40 border border-blue-800/60 px-2 py-0.5 rounded">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            {t('statusMaintenance')}
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-400" />
            {t('fleetTitle')}
          </h3>
          <p className="text-xs text-slate-400">
            {t('fleetSub')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onAddMachine && (
            <button
              onClick={onAddMachine}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{t('btnAddMachine')}</span>
            </button>
          )}
        </div>
      </div>

      {machines.length === 0 ? (
        <div className="py-12 text-center space-y-3 bg-slate-950/50 rounded-xl border border-dashed border-slate-800 p-6">
          <div className="w-12 h-12 rounded-full bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto">
            <Server className="w-6 h-6 text-blue-400/80" />
          </div>
          <h4 className="text-sm font-bold text-slate-200">{t('emptyMachinesText')}</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {t('emptyMachinesText')}
          </p>
          {onAddMachine && (
            <div className="pt-2">
              <button
                onClick={onAddMachine}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
              >
                {t('btnRegisterFirstMachine')}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {machines.map((machine) => (
            <div
              key={machine.id}
              onClick={() => onSelectMachine(machine)}
              className="bg-slate-950 border border-slate-800 hover:border-blue-500/50 rounded-xl p-4 transition-all duration-200 cursor-pointer hover:shadow-lg hover:shadow-blue-950/20 group relative flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10px] text-blue-400 font-bold bg-blue-950/60 border border-blue-900/60 px-1.5 py-0.5 rounded">
                      {machine.code}
                    </span>
                    <h4 className="font-bold text-sm text-white mt-1 group-hover:text-blue-300 transition-colors line-clamp-1">
                      {machine.name}
                    </h4>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors shrink-0" />
                </div>

                <div className="text-xs text-slate-400 space-y-0.5">
                  <div className="truncate">
                    <span className="text-slate-500 font-semibold">{t('fieldManufacturer')}:</span> {machine.manufacturer} • {machine.model}
                  </div>
                  <div className="truncate">
                    <span className="text-slate-500 font-semibold">{t('fieldSector')}:</span> {machine.sector} ({machine.line})
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-900 flex items-center justify-between text-xs">
                <div>{getStatusIndicator(machine.status)}</div>
                <div className="flex items-center gap-2 text-[11px] font-mono">
                  {machine.mtbfHours && machine.mttrHours && (
                    <span
                      title={`Disponibilidade Teórica Operacional: ${((machine.mtbfHours / (machine.mtbfHours + machine.mttrHours)) * 100).toFixed(1)}% (MTBF: ${machine.mtbfHours}h, MTTR: ${machine.mttrHours}h)`}
                      className="bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 px-1.5 py-0.5 rounded text-[10px] font-bold"
                    >
                      Disp: {((machine.mtbfHours / (machine.mtbfHours + machine.mttrHours)) * 100).toFixed(1)}%
                    </span>
                  )}
                  <span
                    title="Falhas críticas registradas vs limite de criticidade tolerado"
                    className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold ${
                      machine.criticalFailuresCount >= (machine.criticalityThreshold || 2)
                        ? 'bg-rose-950/70 border-rose-500/80 text-rose-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    Limite: {machine.criticalFailuresCount}/{machine.criticalityThreshold || 2}
                  </span>
                  <span className="text-slate-400">
                    MTBF: <b className="text-slate-200">{machine.mtbfHours}h</b>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
