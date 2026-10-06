import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from '../i18n/LanguageContext';
import { ScheduledActivity, Machine, ActivityType, ActivityPriority, ActivityStatus } from '../types';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  CheckSquare,
  PlusCircle,
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Wrench,
  Activity,
  Layers,
  Sliders,
  Database,
  Trash2,
  X,
  Sparkles,
  ArrowRight,
  Check,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ActivitySchedulerProps {
  activities: ScheduledActivity[];
  machines: Machine[];
  onAddActivity: () => void;
  onUpdateActivity: (updatedActivity: ScheduledActivity) => void;
  onDeleteActivity: (activityId: string) => void;
  onLoadDemoActivities?: () => void;
}

export const ActivityScheduler: React.FC<ActivitySchedulerProps> = ({
  activities,
  machines,
  onAddActivity,
  onUpdateActivity,
  onDeleteActivity,
  onLoadDemoActivities,
}) => {
  const { t } = useTranslation();

  // Navigation & View state
  const [viewMode, setViewMode] = useState<'calendar' | 'table' | 'kanban'>('calendar');
  const [selectedActivity, setSelectedActivity] = useState<ScheduledActivity | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMachine, setFilterMachine] = useState<string>('all');

  // Calendar week navigation (reference date)
  const [currentWeekDate, setCurrentWeekDate] = useState<Date>(() => {
    // Current or fallback to 2026-09-13
    return new Date('2026-09-13T10:00:00');
  });

  // Calculate days of the current week (Monday to Sunday)
  const weekDays = useMemo(() => {
    const curr = new Date(currentWeekDate);
    const day = curr.getDay(); // 0 is Sun, 1 is Mon...
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(curr.setDate(diff));

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const isoStr = d.toISOString().split('T')[0];
      const dayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
      days.push({
        date: d,
        isoString: isoStr,
        dayOfWeek: dayNames[i],
        dayOfMonth: d.getDate(),
        month: d.toLocaleString('pt-BR', { month: 'short' }),
        isToday: isoStr === '2026-09-13' || isoStr === new Date().toISOString().split('T')[0],
      });
    }
    return days;
  }, [currentWeekDate]);

  const handlePrevWeek = () => {
    const prev = new Date(currentWeekDate);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeekDate);
    next.setDate(next.getDate() + 7);
    setCurrentWeekDate(next);
  };

  const handleToday = () => {
    setCurrentWeekDate(new Date('2026-09-13T10:00:00'));
  };

  // Filtered activities
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesText =
          act.title.toLowerCase().includes(q) ||
          act.machineName.toLowerCase().includes(q) ||
          (act.machineCode && act.machineCode.toLowerCase().includes(q)) ||
          act.assignedTechnician.toLowerCase().includes(q) ||
          act.id.toLowerCase().includes(q);
        if (!matchesText) return false;
      }
      // Type filter
      if (filterType !== 'all' && act.type !== filterType) return false;
      // Priority filter
      if (filterPriority !== 'all' && act.priority !== filterPriority) return false;
      // Status filter
      if (filterStatus !== 'all' && act.status !== filterStatus) return false;
      // Machine filter
      if (filterMachine !== 'all' && act.machineId !== filterMachine) return false;

      return true;
    });
  }, [activities, searchQuery, filterType, filterPriority, filterStatus, filterMachine]);

  // Overall Statistics
  const stats = useMemo(() => {
    const total = activities.length;
    const pending = activities.filter((a) => a.status === 'pendente').length;
    const inProgress = activities.filter((a) => a.status === 'em_andamento').length;
    const completed = activities.filter((a) => a.status === 'concluida').length;
    const adherence = total > 0 ? Math.round((completed / total) * 100) : 100;

    return { total, pending, inProgress, completed, adherence };
  }, [activities]);

  // Activity Status & Type Styling helpers
  const getTypeBadge = (type: ActivityType) => {
    switch (type) {
      case 'preventiva':
        return {
          label: 'Preventiva',
          bg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          icon: <Wrench className="w-3 h-3" />,
        };
      case 'preditiva':
        return {
          label: 'Preditiva / FFT',
          bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          icon: <Activity className="w-3 h-3" />,
        };
      case 'tpm_inspecao':
        return {
          label: 'TPM Autônomo',
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          icon: <Layers className="w-3 h-3" />,
        };
      case 'calibracao':
        return {
          label: 'Calibração',
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: <Sliders className="w-3 h-3" />,
        };
      case 'backup_auditoria':
        return {
          label: 'Backup CLP',
          bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          icon: <Database className="w-3 h-3" />,
        };
      case 'corretiva_programada':
        return {
          label: 'Corretiva Prog.',
          bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          icon: <AlertTriangle className="w-3 h-3" />,
        };
      default:
        return {
          label: type,
          bg: 'bg-slate-700/50 text-slate-300 border-slate-600',
          icon: <Wrench className="w-3 h-3" />,
        };
    }
  };

  const getPriorityBadge = (priority: ActivityPriority) => {
    switch (priority) {
      case 'critica':
        return {
          label: 'Crítica',
          bg: 'bg-rose-500/20 text-rose-400 border-rose-500/50',
          dot: 'bg-rose-500 animate-pulse',
        };
      case 'alta':
        return {
          label: 'Alta',
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          dot: 'bg-amber-500',
        };
      case 'media':
        return {
          label: 'Média',
          bg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          dot: 'bg-blue-500',
        };
      case 'baixa':
        return {
          label: 'Baixa',
          bg: 'bg-slate-700/50 text-slate-400 border-slate-600',
          dot: 'bg-slate-500',
        };
    }
  };

  const getStatusBadge = (status: ActivityStatus) => {
    switch (status) {
      case 'pendente':
        return {
          label: 'Pendente',
          badge: 'bg-slate-800 text-slate-300 border-slate-700',
        };
      case 'em_andamento':
        return {
          label: 'Em Execução',
          badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40 animate-pulse',
        };
      case 'concluida':
        return {
          label: 'Concluída',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        };
      case 'cancelada':
        return {
          label: 'Cancelada',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        };
    }
  };

  // Checklist toggle action
  const handleToggleChecklist = (activity: ScheduledActivity, taskId: string) => {
    const updatedChecklist = activity.checklist.map((item) =>
      item.id === taskId ? { ...item, completed: !item.completed } : item
    );

    const allCompleted = updatedChecklist.every((item) => item.completed);
    const hasAnyCompleted = updatedChecklist.some((item) => item.completed);

    let nextStatus: ActivityStatus = activity.status;
    if (allCompleted && activity.checklist.length > 0) {
      nextStatus = 'concluida';
    } else if (hasAnyCompleted && activity.status === 'pendente') {
      nextStatus = 'em_andamento';
    }

    const updated = {
      ...activity,
      checklist: updatedChecklist,
      status: nextStatus,
      completedAt: allCompleted ? new Date().toISOString().replace('T', ' ').slice(0, 16) : activity.completedAt,
    };

    onUpdateActivity(updated);
    if (selectedActivity?.id === activity.id) {
      setSelectedActivity(updated);
    }
  };

  // Status transitions
  const handleStartActivity = (activity: ScheduledActivity) => {
    const updated = { ...activity, status: 'em_andamento' as const };
    onUpdateActivity(updated);
    if (selectedActivity?.id === activity.id) {
      setSelectedActivity(updated);
    }
  };

  const handleCompleteActivity = (activity: ScheduledActivity) => {
    const completedChecklist = activity.checklist.map((item) => ({ ...item, completed: true }));
    const updated = {
      ...activity,
      status: 'concluida' as const,
      checklist: completedChecklist,
      completedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      completedBy: activity.assignedTechnician,
    };
    onUpdateActivity(updated);
    if (selectedActivity?.id === activity.id) {
      setSelectedActivity(updated);
    }
  };

  // PDF Export for Single Work Order (OS)
  const handleExportWorkOrderPDF = (activity: ScheduledActivity) => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const margin = 14;
      const pageWidth = doc.internal.pageSize.getWidth();

      // Top banner
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, pageWidth, 24, 'F');

      // Cyan accent line
      doc.setFillColor(6, 182, 212); // cyan-500
      doc.rect(0, 24, pageWidth, 1.5, 'F');

      // Header Text
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('DK AUTOMAÇÃO INDUSTRIAL', margin, 11);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text('ORDEM DE SERVIÇO & CRONOGRAMA DE MANUTENÇÃO TÉCNICA', margin, 17);

      // Right: OS Number
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(56, 189, 248);
      doc.text(`OS: ${activity.id}`, pageWidth - margin, 12, { align: 'right' });

      doc.setFontSize(8);
      doc.setTextColor(203, 213, 225);
      doc.text(`Emissão: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - margin, 18, { align: 'right' });

      let currentY = 32;

      // Title Section
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(activity.title, margin, currentY);
      currentY += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      const splitDesc = doc.splitTextToSize(activity.description, pageWidth - margin * 2);
      doc.text(splitDesc, margin, currentY);
      currentY += splitDesc.length * 4.5 + 4;

      // Safety Banner if LOTO is required
      if (activity.lotoRequired) {
        doc.setFillColor(254, 242, 242);
        doc.setDrawColor(239, 68, 68);
        doc.roundedRect(margin, currentY, pageWidth - margin * 2, 14, 2, 2, 'FD');

        doc.setTextColor(185, 28, 28);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text('ATENÇÃO: PROCEDIMENTO COM EXIGÊNCIA DE BLOQUEIO LOTO (NR-10 / NR-12)', margin + 4, currentY + 5.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(127, 29, 29);
        doc.text('Desenergizar fontes de potência elétrica, bloquear chave mecânica com cadeado e verificar ausência de tensão.', margin + 4, currentY + 10);
        currentY += 18;
      }

      // Metadata Table
      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['PARÂMETRO', 'INFORMAÇÃO TÉCNICA', 'PARÂMETRO', 'INFORMAÇÃO TÉCNICA']],
        body: [
          ['Equipamento', `${activity.machineName} (${activity.machineCode || 'N/A'})`, 'Tipo Atividade', activity.type.toUpperCase()],
          ['Setor / Área', activity.sector || 'Geral', 'Prioridade', activity.priority.toUpperCase()],
          ['Data Programada', `${activity.scheduledDate} às ${activity.scheduledTime}`, 'Duração Estimada', `${activity.estimatedDurationMinutes} minutos`],
          ['Técnico Responsável', activity.assignedTechnician, 'Turno Operacional', activity.shift],
          ['Status da Ordem', activity.status.toUpperCase(), 'Periodicidade', activity.recurrence.toUpperCase()],
        ],
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;

      // Checklist Table
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text('PROCEDIMENTOS & CHECKLIST DE EXECUÇÃO TÉCNICA', margin, currentY);
      currentY += 3;

      const checklistRows = activity.checklist.map((item, idx) => [
        `#${idx + 1}`,
        item.description,
        item.completed ? '[ X ] CONCLUÍDO' : '[   ] PENDENTE',
      ]);

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['ITEM', 'PROCEDIMENTO / TESTE OBRIGATÓRIO', 'STATUS']],
        body: checklistRows,
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 16, halign: 'center' },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 35, halign: 'center', fontStyle: 'bold' },
        },
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;

      // Observations
      if (activity.observations) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        doc.text('Observações & Requisitos Especiais:', margin, currentY);
        currentY += 4;
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        const splitObs = doc.splitTextToSize(activity.observations, pageWidth - margin * 2);
        doc.text(splitObs, margin, currentY);
        currentY += splitObs.length * 4 + 8;
      }

      // Signatures
      if (currentY > 240) {
        doc.addPage();
        currentY = 25;
      }

      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.3);

      const colWidth = (pageWidth - margin * 2 - 20) / 2;
      const sigY = Math.max(currentY + 20, 245);

      // Line 1: Technician
      doc.line(margin, sigY, margin + colWidth, sigY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text(activity.assignedTechnician, margin + colWidth / 2, sigY + 4, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('Técnico Executor de Campo', margin + colWidth / 2, sigY + 7.5, { align: 'center' });

      // Line 2: Supervisor
      const col2X = margin + colWidth + 20;
      doc.line(col2X, sigY, col2X + colWidth, sigY);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text('Supervisão de Manutenção DK', col2X + colWidth / 2, sigY + 4, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('Aprovação & Liberação de Máquina', col2X + colWidth / 2, sigY + 7.5, { align: 'center' });

      doc.save(`OS-${activity.id}-${activity.machineCode || 'MAQ'}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar OS em PDF:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-blue-600/30 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-500/40 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3 text-blue-400" />
                ISO 55000 / TPM
              </span>
              <span className="text-xs text-slate-400 font-mono">
                CRONOGRAMA OPERACIONAL
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Agendador de Atividades & Manutenções
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Planejamento preventivo, preditivo, inspeções autônomas TPM e calibrações com rastreabilidade de ordens de serviço.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {activities.length === 0 && onLoadDemoActivities && (
              <button
                onClick={onLoadDemoActivities}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Database className="w-4 h-4 text-cyan-400" />
                <span>Carregar Exemplo</span>
              </button>
            )}
            <button
              onClick={onAddActivity}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-transform active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nova Atividade / OS</span>
            </button>
          </div>
        </div>

        {/* Metric Cards with Smooth Hover Scale */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="group bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 p-3.5 sm:p-4 rounded-xl transition-all duration-300 ease-out transform hover:scale-[1.02] hover:-translate-y-0.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block group-hover:text-slate-300 transition-colors">
              Total Agendadas
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-white">{stats.total}</span>
              <span className="text-xs text-slate-400">atividades</span>
            </div>
          </div>

          <div className="group bg-slate-950/70 border border-slate-800/80 hover:border-amber-500/50 p-3.5 sm:p-4 rounded-xl transition-all duration-300 ease-out transform hover:scale-[1.02] hover:-translate-y-0.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block group-hover:text-slate-300 transition-colors">
              Pendentes
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-amber-400">{stats.pending}</span>
              <span className="text-xs text-slate-400">a executar</span>
            </div>
          </div>

          <div className="group bg-slate-950/70 border border-slate-800/80 hover:border-blue-500/50 p-3.5 sm:p-4 rounded-xl transition-all duration-300 ease-out transform hover:scale-[1.02] hover:-translate-y-0.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block group-hover:text-slate-300 transition-colors">
              Em Execução
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-blue-400">{stats.inProgress}</span>
              <span className="text-xs text-slate-400">em campo</span>
            </div>
          </div>

          <div className="group bg-slate-950/70 border border-slate-800/80 hover:border-emerald-500/50 p-3.5 sm:p-4 rounded-xl transition-all duration-300 ease-out transform hover:scale-[1.02] hover:-translate-y-0.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block group-hover:text-slate-300 transition-colors">
              Aderência ao Plano
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-400">{stats.adherence}%</span>
              <span className="text-xs text-slate-400">concluídas ({stats.completed})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls & Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* View mode switcher */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 w-fit">
            <button
              onClick={() => setViewMode('calendar')}
              className={`relative px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'calendar' ? 'text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {viewMode === 'calendar' && (
                <motion.span
                  layoutId="schedulerViewIndicator"
                  className="absolute inset-0 rounded-lg bg-blue-600 shadow-md shadow-blue-600/30 z-0"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Visão Semanal</span>
              </span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`relative px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'table' ? 'text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {viewMode === 'table' && (
                <motion.span
                  layoutId="schedulerViewIndicator"
                  className="absolute inset-0 rounded-lg bg-blue-600 shadow-md shadow-blue-600/30 z-0"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Lista Detalhada</span>
              </span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`relative px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'kanban' ? 'text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {viewMode === 'kanban' && (
                <motion.span
                  layoutId="schedulerViewIndicator"
                  className="absolute inset-0 rounded-lg bg-blue-600 shadow-md shadow-blue-600/30 z-0"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Quadro Kanban</span>
              </span>
            </button>
          </div>

          {/* Week Date Navigator (if calendar mode) */}
          {viewMode === 'calendar' && (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevWeek}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                title="Semana anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleToday}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
              >
                Hoje
              </button>
              <span className="text-xs font-bold text-slate-300 font-mono px-2">
                {weekDays[0].dayOfMonth} {weekDays[0].month} - {weekDays[6].dayOfMonth} {weekDays[6].month} (2026)
              </span>
              <button
                onClick={handleNextWeek}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                title="Próxima semana"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Filter Dropdowns & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-2 border-t border-slate-800/80">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar OS, máquina, técnico..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Type */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Todos os Tipos</option>
            <option value="preventiva">Manutenção Preventiva</option>
            <option value="preditiva">Preditiva / Termografia</option>
            <option value="tpm_inspecao">Checklist TPM Autônomo</option>
            <option value="calibracao">Calibração</option>
            <option value="backup_auditoria">Backup CLP / Auditoria</option>
            <option value="corretiva_programada">Corretiva Programada</option>
          </select>

          {/* Priority */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Todas as Prioridades</option>
            <option value="critica">Crítica</option>
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>

          {/* Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Todos os Status</option>
            <option value="pendente">Pendente</option>
            <option value="em_andamento">Em Execução</option>
            <option value="concluida">Concluída</option>
          </select>

          {/* Machine */}
          <select
            value={filterMachine}
            onChange={(e) => setFilterMachine(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Todas as Máquinas</option>
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.code} - {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ========================================== */}
      {/* 1, 2, 3: ANIMATED VIEW SWITCHER */}
      {/* ========================================== */}
      <AnimatePresence mode="wait">
        {viewMode === 'calendar' && (
          <motion.div
            key="scheduler-calendar-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="grid grid-cols-1 md:grid-cols-7 gap-3"
          >
            {weekDays.map((day) => {
              const dayActivities = filteredActivities.filter(
                (act) => act.scheduledDate === day.isoString
              );

              return (
                <div
                  key={day.isoString}
                  className={`flex flex-col rounded-xl border transition-all ${
                    day.isToday
                      ? 'bg-gradient-to-b from-blue-950/30 to-slate-900 border-blue-500/60 shadow-lg shadow-blue-950/20'
                      : 'bg-slate-900/90 border-slate-800/80'
                  }`}
                >
                {/* Column Day Header */}
                <div
                  className={`p-3 border-b flex items-center justify-between ${
                    day.isToday
                      ? 'border-blue-500/40 bg-blue-950/40'
                      : 'border-slate-800 bg-slate-950/50'
                  }`}
                >
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider ${
                        day.isToday ? 'text-blue-400' : 'text-slate-400'
                      }`}
                    >
                      {day.dayOfWeek}
                    </span>
                    <span
                      className={`text-sm font-black ${
                        day.isToday ? 'text-white' : 'text-slate-200'
                      }`}
                    >
                      {day.dayOfMonth}
                    </span>
                  </div>
                  {dayActivities.length > 0 && (
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold flex items-center justify-center">
                      {dayActivities.length}
                    </span>
                  )}
                </div>

                {/* Day Tasks List */}
                <div className="p-2 space-y-2 flex-1 min-h-[160px]">
                  {dayActivities.length === 0 ? (
                    <div className="h-full flex items-center justify-center py-6 text-center">
                      <span className="text-[11px] text-slate-600 font-medium">
                        Sem atividade
                      </span>
                    </div>
                  ) : (
                    dayActivities.map((act) => {
                      const typeStyle = getTypeBadge(act.type);
                      const priorityStyle = getPriorityBadge(act.priority);
                      const completedCount = act.checklist.filter((i) => i.completed).length;
                      const totalCount = act.checklist.length;
                      const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

                      return (
                        <div
                          key={act.id}
                          onClick={() => setSelectedActivity(act)}
                          className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all duration-200 transform hover:scale-[1.02] hover:-translate-y-0.5 ${
                            act.status === 'concluida'
                              ? 'bg-slate-950/60 border-slate-800/80 opacity-75 hover:opacity-100'
                              : act.status === 'em_andamento'
                              ? 'bg-blue-950/40 border-blue-500/60 shadow-sm'
                              : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {/* Top Tag & Time */}
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase flex items-center gap-1 ${typeStyle.bg}`}
                            >
                              {typeStyle.icon}
                              {typeStyle.label}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {act.scheduledTime}
                            </span>
                          </div>

                          {/* Title */}
                          <h4 className="text-xs font-bold text-white line-clamp-2 mb-1 leading-snug">
                            {act.title}
                          </h4>

                          {/* Machine Name */}
                          <p className="text-[10px] text-slate-400 truncate mb-2">
                            {act.machineName}
                          </p>

                          {/* Checklist mini-progress */}
                          {totalCount > 0 && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[9px] text-slate-400">
                                <span>Checklist</span>
                                <span>
                                  {completedCount}/{totalCount}
                                </span>
                              </div>
                              <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    act.status === 'concluida'
                                      ? 'bg-emerald-500'
                                      : 'bg-blue-500'
                                  }`}
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Priority and LOTO footer */}
                          <div className="flex items-center justify-between pt-1.5 mt-1.5 border-t border-slate-800/60 text-[10px]">
                            <span className="flex items-center gap-1 text-slate-400">
                              <span className={`w-1.5 h-1.5 rounded-full ${priorityStyle.dot}`} />
                              {priorityStyle.label}
                            </span>
                            {act.lotoRequired && (
                              <span className="text-rose-400 flex items-center gap-0.5 font-bold" title="LOTO Obrigatório">
                                <ShieldAlert className="w-3 h-3" />
                                LOTO
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
          </motion.div>
        )}

        {/* ========================================== */}
        {/* 2. TABLE VIEW (DETAILED LIST) */}
        {/* ========================================== */}
        {viewMode === 'table' && (
          <motion.div
            key="scheduler-table-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl"
          >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 text-[11px] uppercase tracking-wider font-bold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">OS / Código</th>
                  <th className="py-3 px-4">Atividade / Escopo</th>
                  <th className="py-3 px-4">Equipamento (TAG)</th>
                  <th className="py-3 px-4">Tipo & Prioridade</th>
                  <th className="py-3 px-4">Data & Horário</th>
                  <th className="py-3 px-4">Checklist</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredActivities.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-500">
                      Nenhuma atividade encontrada com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredActivities.map((act) => {
                    const typeStyle = getTypeBadge(act.type);
                    const priorityStyle = getPriorityBadge(act.priority);
                    const statusStyle = getStatusBadge(act.status);
                    const completedCount = act.checklist.filter((i) => i.completed).length;
                    const totalCount = act.checklist.length;
                    const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

                    return (
                      <tr
                        key={act.id}
                        onClick={() => setSelectedActivity(act)}
                        className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-white whitespace-nowrap">
                          {act.id}
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                            {act.title}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            Resp: {act.assignedTechnician} ({act.shift})
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-200">{act.machineName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {act.machineCode || 'S/N'} • {act.sector}
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap space-y-1">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${typeStyle.bg}`}
                          >
                            {typeStyle.icon}
                            {typeStyle.label}
                          </span>
                          <div>
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border ${priorityStyle.bg}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${priorityStyle.dot}`} />
                              {priorityStyle.label}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-300">
                          <div>{act.scheduledDate}</div>
                          <div className="text-[11px] text-slate-500">
                            {act.scheduledTime} ({act.estimatedDurationMinutes}m)
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap min-w-[120px]">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                            <span>Progresso</span>
                            <span className="font-mono">
                              {completedCount}/{totalCount}
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-blue-500 h-full rounded-full transition-all"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${statusStyle.badge}`}
                          >
                            {statusStyle.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleExportWorkOrderPDF(act)}
                              title="Baixar Ordem de Serviço em PDF"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 border border-slate-700 transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                            {act.status === 'pendente' && (
                              <button
                                type="button"
                                onClick={() => handleStartActivity(act)}
                                title="Iniciar Execução"
                                className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow transition-colors"
                              >
                                <Play className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {act.status === 'em_andamento' && (
                              <button
                                type="button"
                                onClick={() => handleCompleteActivity(act)}
                                title="Concluir Atividade"
                                className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow transition-colors"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          </motion.div>
        )}

        {/* ========================================== */}
        {/* 3. KANBAN BOARD VIEW */}
        {/* ========================================== */}
        {viewMode === 'kanban' && (
          <motion.div
            key="scheduler-kanban-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
          {/* Pendentes */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col min-h-[400px]">
            <div className="p-3.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Pendentes ({filteredActivities.filter((a) => a.status === 'pendente').length})
                </h3>
              </div>
            </div>
            <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[600px]">
              {filteredActivities
                .filter((a) => a.status === 'pendente')
                .map((act) => (
                  <KanbanCard
                    key={act.id}
                    activity={act}
                    onOpen={() => setSelectedActivity(act)}
                    onStart={() => handleStartActivity(act)}
                    onComplete={() => handleCompleteActivity(act)}
                    getTypeBadge={getTypeBadge}
                    getPriorityBadge={getPriorityBadge}
                  />
                ))}
            </div>
          </div>

          {/* Em Execução */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col min-h-[400px]">
            <div className="p-3.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Em Execução ({filteredActivities.filter((a) => a.status === 'em_andamento').length})
                </h3>
              </div>
            </div>
            <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[600px]">
              {filteredActivities
                .filter((a) => a.status === 'em_andamento')
                .map((act) => (
                  <KanbanCard
                    key={act.id}
                    activity={act}
                    onOpen={() => setSelectedActivity(act)}
                    onStart={() => handleStartActivity(act)}
                    onComplete={() => handleCompleteActivity(act)}
                    getTypeBadge={getTypeBadge}
                    getPriorityBadge={getPriorityBadge}
                  />
                ))}
            </div>
          </div>

          {/* Concluídas */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col min-h-[400px]">
            <div className="p-3.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Concluídas ({filteredActivities.filter((a) => a.status === 'concluida').length})
                </h3>
              </div>
            </div>
            <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[600px]">
              {filteredActivities
                .filter((a) => a.status === 'concluida')
                .map((act) => (
                  <KanbanCard
                    key={act.id}
                    activity={act}
                    onOpen={() => setSelectedActivity(act)}
                    onStart={() => handleStartActivity(act)}
                    onComplete={() => handleCompleteActivity(act)}
                    getTypeBadge={getTypeBadge}
                    getPriorityBadge={getPriorityBadge}
                  />
                ))}
            </div>
          </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================== */}
      {/* 4. TASK DETAIL & CHECKLIST EXECUTION MODAL */}
      {/* ========================================== */}
      <AnimatePresence>
        {selectedActivity && (
          <motion.div
            key="scheduler-detail-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
            onClick={() => setSelectedActivity(null)}
          >
            <motion.div
              key="scheduler-detail-card"
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-6"
            >
            {/* Modal Header */}
            <div className="bg-slate-950 p-5 border-b border-slate-800 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-xs font-bold text-blue-400">
                    {selectedActivity.id}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                      getTypeBadge(selectedActivity.type).bg
                    }`}
                  >
                    {getTypeBadge(selectedActivity.type).label}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                      getPriorityBadge(selectedActivity.priority).bg
                    }`}
                  >
                    {getPriorityBadge(selectedActivity.priority).label}
                  </span>
                </div>
                <h2 className="text-lg font-black text-white leading-tight">
                  {selectedActivity.title}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {selectedActivity.machineName} ({selectedActivity.machineCode}) • {selectedActivity.sector}
                </p>
              </div>
              <button
                onClick={() => setSelectedActivity(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* LOTO Alert Banner */}
              {selectedActivity.lotoRequired && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3">
                  <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold text-rose-300 block">
                      Protocolo de Bloqueio Obrigatório (LOTO / NR-10)
                    </span>
                    <span className="text-rose-200/80">
                      Desenergize, bloqueie a chave mecânica e comprove ausência de tensão antes de iniciar.
                    </span>
                  </div>
                </div>
              )}

              {/* Scope */}
              <div className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Escopo da Intervenção
                </span>
                {selectedActivity.description}
              </div>

              {/* Meta details grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block">Data & Horário</span>
                  <span className="font-bold text-white">
                    {selectedActivity.scheduledDate} - {selectedActivity.scheduledTime}
                  </span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block">Duração Estimada</span>
                  <span className="font-bold text-white">
                    {selectedActivity.estimatedDurationMinutes} min
                  </span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block">Técnico Resp.</span>
                  <span className="font-bold text-white truncate block">
                    {selectedActivity.assignedTechnician}
                  </span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] text-slate-500 block">Status Atual</span>
                  <span className="font-bold text-blue-400 uppercase">
                    {getStatusBadge(selectedActivity.status).label}
                  </span>
                </div>
              </div>

              {/* Interactive Checklist Tasks */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-blue-400" />
                    Procedimentos Técnicos do Checklist ({selectedActivity.checklist.filter((i) => i.completed).length}/{selectedActivity.checklist.length})
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Clique para marcar conclusão
                  </span>
                </div>

                <div className="space-y-1.5">
                  {selectedActivity.checklist.map((item, idx) => (
                    <div
                      key={item.id}
                      onClick={() => handleToggleChecklist(selectedActivity, item.id)}
                      className={`p-2.5 rounded-lg border text-xs flex items-center gap-3 cursor-pointer transition-colors ${
                        item.completed
                          ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-200'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border ${
                          item.completed
                            ? 'bg-emerald-600 border-emerald-500 text-white'
                            : 'border-slate-600 bg-slate-900'
                        }`}
                      >
                        {item.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <span className={`${item.completed ? 'line-through text-slate-400' : ''}`}>
                        {item.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Observations */}
              {selectedActivity.observations && (
                <div className="text-xs text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                  <span className="font-bold text-slate-300 block mb-0.5">Observações Adicionais:</span>
                  {selectedActivity.observations}
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="bg-slate-950 p-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onDeleteActivity(selectedActivity.id);
                    setSelectedActivity(null);
                  }}
                  className="p-2 rounded-xl text-rose-400 hover:text-rose-300 bg-slate-800 hover:bg-rose-950/40 border border-slate-700 transition-colors"
                  title="Excluir Atividade"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleExportWorkOrderPDF(selectedActivity)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Emitir OS em PDF</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {selectedActivity.status === 'pendente' && (
                  <button
                    type="button"
                    onClick={() => handleStartActivity(selectedActivity)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Iniciar Atividade</span>
                  </button>
                )}
                {selectedActivity.status !== 'concluida' && (
                  <button
                    type="button"
                    onClick={() => handleCompleteActivity(selectedActivity)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Concluir Atividade</span>
                  </button>
                )}
              </div>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Auxiliary Kanban Card Component with Smooth Hover Scale
interface KanbanCardProps {
  activity: ScheduledActivity;
  onOpen: () => void;
  onStart: () => void;
  onComplete: () => void;
  getTypeBadge: (type: ActivityType) => { label: string; bg: string; icon: React.ReactNode };
  getPriorityBadge: (priority: ActivityPriority) => { label: string; bg: string; dot: string };
}

const KanbanCard: React.FC<KanbanCardProps> = ({
  activity,
  onOpen,
  onStart,
  onComplete,
  getTypeBadge,
  getPriorityBadge,
}) => {
  const typeStyle = getTypeBadge(activity.type);
  const priorityStyle = getPriorityBadge(activity.priority);
  const completedCount = activity.checklist.filter((i) => i.completed).length;
  const totalCount = activity.checklist.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div
      onClick={onOpen}
      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 hover:border-slate-700 transition-all duration-300 ease-out transform hover:scale-[1.02] hover:-translate-y-0.5 shadow-sm cursor-pointer"
    >
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <span
          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase flex items-center gap-1 ${typeStyle.bg}`}
        >
          {typeStyle.icon}
          {typeStyle.label}
        </span>
        <span className="font-mono text-[10px] text-slate-400">{activity.id}</span>
      </div>

      <h4 className="text-xs font-bold text-white line-clamp-2 mb-1">{activity.title}</h4>
      <p className="text-[10px] text-slate-400 truncate mb-2.5">
        {activity.machineName} ({activity.machineCode})
      </p>

      {/* Progress */}
      {totalCount > 0 && (
        <div className="space-y-1 mb-2.5">
          <div className="flex items-center justify-between text-[9px] text-slate-400">
            <span>Checklist</span>
            <span>
              {completedCount}/{totalCount}
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                activity.status === 'concluida' ? 'bg-emerald-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer info & quick transition button */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
        <span className="flex items-center gap-1 font-mono">
          <Clock className="w-3 h-3 text-slate-500" />
          {activity.scheduledDate} {activity.scheduledTime}
        </span>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {activity.status === 'pendente' && (
            <button
              onClick={onStart}
              className="p-1 rounded bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 transition-colors"
              title="Iniciar"
            >
              <Play className="w-3 h-3" />
            </button>
          )}
          {activity.status === 'em_andamento' && (
            <button
              onClick={onComplete}
              className="p-1 rounded bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 transition-colors"
              title="Concluir"
            >
              <Check className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
