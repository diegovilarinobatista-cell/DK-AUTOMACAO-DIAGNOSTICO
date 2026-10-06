import React, { useState } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Cell,
} from 'recharts';
import { IndustrialFailure, Machine, ParetoItem } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import { Layers, Activity, TrendingUp, Info } from 'lucide-react';

interface ParetoAndEquipmentChartsProps {
  failures: IndustrialFailure[];
  machines: Machine[];
}

export const ParetoAndEquipmentCharts: React.FC<ParetoAndEquipmentChartsProps> = ({
  failures,
  machines,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'pareto' | 'equipment'>('pareto');

  // Compute dynamic Pareto data from failures
  const getParetoData = (): ParetoItem[] => {
    if (failures.length === 0) {
      return [];
    }

    const causeMap: { [key: string]: number } = {};
    failures.forEach((f) => {
      const cause = f.probableCause || f.errorCode || 'Outros Componentes';
      causeMap[cause] = (causeMap[cause] || 0) + 1;
    });

    const sorted = Object.entries(causeMap)
      .map(([cause, count]) => ({ cause, count }))
      .sort((a, b) => b.count - a.count);

    const totalCount = sorted.reduce((acc, curr) => acc + curr.count, 0);
    let cumulative = 0;

    return sorted.map((item) => {
      cumulative += item.count;
      return {
        cause: item.cause.length > 24 ? item.cause.substring(0, 24) + '...' : item.cause,
        count: item.count,
        cumulativePercentage: Math.round((cumulative / totalCount) * 100),
      };
    });
  };

  // Compute equipment failure counts from machines & failures
  const getEquipmentData = () => {
    if (machines.length === 0) {
      return [];
    }

    return machines.map((m) => {
      const machineFailures = failures.filter((f) => f.machineId === m.id).length;
      return {
        name: m.name.split('-')[0].trim(),
        manufacturer: m.manufacturer,
        falhas: machineFailures,
        status: m.status,
      };
    });
  };

  const paretoData = getParetoData();
  const equipmentData = getEquipmentData();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical_stopped':
        return '#e11d48'; // Rose/Red
      case 'warning':
        return '#f59e0b'; // Amber
      default:
        return '#0284c7'; // Tech blue
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-sm flex flex-col justify-between">
      <div>
        {/* Header with toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              {activeTab === 'pareto' ? <TrendingUp className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {activeTab === 'pareto' ? t('paretoTitle') : t('equipmentTitle')}
              </h3>
              <p className="text-xs text-slate-400">
                {activeTab === 'pareto' ? t('paretoSub') : t('equipmentSub')}
              </p>
            </div>
          </div>

          {/* Tab switch */}
          <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('pareto')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'pareto'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('tabPareto')}
            </button>
            <button
              onClick={() => setActiveTab('equipment')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                activeTab === 'equipment'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('tabEquipment')}
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: Pareto Chart */}
      {activeTab === 'pareto' && (
        <div className="h-64 sm:h-72 w-full relative">
          {paretoData.length === 0 && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-[1px] text-center p-4">
              <Info className="w-8 h-8 text-slate-500 mb-2" />
              <p className="text-xs font-semibold text-slate-300 max-w-sm">
                {t('emptyParetoText')}
              </p>
            </div>
          )}

          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={paretoData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis
                dataKey="cause"
                stroke="#94a3b8"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#475569' }}
                interval={0}
                angle={-20}
                textAnchor="end"
              />
              <YAxis
                yAxisId="left"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#475569' }}
                allowDecimals={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                unit="%"
                stroke="#f59e0b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#f59e0b' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#020617',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: '#fff',
                }}
              />
              <Bar
                yAxisId="left"
                dataKey="count"
                name={t('paretoOccurrences')}
                fill="#0284c7"
                radius={[4, 4, 0, 0]}
                maxBarSize={35}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="cumulativePercentage"
                name={t('paretoCumulative')}
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#f59e0b' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tab 2: Equipment Failure Distribution */}
      {activeTab === 'equipment' && (
        <div className="h-64 sm:h-72 w-full relative">
          {equipmentData.length === 0 && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-[1px] text-center p-4">
              <Info className="w-8 h-8 text-slate-500 mb-2" />
              <p className="text-xs font-semibold text-slate-300 max-w-sm">
                {t('emptyMachinesText')}
              </p>
            </div>
          )}

          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={equipmentData}
              layout="vertical"
              margin={{ top: 10, right: 20, left: 30, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis
                type="number"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#475569' }}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#475569' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#020617',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: '#fff',
                }}
              />
              <Bar dataKey="falhas" name={t('paretoOccurrences')} radius={[0, 4, 4, 0]} maxBarSize={25}>
                {equipmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
