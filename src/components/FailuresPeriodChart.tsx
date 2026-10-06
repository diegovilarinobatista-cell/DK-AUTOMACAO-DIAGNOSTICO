import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { IndustrialFailure, PeriodFailureStat } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import { Calendar, Filter, BarChart3, Info } from 'lucide-react';

interface FailuresPeriodChartProps {
  id?: string;
  failures: IndustrialFailure[];
}

export const FailuresPeriodChart: React.FC<FailuresPeriodChartProps> = ({
  id = 'chart-failures-period',
  failures,
}) => {
  const { t } = useTranslation();
  const [periodType, setPeriodType] = useState<'weekly' | 'monthly' | 'shift'>('weekly');
  const [viewMode, setViewMode] = useState<'total' | 'discipline'>('discipline');

  // Compute dynamic chart data from failures
  const getWeeklyData = (): PeriodFailureStat[] => {
    const days = [
      { key: 'Seg', name: 'Seg / Mon' },
      { key: 'Ter', name: 'Ter / Tue' },
      { key: 'Qua', name: 'Qua / Wed' },
      { key: 'Qui', name: 'Qui / Thu' },
      { key: 'Sex', name: 'Sex / Fri' },
      { key: 'Sáb', name: 'Sáb / Sat' },
      { key: 'Dom', name: 'Dom / Sun' },
    ];

    return days.map((d, index) => {
      // Filter failures matching this day or distribute
      const matched = failures.filter((f, i) => i % 7 === index);
      const eletrica = matched.filter((f) => f.errorCode.startsWith('F3') || f.symptom.toLowerCase().includes('tensão') || f.symptom.toLowerCase().includes('inversor')).length;
      const mecanica = matched.filter((f) => f.errorCode.startsWith('A-') || f.symptom.toLowerCase().includes('temperatura') || f.symptom.toLowerCase().includes('filtro')).length;
      const automacao = matched.filter((f) => !eletrica && !mecanica).length;
      const resolvidas = matched.filter((f) => f.status === 'completed').length;

      return {
        period: d.key,
        eletrica,
        mecanica,
        automacao,
        total: matched.length,
        resolvidas,
      };
    });
  };

  const getMonthlyData = (): PeriodFailureStat[] => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentMonthIndex = new Date().getMonth();
    const last6Months = months.slice(Math.max(0, currentMonthIndex - 5), currentMonthIndex + 1);

    return last6Months.map((m, index) => {
      const matched = failures.filter((_, i) => i % last6Months.length === index);
      const eletrica = matched.filter((f) => f.errorCode.startsWith('F3')).length;
      const mecanica = matched.filter((f) => f.errorCode.startsWith('A-')).length;
      const automacao = matched.length - eletrica - mecanica;
      const resolvidas = matched.filter((f) => f.status === 'completed').length;

      return {
        period: m,
        eletrica,
        mecanica,
        automacao,
        total: matched.length,
        resolvidas,
      };
    });
  };

  const getShiftData = (): PeriodFailureStat[] => {
    const shifts: Array<'Turno 1' | 'Turno 2' | 'Turno 3'> = ['Turno 1', 'Turno 2', 'Turno 3'];
    return shifts.map((shiftName) => {
      const matched = failures.filter((f) => f.shift === shiftName);
      const eletrica = matched.filter((f) => f.errorCode.startsWith('F3')).length;
      const mecanica = matched.filter((f) => f.errorCode.startsWith('A-')).length;
      const automacao = matched.length - eletrica - mecanica;
      const resolvidas = matched.filter((f) => f.status === 'completed').length;

      return {
        period: shiftName,
        eletrica,
        mecanica,
        automacao,
        total: matched.length,
        resolvidas,
      };
    });
  };

  const currentData =
    periodType === 'weekly'
      ? getWeeklyData()
      : periodType === 'monthly'
      ? getMonthlyData()
      : getShiftData();

  const isDataEmpty = failures.length === 0;

  // Custom tooltip for industrial precision
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const totalItem = payload.reduce((acc: number, curr: any) => acc + (curr.value || 0), 0);
      return (
        <div className="bg-slate-950 border border-slate-700 p-3 rounded-lg shadow-xl text-xs space-y-1.5 min-w-[170px]">
          <div className="font-bold text-white border-b border-slate-800 pb-1 flex justify-between items-center">
            <span>{label}</span>
            <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-mono">
              TOTAL: {totalItem}
            </span>
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={`tooltip-item-${index}`} className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-sm inline-block"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="capitalize">{entry.name}:</span>
              </span>
              <span className="font-mono font-bold text-white">{entry.value}</span>
            </div>
          ))}
          <div className="pt-1.5 border-t border-slate-800 text-[10px] text-slate-400">
            {t('estimatedDowntime')}: <span className="text-amber-400 font-mono">~35 min</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id={id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-sm flex flex-col justify-between">
      <div>
        {/* Header controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white">
                {t('chartFailuresTitle')}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {t('chartFailuresSub')}
            </p>
          </div>

          {/* Period selector */}
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
              <button
                onClick={() => setPeriodType('weekly')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  periodType === 'weekly'
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t('periodWeekly')}
              </button>
              <button
                onClick={() => setPeriodType('monthly')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  periodType === 'monthly'
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t('periodMonthly')}
              </button>
              <button
                onClick={() => setPeriodType('shift')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  periodType === 'shift'
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t('periodShift')}
              </button>
            </div>
          </div>
        </div>

        {/* Sub-view toggle (Discipline vs Total) */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">{t('viewDiscipline')}:</span>
            <button
              onClick={() => setViewMode('discipline')}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                viewMode === 'discipline'
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('viewDiscipline')}
            </button>
            <button
              onClick={() => setViewMode('total')}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                viewMode === 'total'
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('viewTotal')}
            </button>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 sm:h-72 w-full relative">
        {isDataEmpty && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-[1px] text-center p-4">
            <Info className="w-8 h-8 text-slate-500 mb-2" />
            <p className="text-xs font-semibold text-slate-300 max-w-sm">
              {t('emptyChartText')}
            </p>
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={currentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
            <XAxis
              dataKey="period"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#475569' }}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#475569' }}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              iconType="circle"
              iconSize={8}
            />

            {viewMode === 'discipline' ? (
              <>
                <Bar
                  dataKey="eletrica"
                  name={t('disciplineElec')}
                  fill="#0284c7"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="mecanica"
                  name={t('disciplineMech')}
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="automacao"
                  name={t('disciplineAuto')}
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </>
            ) : (
              <>
                <Bar
                  dataKey="total"
                  name={t('legendTotal')}
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={45}
                />
                <Bar
                  dataKey="resolvidas"
                  name={t('legendResolved')}
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={45}
                />
              </>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
