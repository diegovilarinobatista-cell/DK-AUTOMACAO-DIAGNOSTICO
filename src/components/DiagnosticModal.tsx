import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IndustrialFailure, Machine, FailureSeverity } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import { PdfExportService } from '../services/PdfExportService';
import { supabase } from '../lib/supabase';
import {
  generateDiagnosticPlan,
  GuidedTask,
  GeneratedDiagnosticPlan,
} from '../services/diagnosticTaskEngine';
import {
  X,
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  FileText,
  Sparkles,
  ArrowRight,
  Download,
  AlertCircle,
  Volume2,
  Pencil,
  Plus,
  Trash2,
  RefreshCw,
  Check,
  Undo2,
  Factory,
  MapPin,
} from 'lucide-react';

interface DiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFailure?: IndustrialFailure | null;
  machines: Machine[];
  currentPlant?: string;
  currentLocation?: string;
  onSaveDiagnostic?: (failure: IndustrialFailure) => void;
}

export const DiagnosticModal: React.FC<DiagnosticModalProps> = ({
  isOpen,
  onClose,
  initialFailure,
  machines,
  currentPlant = 'Planta 01 - SP',
  currentLocation = 'Linha 01 - Usinagem de Precisão',
  onSaveDiagnostic,
}) => {
  const { t, language } = useTranslation();

  // AI analysis state
  const [aiSource, setAiSource] = useState<'rules' | 'ai'>('rules');
  const [aiConfidence, setAiConfidence] = useState<'ALTA' | 'MEDIA' | 'BAJA' | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  // Form states
  const [selectedMachineId, setSelectedMachineId] = useState<string>(
    initialFailure?.machineId || machines[0]?.id || ''
  );
  const [customMachineName, setCustomMachineName] = useState<string>(
    initialFailure?.machineName || (machines.length === 0 ? 'Equipamento Linha 01' : '')
  );
  const [errorCode, setErrorCode] = useState<string>(initialFailure?.errorCode || '');
  const [symptom, setSymptom] = useState<string>(
    initialFailure?.symptom || 'A máquina estava operando e parou inesperadamente durante o ciclo de produção.'
  );
  const [severity, setSeverity] = useState<FailureSeverity>(initialFailure?.severity || 'CRITICA');
  const [plant, setPlant] = useState<string>(initialFailure?.plant || currentPlant);
  const [location, setLocation] = useState<string>(initialFailure?.location || currentLocation);
  const [ocrDetectedCode, setOcrDetectedCode] = useState<string | null>(null);

  const currentSelectedMachine = machines.find((m) => m.id === selectedMachineId);
  const resolvedMachineName = currentSelectedMachine?.name || customMachineName || 'Equipamento Não Especificado';

  // Dynamic AI Guided Tasks & Diagnostic Plan
  const [diagnosticPlan, setDiagnosticPlan] = useState<GeneratedDiagnosticPlan>(() => {
    return generateDiagnosticPlan(
      resolvedMachineName,
      initialFailure?.errorCode || '',
      initialFailure?.symptom || 'Parada inesperada durante o ciclo de produção.'
    );
  });

  const [tasks, setTasks] = useState<GuidedTask[]>(() => {
    return generateDiagnosticPlan(
      resolvedMachineName,
      initialFailure?.errorCode || '',
      initialFailure?.symptom || 'Parada inesperada durante o ciclo de produção.'
    ).tasks;
  });

  const [hasUserCustomizedTasks, setHasUserCustomizedTasks] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskData, setEditingTaskData] = useState<{
    title: string;
    description: string;
    expected: string;
    method: string;
  }>({
    title: '',
    description: '',
    expected: '',
    method: '',
  });

  // Re-sync when initialFailure prop changes
  useEffect(() => {
    if (initialFailure) {
      setSelectedMachineId(initialFailure.machineId);
      setCustomMachineName(initialFailure.machineName);
      setErrorCode(initialFailure.errorCode);
      setSymptom(initialFailure.symptom);
      setSeverity(initialFailure.severity || 'CRITICA');
      setPlant(initialFailure.plant || currentPlant);
      setLocation(initialFailure.location || currentLocation);
      const plan = generateDiagnosticPlan(initialFailure.machineName, initialFailure.errorCode, initialFailure.symptom);
      setDiagnosticPlan(plan);
      setTasks(plan.tasks);
      setHasUserCustomizedTasks(false);
      setEditingTaskId(null);
    } else {
      setSeverity('CRITICA');
      setPlant(currentPlant);
      setLocation(currentLocation);
    }
  }, [initialFailure, currentPlant, currentLocation]);

  // Dynamically update plan and task descriptions whenever equipment, errorCode or symptom change!
  useEffect(() => {
    const plan = generateDiagnosticPlan(resolvedMachineName, errorCode, symptom);
    setDiagnosticPlan(plan);
    setAiSource('rules');
    setAiConfidence(null);
    setAiAnalysis('');
    setTasks((prev) => {
      return plan.tasks.map((newTask, idx) => {
        const existing = prev[idx];
        return {
          ...newTask,
          result: existing ? existing.result : newTask.result,
        };
      });
    });
  }, [resolvedMachineName, errorCode, symptom]);

  const handleRegenerateTasks = () => {
    const plan = generateDiagnosticPlan(resolvedMachineName, errorCode, symptom);
    setDiagnosticPlan(plan);
    setTasks(plan.tasks);
    setAiSource('rules');
    setAiConfidence(null);
    setAiAnalysis('');
    setHasUserCustomizedTasks(false);
    setEditingTaskId(null);
  };

  const handleStartEditTask = (task: GuidedTask) => {
    setEditingTaskId(task.id);
    setEditingTaskData({
      title: task.title,
      description: task.description,
      expected: task.expected,
      method: task.method,
    });
  };

  const handleSaveEditTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              title: editingTaskData.title.trim() || t.title,
              description: editingTaskData.description.trim() || t.description,
              expected: editingTaskData.expected.trim() || t.expected,
              method: editingTaskData.method.trim() || t.method,
            }
          : t
      )
    );
    setHasUserCustomizedTasks(true);
    setEditingTaskId(null);
  };

  const handleCancelEditTask = () => {
    setEditingTaskId(null);
  };

  const handleAddTask = () => {
    const newId = `step-${Date.now()}`;
    const newTask: GuidedTask = {
      id: newId,
      title: `Passo ${tasks.length + 1}: Checagem Técnica Complementar`,
      description: `Inspecionar parâmetros de campo em ${resolvedMachineName} relativos ao sintoma: "${symptom.trim() || 'falha'}".`,
      method: 'Inspeção direta e medição com instrumento de precisão',
      expected: 'Funcionamento normal conforme especificação do fabricante',
      result: 'untested',
    };
    setTasks((prev) => [...prev, newTask]);
    setHasUserCustomizedTasks(true);
    handleStartEditTask(newTask);
  };

  const handleDeleteTask = (taskId: string) => {
    if (tasks.length <= 1) return;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setHasUserCustomizedTasks(true);
    if (editingTaskId === taskId) {
      setEditingTaskId(null);
    }
  };

  const handleSetTaskResult = (taskId: string, result: 'ok' | 'failed' | 'untested') => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, result } : t)));
  };

  // Camera states
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Step tabs
  const [activeStage, setActiveStage] = useState<'info' | 'camera' | 'guided' | 'report'>('info');

  // Camera handlers
  const startCamera = async () => {
    setCameraError(null);
    setCameraActive(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } else {
        setCameraError(t('cameraErrorNotice'));
      }
    } catch (err: any) {
      console.warn('Erro ao acessar câmera:', err);
      setCameraError(t('cameraErrorNotice'));
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);

        setOcrDetectedCode(null);
      }
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCapturedImage(reader.result as string);
        setOcrDetectedCode(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const shrinkImage = (dataUrl: string, max = 1280): Promise<string> =>
    new Promise((resolve) => {
      if (!dataUrl.startsWith('data:image/')) return resolve('');
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => resolve('');
      img.src = dataUrl;
    });

  const handleAnalyzeAI = async () => {
    setAiLoading(true);
    setAiNotice(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const image = capturedImage ? await shrinkImage(capturedImage) : '';
      const r = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          lang: language,
          machineName: resolvedMachineName,
          manufacturer: currentSelectedMachine?.manufacturer,
          model: currentSelectedMachine?.model,
          machineType: currentSelectedMachine?.sector,
          errorCode,
          symptom,
          tests: tasks.map((tk) => ({ title: tk.title, result: tk.result })),
          image,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (j.mode === 'demo') {
        setAiNotice('Modo demonstração: a IA ainda não está ativada nesta conta. O plano abaixo vem do motor de regras DK.');
        return;
      }
      if (!r.ok || !j.result) {
        setAiNotice('Não foi possível falar com a IA agora. O plano do motor de regras continua disponível.');
        return;
      }
      const o = j.result;
      setDiagnosticPlan((prev) => ({
        ...prev,
        categoryLabel: 'IA',
        probableCause: o.causa_probable || prev.probableCause,
        rootCauseHypothesis: o.hipotesis_raiz || prev.rootCauseHypothesis,
        recommendedAction: o.accion_recomendada || prev.recommendedAction,
        actionPlan: Array.isArray(o.plan_accion) && o.plan_accion.length ? o.plan_accion : prev.actionPlan,
      }));
      if (Array.isArray(o.tests) && o.tests.length) {
        setTasks(o.tests.map((x: any, i: number) => ({
          id: `ai-${Date.now()}-${i}`, title: x.title, description: x.description, method: x.method, expected: x.expected, result: 'untested' as const,
        })));
        setHasUserCustomizedTasks(false);
      }
      setAiSource('ai');
      setAiConfidence(o.confianza || null);
      setAiAnalysis(o.analisis || '');
      setOcrDetectedCode(o.codigo_visto ? String(o.codigo_visto) : null);
    } catch (e) {
      console.error(e);
      setAiNotice('Sem conexão com a IA. O plano do motor de regras continua disponível.');
    } finally {
      setAiLoading(false);
    }
  };

  const buildFailureObject = (): IndustrialFailure => {
    return {
      id: initialFailure?.id || `FL-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      machineId: currentSelectedMachine?.id || 'm-custom',
      machineName: resolvedMachineName,
      errorCode: errorCode.trim() || 'ERR-01-CRIT',
      symptom: symptom.trim() || 'Parada inesperada durante o ciclo.',
      severity: severity,
      status: 'in_progress',
      reportedAt: initialFailure?.reportedAt || 'Hoje às ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      detectedBy: initialFailure?.detectedBy || 'Técnico Especialista DK',
      probableCause: diagnosticPlan.probableCause,
      downtimeMinutes: initialFailure?.downtimeMinutes || 35,
      shift: 'Turno 1',
      plant: plant.trim() || currentPlant,
      location: location.trim() || currentLocation,
    };
  };

  const handleDownloadPDF = () => {
    const failureToExport = buildFailureObject();
    PdfExportService.exportDiagnosticReport({
      failure: failureToExport,
      machine: currentSelectedMachine,
      guidedTests: tasks.map((t) => ({
        test: t.title,
        result: t.result,
        method: t.method,
        expected: t.expected,
        notes: t.description,
      })),
      aiAnalysis: {
        rootCause: failureToExport.probableCause || diagnosticPlan.probableCause,
        confidenceLevel: aiSource === 'ai' && aiConfidence ? ({ ALTA: 'ALTA', MEDIA: 'MÉDIA', BAJA: 'BAIXA' } as const)[aiConfidence] : 'NÃO AVALIADA (motor de regras)',
        source: aiSource,
        fullAnalysis: aiSource === 'ai' ? aiAnalysis : undefined,
        aiSummary: diagnosticPlan.rootCauseHypothesis,
        actionPlan: diagnosticPlan.actionPlan,
      },
    });
  };

  const handleSaveAndFinish = () => {
    const failureToSave = buildFailureObject();
    if (onSaveDiagnostic) {
      onSaveDiagnostic(failureToSave);
    }
    stopCamera();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="diagnostic-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
          onClick={() => {
            stopCamera();
            onClose();
          }}
        >
          <motion.div
            key="diagnostic-modal-dialog"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
          >
        {/* Modal Header */}
        <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center font-black">
              DK
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>{t('diagModalTitle')}</span>
                <span className="bg-blue-500/20 text-blue-300 text-[10px] font-mono px-2 py-0.5 rounded border border-blue-500/30">
                  IA MULTIMODAL
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {resolvedMachineName} • {errorCode || 'Sem código'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stage Navigation Tabs */}
        <div className="bg-slate-950/60 border-b border-slate-800 px-5 py-2 flex items-center gap-1 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveStage('info')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              activeStage === 'info'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {t('diagStageInfo')}
          </button>
          <button
            onClick={() => setActiveStage('camera')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              activeStage === 'camera'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {t('diagStageCamera')}
          </button>
          <button
            onClick={() => setActiveStage('guided')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              activeStage === 'guided'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {t('diagStageGuided')}
          </button>
          <button
            onClick={() => setActiveStage('report')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              activeStage === 'report'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {t('diagStageReport')}
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs flex-1">
          {/* STAGE 1: INFO & MACHINE */}
          {activeStage === 'info' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">{t('selectMachinePrompt')}</label>
                {machines.length > 0 ? (
                  <select
                    value={selectedMachineId}
                    onChange={(e) => setSelectedMachineId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    {machines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.code} - {m.name} ({m.manufacturer})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={customMachineName}
                    onChange={(e) => setCustomMachineName(e.target.value)}
                    placeholder="Ex: Torno CNC 01 - Siemens"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                )}

                {machines.length > 0 && currentSelectedMachine && (
                  <div className="flex items-center justify-between text-[11px] bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-400 mt-1.5">
                    <span>
                      Setor: <b className="text-slate-300">{currentSelectedMachine.sector}</b>
                    </span>
                    <span className="flex items-center gap-1.5">
                      Limite de Criticidade:
                      <b
                        className={`px-1.5 py-0.5 rounded font-mono ${
                          currentSelectedMachine.criticalFailuresCount >= (currentSelectedMachine.criticalityThreshold || 2)
                            ? 'bg-rose-950/80 border border-rose-500 text-rose-300'
                            : 'bg-slate-900 border border-slate-700 text-slate-200'
                        }`}
                      >
                        {currentSelectedMachine.criticalFailuresCount} / {currentSelectedMachine.criticalityThreshold || 2} falhas
                      </b>
                    </span>
                  </div>
                )}
              </div>

              {/* Editable Plant & Location Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 flex items-center gap-1.5 text-xs">
                    <Factory className="w-3.5 h-3.5 text-blue-400" />
                    <span>Planta Industrial (Editável)</span>
                  </label>
                  <input
                    type="text"
                    value={plant}
                    onChange={(e) => setPlant(e.target.value)}
                    placeholder="Ex: Planta 01 - SP"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 flex items-center gap-1.5 text-xs">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Local / Setor / Linha (Editável)</span>
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ex: Setor de Usinagem - Linha 01"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">{t('errorCodeLabel')}</label>
                <input
                  type="text"
                  value={errorCode}
                  onChange={(e) => setErrorCode(e.target.value)}
                  placeholder="Ex: F30002 / 0x8091 / A-2144"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-300 block">{t('symptomLabel')}</label>
                  <span className="text-[10px] text-cyan-400 font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Define o texto e etapas das tarefas
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={symptom}
                  onChange={(e) => setSymptom(e.target.value)}
                  placeholder="Descreva o sintoma observado em campo..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 leading-relaxed"
                />
                <div className="p-2 rounded-lg bg-blue-950/40 border border-blue-800/60 text-[11px] text-blue-300 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                  <span>
                    Ao alterar o sintoma ou equipamento, as <b>descrições das tarefas</b> na aba &quot;Testes Guiados&quot; são atualizadas em tempo real.
                  </span>
                </div>
              </div>

              {/* Severity Level Selector */}
              <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/90 border border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label className="font-bold text-slate-200 block text-xs">
                    {t('criticalAlarmSeverityField')}
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Selecione o impacto na linha de produção
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setSeverity('CRITICA')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      severity === 'CRITICA'
                        ? 'bg-rose-950 border-rose-500 text-rose-300 ring-2 ring-rose-500/50 shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <AlertOctagon className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                    <span>{t('severityCritical')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeverity('ALTA')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      severity === 'ALTA'
                        ? 'bg-amber-950 border-amber-500 text-amber-300 ring-2 ring-amber-500/50 shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t('severityHigh')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeverity('MEDIA')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      severity === 'MEDIA'
                        ? 'bg-blue-950 border-blue-500 text-blue-300 ring-2 ring-blue-500/50 shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{t('severityMedium')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeverity('BAIXA')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      severity === 'BAIXA'
                        ? 'bg-slate-800 border-slate-600 text-slate-200 ring-2 ring-slate-500/50 shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{t('severityLow')}</span>
                  </button>
                </div>

                {severity === 'CRITICA' && (
                  <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-[11px] text-rose-300 flex items-start gap-2">
                    <Volume2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
                    <span className="leading-snug">
                      {t('criticalAlarmSeverityHint')}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveStage('camera')}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <span>{t('btnNextStep')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STAGE 2: CAMERA & OCR */}
          {activeStage === 'camera' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-400" />
                  {t('cameraHeading')}
                </h3>
                <p className="text-slate-400 mt-0.5">
                  Aponte a câmera para o display da IHM para leitura automática do código de alarme via OCR.
                </p>
              </div>

              {cameraError && (
                <div className="p-3 bg-amber-950/40 border border-amber-800 rounded-lg text-amber-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}

              {/* Live Video / Captured Image Box */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 min-h-[220px] flex items-center justify-center relative">
                {cameraActive ? (
                  <div className="relative w-full h-64 bg-black flex items-center justify-center">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 border-2 border-dashed border-blue-500/50 m-6 rounded-lg pointer-events-none flex items-center justify-center">
                      <span className="bg-slate-900/80 px-2 py-1 rounded text-[10px] text-blue-300 font-mono">
                        ALINHE O CÓDIGO DA IHM
                      </span>
                    </div>
                  </div>
                ) : capturedImage ? (
                  <div className="relative w-full h-64 bg-black flex items-center justify-center">
                    <img
                      src={capturedImage}
                      alt="Captura de HMI"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-2 right-2 bg-emerald-600/90 text-white px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      FOTO CAPTURADA
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6 space-y-2 text-slate-500">
                    <Camera className="w-10 h-10 mx-auto text-slate-600" />
                    <p className="text-xs">Nenhuma foto capturada ainda.</p>
                  </div>
                )}
              </div>

              {/* Action Buttons for Camera */}
              <div className="flex flex-wrap gap-2">
                {!cameraActive ? (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{t('btnStartCamera')}</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{t('btnCapturePhoto')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg font-bold transition-colors cursor-pointer"
                    >
                      <span>{t('btnStopCamera')}</span>
                    </button>
                  </>
                )}

                <label className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer">
                  <Upload className="w-4 h-4 text-blue-400" />
                  <span>{t('btnUploadFile')}</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {ocrDetectedCode && (
                <div className="p-3 bg-blue-950/40 border border-blue-800/80 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-white">{t('ocrResultTitle')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-cyan-300 bg-slate-900 px-2 py-1 rounded border border-blue-700">
                      {ocrDetectedCode}
                    </span>
                    {ocrDetectedCode !== errorCode && (
                      <button type="button" onClick={() => setErrorCode(ocrDetectedCode)} className="text-[11px] font-bold text-blue-300 hover:text-white underline cursor-pointer">
                        Usar este código
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-between">
                <button
                  type="button"
                  onClick={() => setActiveStage('info')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl font-bold cursor-pointer"
                >
                  {t('btnPrevStep')}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStage('guided')}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <span>{t('btnNextStep')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STAGE 3: GUIDED TECHNICAL TESTS */}
          {activeStage === 'guided' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">
                      {t('guidedTestTitle')}
                    </h3>
                    <span className="bg-blue-500/20 text-blue-300 text-[10px] font-mono px-2 py-0.5 rounded border border-blue-500/40 font-bold uppercase">
                      {diagnosticPlan.categoryLabel}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Tarefas geradas dinamicamente para: <b className="text-slate-200">{resolvedMachineName}</b> • <span className="text-cyan-300 font-medium">{symptom.trim() || 'Sintoma geral'}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleRegenerateTasks}
                    title="Regenerar tarefas com base no equipamento e sintoma atuais"
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Regenerar (regras)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAnalyzeAI}
                    disabled={aiLoading}
                    className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-slate-950 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{aiLoading ? 'Analisando…' : 'Analisar com IA'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddTask}
                    className="bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-blue-500/40 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Passo</span>
                  </button>
                </div>
              </div>

              {aiNotice && (
                <div className="p-3 rounded-lg bg-amber-950/50 border border-amber-800 text-amber-200 text-xs">{aiNotice}</div>
              )}
              {aiSource === 'ai' && aiAnalysis && (
                <details open className="p-3 rounded-lg bg-slate-950 border border-cyan-800/60 text-xs">
                  <summary className="cursor-pointer font-bold text-cyan-300 flex items-center gap-2">
                    Análise da IA • Confiança: {aiConfidence ?? '—'}
                  </summary>
                  <pre className="mt-2 whitespace-pre-wrap font-sans text-slate-200 leading-relaxed">{aiAnalysis}</pre>
                  <p className="mt-2 text-[10px] text-slate-500">A IA sugere hipóteses. Confirme com os testes antes de trocar peças. Bloqueio e consignação (LOTO) antes de qualquer teste elétrico.</p>
                </details>
              )}

              {/* Dynamic Live Sync Bar in Guided Stage */}
              <div className="p-3 bg-slate-900/90 rounded-xl border border-cyan-800/60 shadow-lg space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="font-bold text-white text-xs">
                      Sintoma e Dados que Definem as Tarefas:
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Sincronização em Tempo Real Ativa
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={symptom}
                    onChange={(e) => setSymptom(e.target.value)}
                    placeholder="Digite ou altere o sintoma aqui para ver as descrições mudarem..."
                    className="flex-1 bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500"
                  />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px] text-slate-400 font-mono bg-slate-950 px-2 py-1 rounded border border-slate-800 truncate max-w-[140px]">
                      {resolvedMachineName}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono bg-slate-950 px-2 py-1 rounded border border-slate-800">
                      {errorCode || 'F-GERAL'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic Task Cards */}
              <div className="space-y-3">
                {tasks.map((task, idx) => (
                  <div
                    key={task.id}
                    className={`p-3.5 bg-slate-950 rounded-xl border transition-all ${
                      editingTaskId === task.id
                        ? 'border-blue-500 ring-2 ring-blue-500/30 shadow-lg'
                        : task.result === 'failed'
                        ? 'border-rose-900/80 bg-rose-950/20'
                        : task.result === 'ok'
                        ? 'border-emerald-900/60 bg-emerald-950/10'
                        : 'border-slate-800'
                    }`}
                  >
                    {editingTaskId === task.id ? (
                      /* Task Inline Editor */
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                            <Pencil className="w-3.5 h-3.5" />
                            Editar Tarefa {idx + 1}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-slate-400">Título do Passo</label>
                          <input
                            type="text"
                            value={editingTaskData.title}
                            onChange={(e) => setEditingTaskData({ ...editingTaskData, title: e.target.value })}
                            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-bold focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-slate-400">Descrição da Tarefa a Realizar</label>
                          <textarea
                            rows={3}
                            value={editingTaskData.description}
                            onChange={(e) => setEditingTaskData({ ...editingTaskData, description: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs leading-relaxed focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-400">Método / Instrumento</label>
                            <input
                              type="text"
                              value={editingTaskData.method}
                              onChange={(e) => setEditingTaskData({ ...editingTaskData, method: e.target.value })}
                              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-400">Resultado Esperado</label>
                            <input
                              type="text"
                              value={editingTaskData.expected}
                              onChange={(e) => setEditingTaskData({ ...editingTaskData, expected: e.target.value })}
                              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleCancelEditTask}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEditTask(task.id)}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Salvar Alterações</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Task Normal Card */
                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 border border-blue-500/40 text-[11px] font-black flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-white text-xs">{task.title}</span>
                          </div>

                          <div className="flex items-center gap-1.5 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => handleSetTaskResult(task.id, 'ok')}
                              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                                task.result === 'ok'
                                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-500/50 shadow-sm'
                                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              OK
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetTaskResult(task.id, 'failed')}
                              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                                task.result === 'failed'
                                  ? 'bg-rose-600 text-white ring-2 ring-rose-500/50 shadow-sm'
                                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              FALHA
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetTaskResult(task.id, 'untested')}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                task.result === 'untested'
                                  ? 'bg-slate-700 text-white'
                                  : 'bg-slate-900 border border-slate-800 text-slate-500 hover:text-slate-300'
                              }`}
                            >
                              N/A
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStartEditTask(task)}
                              title="Editar título e descrição deste passo"
                              className="p-1 text-slate-400 hover:text-cyan-400 hover:bg-slate-900 rounded transition-colors cursor-pointer ml-1"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            {tasks.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteTask(task.id)}
                                title="Excluir este passo"
                                className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Prominent Task Description Box */}
                        <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider block">
                            Descrição para Realizar a Tarefa:
                          </span>
                          <p className="text-slate-100 text-xs leading-relaxed font-sans font-medium">
                            {task.description}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 pt-1.5 border-t border-slate-900">
                          {task.method && (
                            <span>
                              <b className="text-slate-500">Método:</b> {task.method}
                            </span>
                          )}
                          {task.expected && (
                            <span>
                              <b className="text-slate-500">Esperado:</b> <span className="text-slate-300">{task.expected}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-between">
                <button
                  type="button"
                  onClick={() => setActiveStage('camera')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl font-bold cursor-pointer"
                >
                  {t('btnPrevStep')}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStage('report')}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <span>{t('btnNextStep')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STAGE 4: REPORT & ACTIONS */}
          {activeStage === 'report' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white flex items-center gap-2">
                    <span>Laudo Técnico Estruturado</span>
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/40 font-mono">
                      {diagnosticPlan.categoryLabel}
                    </span>
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${aiSource === 'ai' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-700/40 text-slate-300 border-slate-600'}`}>
                    {aiSource === 'ai' ? `IA • CONFIANÇA ${aiConfidence ?? '—'}` : 'MOTOR DE REGRAS (SEM IA)'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] uppercase text-slate-400 block font-bold">
                      EQUIPAMENTO & ALARME
                    </span>
                    <span className="text-slate-200 font-medium">
                      {resolvedMachineName} • {errorCode || 'Sem código'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] uppercase text-amber-400 block font-bold">
                      HIPÓTESE PRINCIPAL
                    </span>
                    <span className="text-slate-200 leading-snug">
                      {diagnosticPlan.rootCauseHypothesis}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] uppercase text-cyan-400 block font-bold">
                      AÇÃO RECOMENDADA
                    </span>
                    <span className="text-slate-200 leading-snug">
                      {diagnosticPlan.recommendedAction}
                    </span>
                  </div>
                </div>

                {/* Resumo dos Testes Executados */}
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    RESULTADO DOS TESTES ESTRUTURADOS DE CAMPO ({tasks.length} PASSOS)
                  </span>
                  <div className="space-y-1">
                    {tasks.map((t, idx) => (
                      <div key={t.id} className="flex items-center justify-between text-[11px] py-1 border-b border-slate-800/60 last:border-b-0">
                        <span className="text-slate-300 truncate max-w-md">
                          <b>Passo {idx + 1}:</b> {t.title}
                        </span>
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] ${
                            t.result === 'ok'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                              : t.result === 'failed'
                              ? 'bg-rose-950 text-rose-300 border border-rose-700'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {t.result === 'ok' ? 'OK / CONFORME' : t.result === 'failed' ? 'FALHA DETECTADA' : 'NÃO TESTADO'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{t('btnDownloadPDF')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveAndFinish}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white py-3 px-5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t('btnSaveToHistory')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
