import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from './components/Navbar';
import { StatCard } from './components/StatCard';
import { FailuresPeriodChart } from './components/FailuresPeriodChart';
import { ParetoAndEquipmentCharts } from './components/ParetoAndEquipmentCharts';
import { QuickActionsCard } from './components/QuickActionsCard';
import { RecentFailuresTable } from './components/RecentFailuresTable';
import { MachinesStatusSection } from './components/MachinesStatusSection';
import { DiagnosticModal } from './components/DiagnosticModal';
import { AddMachineModal } from './components/AddMachineModal';
import { ActivityScheduler } from './components/ActivityScheduler';
import { NewActivityModal } from './components/NewActivityModal';
import { LoginScreen } from './components/LoginScreen';
import { DEMO_MACHINES, DEMO_FAILURES, DEMO_SCHEDULED_ACTIVITIES } from './data/mockData';
import { IndustrialFailure, Machine, ScheduledActivity } from './types';
import { useTranslation } from './i18n/LanguageContext';
import { CriticalAlarmModal } from './components/CriticalAlarmModal';
import { CriticalAlarmBanner } from './components/CriticalAlarmBanner';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { PlantLocationModal } from './components/PlantLocationModal';
import { alarmAudioService } from './services/alarmAudioService';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Cpu,
  Layers,
  Percent,
  Server,
  Wrench,
  FileText,
  ShieldCheck,
  BookOpen,
  PlusCircle,
  RotateCcw,
  Sparkles,
  X,
  Factory,
  MapPin,
} from 'lucide-react';

