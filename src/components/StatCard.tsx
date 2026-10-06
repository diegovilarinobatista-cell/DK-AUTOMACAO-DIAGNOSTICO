import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  badge?: string;
  trend?: {
    value: string;
    isPositive: boolean;
    label: string;
  };
  icon: LucideIcon;
  variant?: 'default' | 'critical' | 'warning' | 'success' | 'blue';
  onClick?: () => void;
  pulse?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  id,
  title,
  value,
  subtitle,
  badge,
  trend,
  icon: Icon,
  variant = 'default',
  onClick,
  pulse = false,
}) => {
  const variantStyles = {
    default: {
      border: 'border-slate-700/60 hover:border-slate-500/80',
      bg: 'bg-slate-900',
      badgeBg: 'bg-slate-800 text-slate-300 border-slate-700',
      iconBg: 'bg-slate-800 text-slate-300 group-hover:bg-slate-700/80',
      accent: 'text-slate-100',
    },
    critical: {
      border: 'border-rose-700/50 hover:border-rose-500/80',
      bg: 'bg-gradient-to-b from-slate-900 to-rose-950/20',
      badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      iconBg: 'bg-rose-500/20 text-rose-400 group-hover:bg-rose-500/30',
      accent: 'text-rose-400',
    },
    warning: {
      border: 'border-amber-600/50 hover:border-amber-500/80',
      bg: 'bg-gradient-to-b from-slate-900 to-amber-950/20',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      iconBg: 'bg-amber-500/20 text-amber-400 group-hover:bg-amber-500/30',
      accent: 'text-amber-400',
    },
    success: {
      border: 'border-emerald-700/50 hover:border-emerald-500/80',
      bg: 'bg-gradient-to-b from-slate-900 to-emerald-950/20',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      iconBg: 'bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/30',
      accent: 'text-emerald-400',
    },
    blue: {
      border: 'border-blue-600/50 hover:border-blue-500/80',
      bg: 'bg-gradient-to-b from-slate-900 to-blue-950/20',
      badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      iconBg: 'bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30',
      accent: 'text-blue-400',
    },
  };

  const style = variantStyles[variant];

  return (
    <motion.div
      id={id}
      onClick={onClick}
      whileHover={{ scale: 1.035, y: -2 }}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      transition={{ type: 'spring', stiffness: 420, damping: 26 }}
      className={`group rounded-xl border p-4 sm:p-5 shadow-lg transition-colors duration-200 will-change-transform ${style.bg} ${style.border} ${
        pulse ? 'animate-pulse ring-2 ring-rose-500/80 border-rose-500 shadow-xl shadow-rose-950/60' : ''
      } ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {pulse && (
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            )}
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider truncate group-hover:text-slate-300 transition-colors duration-200">
              {title}
            </p>
          </div>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-white group-hover:text-white transition-colors">{value}</span>
            {badge && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase transition-transform duration-200 group-hover:scale-105 ${style.badgeBg}`}>
                {badge}
              </span>
            )}
          </div>
        </div>
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 relative ${
            pulse ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50' : style.iconBg
          }`}
        >
          <Icon className={`w-5 h-5 transition-transform duration-300 ${pulse ? 'animate-pulse text-rose-400' : ''}`} />
          {pulse && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-slate-900 animate-ping"></span>
          )}
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          {subtitle && <span className="text-slate-400 truncate">{subtitle}</span>}
          {trend && (
            <span className={`font-mono font-semibold shrink-0 ${trend.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trend.value} <span className="text-slate-500 font-normal">{trend.label}</span>
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
};
