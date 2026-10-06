import React from 'react';
import { IndustrialFailure } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import { AlertCircle, CheckCircle2, Clock, Wrench, ChevronRight, PlusCircle, AlertTriangle, FileText } from 'lucide-react';
import { PdfExportService } from '../services/PdfExportService';

interface RecentFailuresTableProps {
  failures: IndustrialFailure[];
  onOpenDiagnostic: (failure?: IndustrialFailure) => void;
}

export const RecentFailuresTable: React.FC<RecentFailuresTableProps> = ({
  failures,
  onOpenDiagnostic,
}) => {
  const { t } = useTranslation();

  const getSeverityBadge = (failure: IndustrialFailure) => {
    switch (failure.severity) {
      case 'CRITICA':
        return (
          <div className="flex flex-col items-center">
            <span className="inline-flex items-center gap-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black px-2 py-0.5 rounded uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
              {t('severityCritical')}
            </span>
            {failure.status !== 'completed' && (
              failure.acknowledgedAt ? (
                <span className="text-[9px] text-emerald-400 font-mono mt-0.5" title={`Reconhecido por ${failure.acknowledgedBy || 'operador'}`}>
                  ✓ Ciente ({failure.acknowledgedAt})
                </span>
              ) : (
                <span className="text-[9px] text-rose-400 font-mono font-bold animate-pulse mt-0.5">
                  ! ALARME ATIVO
                </span>
              )
            )}
          </div>
        );
      case 'ALTA':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
            {t('severityHigh')}
          </span>
        );
      case 'MEDIA':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-semibold px-2 py-0.5 rounded uppercase">
            {t('severityMedium')}
          </span>
        );
      case 'BAIXA':
        return (
          <span className="inline-flex items-center gap-1 bg-slate-700 text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded uppercase">
            {t('severityLow')}
          </span>
        );
    }
  };

  const getStatusBadge = (status: IndustrialFailure['status']) => {
    switch (status) {
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 text-amber-400 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5 animate-spin" /> {t('statusInProgress')}
          </span>
        );
      case 'pending_validation':
        return (
          <span className="inline-flex items-center gap-1 text-cyan-400 text-xs font-semibold">
            <Wrench className="w-3.5 h-3.5" /> {t('statusPending')}
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> {t('statusResolved')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-slate-400 text-xs font-semibold">
            <AlertCircle className="w-3.5 h-3.5" /> {t('statusOpen')}
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-blue-400" />
            {t('failuresTableTitle')}
          </h3>
          <p className="text-xs text-slate-400">
            {t('failuresTableSub')}
          </p>
        </div>
        <button
          onClick={() => onOpenDiagnostic()}
          className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto transition-colors cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>{t('tabNewDiagnostic')}</span>
        </button>
      </div>

      {failures.length === 0 ? (
        <div className="py-12 text-center space-y-3 bg-slate-950/50 rounded-xl border border-dashed border-slate-800 p-6">
          <div className="w-12 h-12 rounded-full bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6 text-amber-500/80" />
          </div>
          <h4 className="text-sm font-bold text-slate-200">{t('emptyFailuresText')}</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {t('emptyChartText')}
          </p>
          <div className="pt-2">
            <button
              onClick={() => onOpenDiagnostic()}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
            >
              {t('btnRegisterFirstFailure')}
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="pb-3 px-4 sm:px-3">{t('colCode')}</th>
                <th className="pb-3 px-3">{t('colMachine')}</th>
                <th className="pb-3 px-3">{t('colSymptom')}</th>
                <th className="pb-3 px-3 text-center">{t('colSeverity')}</th>
                <th className="pb-3 px-3">{t('colStatus')}</th>
                <th className="pb-3 px-3 text-right">{t('colDowntime')}</th>
                <th className="pb-3 px-4 sm:px-3 text-right">{t('colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {failures.map((failure) => (
                <tr
                  key={failure.id}
                  className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                  onClick={() => onOpenDiagnostic(failure)}
                >
                  <td className="py-3 px-4 sm:px-3 font-mono font-bold text-white whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                      <span>{failure.errorCode}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block font-normal">{failure.id}</span>
                  </td>

                  <td className="py-3 px-3 text-slate-200 whitespace-nowrap font-medium">
                    {failure.machineName}
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                      <span>{failure.reportedAt}</span>
                      {(failure.plant || failure.location) && (
                        <>
                          <span>•</span>
                          <span className="text-cyan-400/90 truncate max-w-[120px]">
                            {failure.plant || failure.location}
                          </span>
                        </>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-3 text-slate-300 max-w-xs truncate" title={failure.symptom}>
                    {failure.symptom}
                  </td>

                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    {getSeverityBadge(failure)}
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap">
                    {getStatusBadge(failure.status)}
                  </td>

                  <td className="py-3 px-3 text-right font-mono text-slate-300 whitespace-nowrap">
                    <span className="font-bold text-amber-400">{failure.downtimeMinutes} min</span>
                  </td>

                  <td className="py-3 px-4 sm:px-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          PdfExportService.exportDiagnosticReport({ failure });
                        }}
                        title="Baixar Laudo Técnico em PDF"
                        className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-cyan-400 p-1.5 rounded text-[11px] font-bold transition-colors cursor-pointer border border-slate-700/60"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDiagnostic(failure);
                        }}
                        className="bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white px-2.5 py-1 rounded text-[11px] font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>{t('btnDiagnostic')}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