export default function App() {
  const { t } = useTranslation();

  // Authentication State with password '01dkautomacao'
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('dk_auth_token') === '01dkautomacao_authenticated';
  });

  const [currentUser, setCurrentUser] = useState<string>(() => {
    return localStorage.getItem('dk_auth_user') || 'Técnico DK';
  });

  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isDiagnosticModalOpen, setIsDiagnosticModalOpen] = useState(false);
  const [isAddMachineModalOpen, setIsAddMachineModalOpen] = useState(false);
  const [isNewActivityModalOpen, setIsNewActivityModalOpen] = useState(false);
  const [selectedFailure, setSelectedFailure] = useState<IndustrialFailure | null>(null);

  // Modal for confirming zeroing/resetting data
  const [isResetConfirmModalOpen, setIsResetConfirmModalOpen] = useState(false);

  // Critical Alarm & Audio Notification System states
  const [activeCriticalAlarmFailure, setActiveCriticalAlarmFailure] = useState<IndustrialFailure | null>(null);
  const [isCriticalAlarmModalOpen, setIsCriticalAlarmModalOpen] = useState(false);

  // User Plant & Location states (persisted in localStorage)
  const [currentPlant, setCurrentPlant] = useState<string>(() => {
    return localStorage.getItem('dk_user_plant') || 'Planta 01 - SP';
  });
  const [currentLocation, setCurrentLocation] = useState<string>(() => {
    return localStorage.getItem('dk_user_location') || 'Linha 01 - Usinagem de Precisão';
  });
  const [isPlantLocationModalOpen, setIsPlantLocationModalOpen] = useState(false);

  // Toast feedback message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSavePlantLocation = (newPlant: string, newLocation: string) => {
    setCurrentPlant(newPlant);
    setCurrentLocation(newLocation);
    localStorage.setItem('dk_user_plant', newPlant);
    localStorage.setItem('dk_user_location', newLocation);
    setToastMessage(`Planta alterada para: "${newPlant}" • Local: "${newLocation}"`);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Zeroed Data state by default (as explicitly requested: "deixe os dados todos zerados para serem preenxidos")
  const [machines, setMachines] = useState<Machine[]>(() => {
    const saved = localStorage.getItem('dk_user_machines');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing stored machines', e);
      }
    }
    // Default to empty/zeroed state
    return [];
  });

  const [failures, setFailures] = useState<IndustrialFailure[]>(() => {
    const saved = localStorage.getItem('dk_user_failures');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing stored failures', e);
      }
    }
    // Default to empty/zeroed state
    return [];
  });

  const [activities, setActivities] = useState<ScheduledActivity[]>(() => {
    const saved = localStorage.getItem('dk_user_activities');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing stored activities', e);
      }
    }
    // Default to empty/zeroed state
    return [];
  });

  // Persist user added data
  useEffect(() => {
    localStorage.setItem('dk_user_machines', JSON.stringify(machines));
  }, [machines]);

  useEffect(() => {
    localStorage.setItem('dk_user_failures', JSON.stringify(failures));
  }, [failures]);

  useEffect(() => {
    localStorage.setItem('dk_user_activities', JSON.stringify(activities));
  }, [activities]);

  // Auth Handlers
  const handleLoginSuccess = (userIdentifier: string) => {
    setIsAuthenticated(true);
    setCurrentUser(userIdentifier);
  };

  const handleLogout = () => {
    alarmAudioService.stopAlarm();
    localStorage.removeItem('dk_auth_token');
    setIsAuthenticated(false);
  };

  // Zeroing & Demo Data Handlers
  const handleResetData = () => {
    setIsResetConfirmModalOpen(true);
  };

  const handleConfirmResetData = () => {
    alarmAudioService.stopAlarm();
    setIsCriticalAlarmModalOpen(false);
    setActiveCriticalAlarmFailure(null);
    setSelectedFailure(null);
    setMachines([]);
    setFailures([]);
    setActivities([]);
    localStorage.removeItem('dk_user_machines');
    localStorage.removeItem('dk_user_failures');
    localStorage.removeItem('dk_user_activities');
    localStorage.setItem('dk_user_machines', '[]');
    localStorage.setItem('dk_user_failures', '[]');
    localStorage.setItem('dk_user_activities', '[]');
    setIsResetConfirmModalOpen(false);
    setToastMessage('Todos os dados foram zerados com sucesso! O sistema está 100% limpo.');
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleLoadDemoData = () => {
    setMachines(DEMO_MACHINES);
    setFailures(DEMO_FAILURES);
    setActivities(DEMO_SCHEDULED_ACTIVITIES);
    setToastMessage('Dados de exemplo carregados com sucesso.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Activity Handlers
  const handleAddActivity = (newActivity: ScheduledActivity) => {
    setActivities((prev) => [newActivity, ...prev]);
  };

  const handleUpdateActivity = (updatedActivity: ScheduledActivity) => {
    setActivities((prev) => prev.map((a) => (a.id === updatedActivity.id ? updatedActivity : a)));
  };

  const handleDeleteActivity = (activityId: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== activityId));
  };

  // Modal actions
  const handleOpenDiagnostic = (failure?: IndustrialFailure) => {
    setSelectedFailure(failure || null);
    setIsDiagnosticModalOpen(true);
  };

  const handleSaveDiagnostic = (newFailure: IndustrialFailure) => {
    setFailures((prev) => [newFailure, ...prev.filter((f) => f.id !== newFailure.id)]);

    // Check if newly saved failure is CRITICAL and unresolved
    if (newFailure.severity === 'CRITICA' && newFailure.status !== 'completed') {
      alarmAudioService.playCriticalAlarm();
      setActiveCriticalAlarmFailure(newFailure);
      setIsCriticalAlarmModalOpen(true);
    }
  };

  const handleAcknowledgeCriticalAlarm = (acknowledgedFailure: IndustrialFailure) => {
    alarmAudioService.stopAlarm();
    setFailures((prev) =>
      prev.map((f) => (f.id === acknowledgedFailure.id ? acknowledgedFailure : f))
    );
    setIsCriticalAlarmModalOpen(false);
  };

  const handleOpenDiagnosticFromAlarm = (failure: IndustrialFailure) => {
    alarmAudioService.stopAlarm();
    setIsCriticalAlarmModalOpen(false);
    handleOpenDiagnostic(failure);
  };

  const handleSimulateCriticalAlarm = () => {
    const existingMachine = machines[0];
    const targetMachine: Machine = existingMachine || {
      id: 'm-cnc-01',
      name: 'Centro de Usinagem CNC 5 Eixos',
      code: 'CNC-05-US',
      manufacturer: 'Siemens / DMG Mori',
      model: 'Sinumerik 840D sl',
      serialNumber: 'SN-2024-DMG-09',
      sector: 'Usinagem de Precisão',
      line: 'Linha A',
      year: 2023,
      operatingHours: 1420,
      lastMaintenance: '2026-09-15',
      status: 'critical_stopped',
      criticalFailuresCount: 1,
      criticalityThreshold: 2,
      mtbfHours: 120,
      mttrHours: 1.5,
    };

    if (!existingMachine) {
      setMachines([targetMachine]);
    } else {
      setMachines((prev) =>
        prev.map((m) =>
          m.id === targetMachine.id
            ? { ...m, criticalFailuresCount: (m.criticalFailuresCount || 0) + 1, status: 'critical_stopped' }
            : m
        )
      );
    }

    const simulatedFailure: IndustrialFailure = {
      id: `FL-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      machineId: targetMachine.id,
      machineName: targetMachine.name,
      errorCode: 'F30002 / DC-BUS OVERVOLTAGE',
      symptom: 'Parada de emergência com trip no inversor de tração. Barramento CC atingiu 795V com sobrecarga térmica no resistor de frenagem.',
      severity: 'CRITICA',
      status: 'in_progress',
      reportedAt: 'Hoje às ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      detectedBy: currentUser,
      probableCause: 'Chopper de frenagem dinâmico aberto / Falha no módulo IGBT de desaceleração rápida',
      downtimeMinutes: 45,
      shift: 'Turno 1',
    };

    setFailures((prev) => [simulatedFailure, ...prev]);

    // Trigger audio siren and persistent modal immediately
    alarmAudioService.playCriticalAlarm();
    setActiveCriticalAlarmFailure(simulatedFailure);
    setIsCriticalAlarmModalOpen(true);
  };

  const handleSaveMachine = (newMachine: Machine, suggestedActivity?: ScheduledActivity) => {
    setMachines((prev) => [newMachine, ...prev.filter((m) => m.id !== newMachine.id)]);
    if (suggestedActivity) {
      setActivities((prev) => [suggestedActivity, ...prev]);
      const avail = newMachine.mtbfHours && newMachine.mttrHours
        ? ((newMachine.mtbfHours / (newMachine.mtbfHours + newMachine.mttrHours)) * 100).toFixed(1)
        : '99.2';
      setToastMessage(
        `Máquina "${newMachine.name}" cadastrada! MTBF: ${newMachine.mtbfHours}h • MTTR: ${newMachine.mttrHours}h • Disponibilidade: ${avail}% (Plano preventivo gerado)`
      );
    } else {
      setToastMessage(`Máquina "${newMachine.name}" cadastrada com sucesso!`);
    }
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleSelectMachine = (machine: Machine) => {
    const relatedFailure = failures.find((f) => f.machineId === machine.id);
    handleOpenDiagnostic(relatedFailure);
  };

  // Calculate dynamic KPIs from current data
  const totalDiagnosticos = failures.length;
  const diagnosticosEmAndamento = failures.filter((f) => f.status === 'in_progress').length;
  const falhasCriticas = failures.filter((f) => f.severity === 'CRITICA').length;
  const maquinasCadastradas = machines.length;
  const falhasRecorrentes = failures.filter((f) => f.severity === 'ALTA' || f.severity === 'CRITICA').length;
  const diagnosticosResolvidos = failures.filter((f) => f.status === 'completed').length;

  // Falhas com prioridade alta ou crítica não resolvidas
  const unresolvedHighOrCriticalFailures = failures.filter(
    (f) => (f.severity === 'CRITICA' || f.severity === 'ALTA') && f.status !== 'completed'
  );
  const hasUnresolvedHighOrCritical = unresolvedHighOrCriticalFailures.length > 0;

  // Falhas Críticas não reconhecidas pelo operador para banner persistente
  const unacknowledgedCriticalFailures = failures.filter(
    (f) => f.severity === 'CRITICA' && f.status !== 'completed' && !f.acknowledgedAt
  );

  const calculatedMtbf =
    machines.length > 0
      ? Math.round(machines.reduce((acc, m) => acc + (m.mtbfHours || 0), 0) / machines.length)
      : 0;

  const calculatedMttr =
    failures.length > 0
      ? (failures.reduce((acc, f) => acc + (f.downtimeMinutes || 0), 0) / failures.length / 60).toFixed(1)
      : '0.0';

  const calculatedOee =
    machines.length > 0
      ? Math.round((machines.filter((m) => m.status === 'operational').length / machines.length) * 100)
      : 0;

  const isDataZeroed = machines.length === 0 && failures.length === 0 && activities.length === 0;

  // If not authenticated, display the Login Screen
  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Industrial Top Navbar */}
      <Navbar
        onNewDiagnostic={() => handleOpenDiagnostic()}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        onResetData={handleResetData}
        onLoadDemoData={handleLoadDemoData}
        isDataZeroed={isDataZeroed}
        currentPlant={currentPlant}
        currentLocation={currentLocation}
        onOpenPlantLocation={() => setIsPlantLocationModalOpen(true)}
      />

      {/* Floating System Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-20 right-4 z-[130] bg-slate-900 border border-blue-500/80 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 max-w-md backdrop-blur-md"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold leading-snug">{toastMessage}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg ml-auto hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Sticky Persistent Alert Banner for Unacknowledged Critical Alarms */}
        <CriticalAlarmBanner
          unacknowledgedFailures={unacknowledgedCriticalFailures}
          onViewAlarm={(failure) => {
            setActiveCriticalAlarmFailure(failure);
            setIsCriticalAlarmModalOpen(true);
          }}
          onOpenDiagnostic={handleOpenDiagnosticFromAlarm}
        />
        {/* Zeroed Data Notification / Quick Onboarding Banner */}
        {isDataZeroed && (
          <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{t('zeroDataNotificationTitle')}</span>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/40">
                    PRONTO
                  </span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  {t('zeroDataNotificationDesc')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <button
                onClick={() => setIsAddMachineModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-700/30 transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t('btnAddMachine')}</span>
              </button>
              <button
                onClick={handleLoadDemoData}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                {t('loadDemo')}
              </button>
            </div>
          </div>
        )}

        {/* MAIN TAB SWITCHER WITH SMOOTH ANIMATED TRANSITIONS */}
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="tab-dashboard"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6"
            >
              {/* Header Title with Subtitle and Quick Date Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {t('dashboardTitle')}
                  </h1>
                  <span className="bg-blue-600/30 border border-blue-500/50 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded">
                    {t('realTime')}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t('dashboardSubtitle')}
                </p>
              </div>

              {/* Status and shift tag */}
              <div className="flex items-center gap-2 text-xs">
                <span className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300 font-mono flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  {t('shift1')}
                </span>
                {!isDataZeroed && (
                  <button
                    onClick={handleResetData}
                    id="btn-zerar-dados-dashboard"
                    title={t('resetData')}
                    className="bg-slate-900 hover:bg-rose-950/80 text-rose-300 border border-slate-800 hover:border-rose-700/60 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm active:scale-95"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                    <span>{t('resetData')}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Actions Hero Card ("NOVO DIAGNÓSTICO" with Mobile Touch Targets) */}
            <QuickActionsCard
              onStartDiagnostic={() => handleOpenDiagnostic()}
              onCameraHMI={() => handleOpenDiagnostic()}
              onCameraPlate={() => handleOpenDiagnostic()}
              onErrorCode={() => handleOpenDiagnostic()}
              onSimulateCriticalFault={handleSimulateCriticalAlarm}
            />

            {/* KPI Summary Cards Grid - Zeroed / Dynamic */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Diagnósticos Realizados */}
              <StatCard
                id="kpi-diagnosticos-realizados"
                title={t('kpiDiagnostics')}
                value={totalDiagnosticos}
                subtitle={totalDiagnosticos === 0 ? t('emptyRecords') : `${totalDiagnosticos} acumulados`}
                icon={FileText}
                variant="blue"
              />

              {/* Diagnósticos Em Andamento */}
              <StatCard
                id="kpi-diagnosticos-andamento"
                title={t('kpiInProgress')}
                value={diagnosticosEmAndamento}
                subtitle={diagnosticosEmAndamento === 0 ? t('emptyRecords') : `${diagnosticosEmAndamento} ativos`}
                icon={Clock}
                variant="warning"
              />

              {/* Falhas Críticas */}
              <StatCard
                id="kpi-falhas-criticas"
                title={t('kpiCritical')}
                value={falhasCriticas}
                subtitle={
                  falhasCriticas === 0
                    ? t('emptyRecords')
                    : hasUnresolvedHighOrCritical
                    ? `${unresolvedHighOrCriticalFailures.length} ativa(s) crítica/alta`
                    : `${falhasCriticas} linhas paradas`
                }
                badge={hasUnresolvedHighOrCritical ? 'ALERTA ATIVO' : undefined}
                icon={AlertOctagon}
                variant="critical"
                pulse={hasUnresolvedHighOrCritical}
              />

              {/* Máquinas Cadastradas */}
              <StatCard
                id="kpi-maquinas-cadastradas"
                title={t('kpiMachines')}
                value={maquinasCadastradas}
                subtitle={maquinasCadastradas === 0 ? t('emptyRecords') : `${maquinasCadastradas} ativas`}
                icon={Server}
                variant="default"
              />

              {/* Falhas Recorrentes */}
              <StatCard
                id="kpi-falhas-recorrentes"
                title={t('kpiRecurrent')}
                value={falhasRecorrentes}
                subtitle={falhasRecorrentes === 0 ? t('emptyRecords') : `${falhasRecorrentes} reincidentes`}
                icon={AlertTriangle}
                variant="warning"
              />

              {/* Diagnósticos Resolvidos */}
              <StatCard
                id="kpi-diagnosticos-resolvidos"
                title={t('kpiResolved')}
                value={diagnosticosResolvidos}
                subtitle={totalDiagnosticos > 0 ? `${Math.round((diagnosticosResolvidos / totalDiagnosticos) * 100)}% eficácia` : t('emptyRecords')}
                icon={CheckCircle2}
                variant="success"
              />
            </div>

            {/* Industrial Metrics (MTBF, MTTR, OEE) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="group bg-slate-900 border border-slate-800 hover:border-cyan-700/60 p-4 rounded-xl flex items-center justify-between transition-all duration-300 ease-out transform hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-950/20">
                <div>
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block group-hover:text-slate-300 transition-colors">
                    {t('mtbfTitle')}
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-cyan-400 font-mono">
                      {calculatedMtbf}h
                    </span>
                    <span className="text-[11px] text-emerald-400 font-bold">{t('targetMtbf')}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">{t('targetMtbf')}</span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-cyan-950/70 text-cyan-400 border border-cyan-800/50 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  <Activity className="w-5 h-5" />
                </div>
              </div>

              <div className="group bg-slate-900 border border-slate-800 hover:border-amber-700/60 p-4 rounded-xl flex items-center justify-between transition-all duration-300 ease-out transform hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-950/20">
                <div>
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block group-hover:text-slate-300 transition-colors">
                    {t('mttrTitle')}
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-amber-400 font-mono">
                      {calculatedMttr}h
                    </span>
                    <span className="text-[11px] text-emerald-400 font-bold">{t('targetMttr')}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">{t('targetMttr')}</span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-amber-950/70 text-amber-400 border border-amber-800/50 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="group bg-slate-900 border border-slate-800 hover:border-emerald-700/60 p-4 rounded-xl flex items-center justify-between transition-all duration-300 ease-out transform hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-950/20">
                <div>
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block group-hover:text-slate-300 transition-colors">
                    {t('oeeTitle')}
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-emerald-400 font-mono">
                      {calculatedOee}%
                    </span>
                    <span className="text-[11px] text-emerald-400 font-bold">{t('targetOee')}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">{t('targetOee')}</span>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-950/70 text-emerald-400 border border-emerald-800/50 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  <Percent className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Charts Section: Falhas por Período (Recharts) & Pareto / Equipamento */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Main Recharts Bar Chart: Falhas por Período */}
              <FailuresPeriodChart failures={failures} />

              {/* Pareto & Equipment Failure Charts */}
              <ParetoAndEquipmentCharts failures={failures} machines={machines} />
            </div>

            {/* Recent Failures & Active Diagnostics Table */}
            <RecentFailuresTable
              failures={failures}
              onOpenDiagnostic={(failure) => handleOpenDiagnostic(failure)}
            />

            {/* Dashboard Maintenance Schedule Preview */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Cronograma de Atividades &amp; Manutenções
                      </h3>
                      <span className="bg-blue-600/30 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-500/40">
                        {activities.length} {activities.length === 1 ? 'Ordem' : 'Ordens'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Atividades preventivas, preditivas e planos autônomos TPM programados.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsNewActivityModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Nova Atividade</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('agendador')}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    Ver Cronograma Completo &rarr;
                  </button>
                </div>
              </div>

              {activities.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-slate-800 rounded-lg">
                  <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-medium">
                    Nenhuma atividade agendada no momento.
                  </p>
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setIsNewActivityModalOpen(true)}
                      className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                    >
                      + Agendar Primeira Atividade
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      onClick={() => setActivities(DEMO_SCHEDULED_ACTIVITIES)}
                      className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                    >
                      Carregar Exemplos
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {activities.slice(0, 3).map((act) => {
                    const completedTasks = act.checklist.filter((c) => c.completed).length;
                    const totalTasks = act.checklist.length;
                    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                    return (
                      <div
                        key={act.id}
                        onClick={() => setActiveTab('agendador')}
                        className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-blue-500/40 transition-all duration-300 ease-out transform hover:scale-[1.02] hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span className="text-[10px] font-mono text-slate-400">
                              {act.id}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                                act.status === 'concluida'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : act.status === 'em_andamento'
                                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 animate-pulse'
                                  : 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}
                            >
                              {act.status === 'concluida'
                                ? 'Concluída'
                                : act.status === 'em_andamento'
                                ? 'Em Execução'
                                : 'Pendente'}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-white line-clamp-1 mb-1">
                            {act.title}
                          </h4>
                          <p className="text-[10px] text-slate-400 truncate mb-3">
                            {act.machineName} ({act.machineCode})
                          </p>
                        </div>

                        <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span className="flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {act.scheduledDate} {act.scheduledTime}
                            </span>
                            <span className="font-mono">
                              {completedTasks}/{totalTasks}
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-blue-500 h-full rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Factory Machine Fleet Status */}
            <MachinesStatusSection
              machines={machines}
              onSelectMachine={(machine) => handleSelectMachine(machine)}
              onAddMachine={() => setIsAddMachineModalOpen(true)}
            />
          </motion.div>
        )}

        {/* TAB: AGENDADOR DE ATIVIDADES */}
        {(activeTab === 'agendador' || activeTab === 'manutencao') && (
          <motion.div
            key="tab-agendador"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            <ActivityScheduler
              activities={activities}
              machines={machines}
              onAddActivity={() => setIsNewActivityModalOpen(true)}
              onUpdateActivity={handleUpdateActivity}
              onDeleteActivity={handleDeleteActivity}
              onLoadDemoActivities={() => setActivities(DEMO_SCHEDULED_ACTIVITIES)}
            />
          </motion.div>
        )}

        {/* TAB 2: MÁQUINAS */}
        {activeTab === 'maquinas' && (
          <motion.div
            key="tab-maquinas"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white">{t('fleetTitle')}</h2>
                <p className="text-xs text-slate-400">{t('fleetSub')}</p>
              </div>
              <button
                onClick={() => setIsAddMachineModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t('btnAddMachine')}</span>
              </button>
            </div>
            <MachinesStatusSection
              machines={machines}
              onSelectMachine={(machine) => handleSelectMachine(machine)}
              onAddMachine={() => setIsAddMachineModalOpen(true)}
            />
          </motion.div>
        )}

        {/* TAB 3: FALHAS */}
        {activeTab === 'falhas' && (
          <motion.div
            key="tab-falhas"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white">{t('failuresTableTitle')}</h2>
                <p className="text-xs text-slate-400">{t('failuresTableSub')}</p>
              </div>
              <button
                onClick={() => handleOpenDiagnostic()}
                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t('tabNewDiagnostic')}</span>
              </button>
            </div>
            <RecentFailuresTable
              failures={failures}
              onOpenDiagnostic={(failure) => handleOpenDiagnostic(failure)}
            />
          </motion.div>
        )}

        {/* TAB 4: TPM & RCA */}
        {(activeTab === 'tpm' || activeTab === 'rca') && (
          <motion.div
            key="tab-tpm-rca"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4"
          >
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white uppercase">
                {activeTab === 'tpm' ? 'TPM (Total Productive Maintenance)' : 'RCA - Análise de Causa Raiz'}
              </h3>
              <p className="text-xs text-slate-400 max-w-lg mx-auto">
                {t('evidenceVsHypothesis')}
              </p>
              <div className="pt-2">
                <button
                  onClick={() => handleOpenDiagnostic()}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold cursor-pointer"
                >
                  {t('tabNewDiagnostic')}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 5: RELATÓRIOS & BASE TÉCNICA */}
        {(activeTab === 'relatorios' || activeTab === 'base-tecnica') && (
          <motion.div
            key="tab-relatorios"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-cyan-400" />
              <div>
                <h3 className="text-base font-bold text-white">{t('tabTechBase')}</h3>
                <p className="text-xs text-slate-400">
                  Documentação homologada: Siemens, Rockwell, Atlas Copco, WEG, KUKA, Schneider, Danfoss e SEW.
                </p>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-white block">Relatório Técnico Demonstrativo (PDF)</span>
                <span className="text-xs text-slate-400">Pronto para exportação imediata com padrão industrial</span>
              </div>
              <button
                onClick={() => handleOpenDiagnostic(failures[0])}
                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
              >
                Visualizar &amp; Gerar PDF
              </button>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            {t('brandName')} • <b>DK Diagnóstico Industrial IA</b> • Versão 2.4.0
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            &ldquo;{t('slogan')}&rdquo;
          </span>
        </div>
      </footer>

      {/* Diagnostic Modal (Camera, OCR, Guided Tests & PDF Export) */}
      <DiagnosticModal
        isOpen={isDiagnosticModalOpen}
        onClose={() => setIsDiagnosticModalOpen(false)}
        initialFailure={selectedFailure}
        machines={machines}
        currentPlant={currentPlant}
        currentLocation={currentLocation}
        onSaveDiagnostic={handleSaveDiagnostic}
      />

      {/* Add Machine Modal */}
      <AddMachineModal
        isOpen={isAddMachineModalOpen}
        onClose={() => setIsAddMachineModalOpen(false)}
        onSaveMachine={handleSaveMachine}
        defaultPlant={currentPlant}
        defaultLocation={currentLocation}
      />

      {/* New Activity / Maintenance Scheduler Modal */}
      <NewActivityModal
        isOpen={isNewActivityModalOpen}
        onClose={() => setIsNewActivityModalOpen(false)}
        machines={machines}
        onSaveActivity={handleAddActivity}
      />

      {/* Critical Failure Persistent Alarm Modal (Immediate Operator Attention & Audio Siren) */}
      <CriticalAlarmModal
        isOpen={isCriticalAlarmModalOpen}
        failure={activeCriticalAlarmFailure}
        machine={machines.find((m) => m.id === activeCriticalAlarmFailure?.machineId) || null}
        currentUser={currentUser}
        onAcknowledge={handleAcknowledgeCriticalAlarm}
        onOpenDiagnostic={handleOpenDiagnosticFromAlarm}
      />

      {/* Reset Data Confirmation In-App Modal */}
      <ResetConfirmModal
        isOpen={isResetConfirmModalOpen}
        onClose={() => setIsResetConfirmModalOpen(false)}
        onConfirm={handleConfirmResetData}
      />

      {/* Plant & Location Configurator Modal */}
      <PlantLocationModal
        isOpen={isPlantLocationModalOpen}
        onClose={() => setIsPlantLocationModalOpen(false)}
        currentPlant={currentPlant}
        currentLocation={currentLocation}
        onSave={handleSavePlantLocation}
      />
    </div>
  );
}
