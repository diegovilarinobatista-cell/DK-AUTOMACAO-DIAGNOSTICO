import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Machine, MachineStatus, ScheduledActivity } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import { X, Server, PlusCircle, CheckCircle2, Factory, MapPin, Clock, Wrench, ShieldCheck, Sparkles, Activity } from 'lucide-react';

interface AddMachineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveMachine: (machine: Machine, suggestedActivity?: ScheduledActivity) => void;
  defaultPlant?: string;
  defaultLocation?: string;
}

export const AddMachineModal: React.FC<AddMachineModalProps> = ({
  isOpen,
  onClose,
  onSaveMachine,
  defaultPlant = 'Planta 01 - SP',
  defaultLocation = 'Linha 01 - Usinagem',
}) => {
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [manufacturer, setManufacturer] = useState('Siemens');
  const [model, setModel] = useState('');
  const [sector, setSector] = useState('');
  const [line, setLine] = useState('');
  const [plant, setPlant] = useState(defaultPlant);
  const [location, setLocation] = useState(defaultLocation);
  const [operatingHours, setOperatingHours] = useState<number>(1000);
  const [criticalityThreshold, setCriticalityThreshold] = useState<number>(2);
  const [status, setStatus] = useState<MachineStatus>('operational');

  // Reliability Metrics (MTBF & MTTR)
  const [mtbfHours, setMtbfHours] = useState<number>(240);
  const [mttrHours, setMttrHours] = useState<number>(1.8);
  const [autoSchedulePreventive, setAutoSchedulePreventive] = useState<boolean>(true);

  // Machine Intelligence Calculations
  const numMtbf = Math.max(1, Number(mtbfHours) || 1);
  const numMttr = Math.max(0.1, Number(mttrHours) || 0.1);
  const theoreticalAvailability = Number(((numMtbf / (numMtbf + numMttr)) * 100).toFixed(2));
  const suggestedPreventiveIntervalHours = Math.round(numMtbf * 0.7);
  const suggestedDaysToInspection = Math.max(1, Math.round(suggestedPreventiveIntervalHours / 16));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newMachine: Machine = {
      id: `m-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      code: code.trim() || `EQ-${Math.floor(100 + Math.random() * 900)}`,
      manufacturer: manufacturer.trim() || 'Industrial',
      model: model.trim() || 'Standard Industrial',
      serialNumber: `SN-${Math.floor(10000 + Math.random() * 90000)}`,
      sector: sector.trim() || 'Setor Fabril Geral',
      line: line.trim() || 'Linha Principal',
      plant: plant.trim() || defaultPlant,
      location: location.trim() || defaultLocation,
      year: new Date().getFullYear(),
      operatingHours: Number(operatingHours) || 0,
      lastMaintenance: new Date().toISOString().split('T')[0],
      status: status,
      criticalFailuresCount: status === 'critical_stopped' ? 1 : 0,
      criticalityThreshold: Number(criticalityThreshold) > 0 ? Number(criticalityThreshold) : 2,
      mtbfHours: numMtbf,
      mttrHours: numMttr,
    };

    let suggestedActivity: ScheduledActivity | undefined = undefined;
    if (autoSchedulePreventive) {
      const today = new Date();
      const targetDate = new Date();
      targetDate.setDate(today.getDate() + suggestedDaysToInspection);
      const scheduledDateStr = targetDate.toISOString().split('T')[0];

      suggestedActivity = {
        id: `act-${Date.now()}`,
        title: `Manutenção Preventiva Preditiva - ${name.trim()} (${newMachine.code})`,
        description: `Plano preventivo estruturado com base no MTBF de ${numMtbf}h e MTTR de ${numMttr}h (Disponibilidade Teórica: ${theoreticalAvailability}%). Inspeção antes de atingir ${suggestedPreventiveIntervalHours}h operacionais.`,
        type: 'preventiva',
        priority: theoreticalAvailability < 95 ? 'alta' : 'media',
        status: 'pendente',
        machineId: newMachine.id,
        machineName: newMachine.name,
        machineCode: newMachine.code,
        sector: newMachine.sector,
        scheduledDate: scheduledDateStr,
        scheduledTime: '08:00',
        estimatedDurationMinutes: Math.round(numMttr * 60) || 120,
        assignedTechnician: 'Especialista de Confiabilidade & TPM',
        shift: 'Turno 1',
        recurrence: suggestedDaysToInspection <= 7 ? 'semanal' : suggestedDaysToInspection <= 15 ? 'semanal' : 'mensal',
        lotoRequired: true,
        checklist: [
          {
            id: 'chk-1',
            description: `Verificar alinhamento e folgas mecânicas conforme o MTBF de ${numMtbf}h`,
            completed: false,
          },
          {
            id: 'chk-2',
            description: 'Inspeção termográfica em conexões de potência e acionamentos elétricos',
            completed: false,
          },
          {
            id: 'chk-3',
            description: 'Lubrificação forçada e verificação de nível de fluídos do subsistema',
            completed: false,
          },
          {
            id: 'chk-4',
            description: `Teste de parada de emergência e intertravamento de segurança (Meta MTTR <= ${numMttr}h)`,
            completed: false,
          },
        ],
        observations: `Plano preventivo sincronizado com métricas de confiabilidade: MTBF=${numMtbf}h, MTTR=${numMttr}h. Disponibilidade teórica calculada: ${theoreticalAvailability}%.`,
      };
    }

    onSaveMachine(newMachine, suggestedActivity);
    onClose();
    // Reset form
    setName('');
    setCode('');
    setModel('');
    setSector('');
    setLine('');
    setCriticalityThreshold(2);
    setMtbfHours(240);
    setMttrHours(1.8);
    setAutoSchedulePreventive(true);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="add-machine-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            key="add-machine-card"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto"
          >
        {/* Header */}
        <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{t('modalAddMachineTitle')}</h2>
              <p className="text-[11px] text-slate-400">{t('modalAddMachineSub')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-300">{t('fieldName')} *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('fieldNamePlaceholder')}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-300">{t('fieldCode')}</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t('fieldCodePlaceholder')}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-300">{t('fieldManufacturer')}</label>
              <input
                type="text"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder={t('fieldManufacturerPlaceholder')}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-300">{t('fieldModel')}</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={t('fieldModelPlaceholder')}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-300">{t('fieldSector')}</label>
              <input
                type="text"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                placeholder={t('fieldSectorPlaceholder')}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-300">{t('fieldLine')}</label>
              <input
                type="text"
                value={line}
                onChange={(e) => setLine(e.target.value)}
                placeholder={t('fieldLinePlaceholder')}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Planta e Local (Customizáveis) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
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
                <span>Local da Instalação (Editável)</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Galpão A / Setor de Prensas"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-300">{t('fieldInitialStatus')}</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MachineStatus)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="operational">{t('statusOperational')}</option>
                <option value="warning">{t('statusWarning')}</option>
                <option value="critical_stopped">{t('statusCritical')}</option>
                <option value="maintenance">{t('statusMaintenance')}</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-300">{t('colHours')}</label>
              <input
                type="number"
                value={operatingHours}
                onChange={(e) => setOperatingHours(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-300 flex items-center justify-between">
                <span>Limite Criticidade</span>
                <span className="text-[10px] text-slate-400 font-normal">Máx. falhas</span>
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={criticalityThreshold}
                onChange={(e) => setCriticalityThreshold(Math.max(1, Number(e.target.value)))}
                placeholder="Ex: 2"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {/* MTBF, MTTR & Machine Intelligence Reliability Section */}
          <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3.5 shadow-inner">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-white text-xs tracking-tight">
                  Parâmetros de Confiabilidade &amp; Inteligência da Máquina
                </span>
              </div>
              <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-cyan-500/30">
                EDITÁVEL (MTBF / MTTR)
              </span>
            </div>

            {/* Editable MTBF and MTTR Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-200 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    <span>MTBF (Tempo Entre Falhas)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Horas</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={mtbfHours}
                    onChange={(e) => setMtbfHours(Math.max(1, Number(e.target.value)))}
                    placeholder="Ex: 240"
                    required
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-lg text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono pointer-events-none">
                    horas
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  {t('fieldMtbfHint')}
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-200 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-amber-400" />
                    <span>MTTR (Tempo Para Reparo)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Horas</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={mttrHours}
                    onChange={(e) => setMttrHours(Math.max(0.1, Number(e.target.value)))}
                    placeholder="Ex: 1.8"
                    required
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono pointer-events-none">
                    horas
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  {t('fieldMttrHint')}
                </p>
              </div>
            </div>

            {/* Real-time Theoretical Availability Display */}
            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>{t('theoreticalAvailability')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-black text-emerald-400">
                    {theoreticalAvailability}%
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      theoreticalAvailability >= 98
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/50'
                        : theoreticalAvailability >= 95
                        ? 'bg-blue-950/80 text-blue-300 border border-blue-600/50'
                        : 'bg-amber-950/80 text-amber-300 border border-amber-600/50'
                    }`}
                  >
                    {theoreticalAvailability >= 98
                      ? 'Excelente (World Class)'
                      : theoreticalAvailability >= 95
                      ? 'Bom (Monitorar)'
                      : 'Crítico (Atenção Elevada)'}
                  </span>
                </div>
              </div>

              {/* Progress Bar & Real-time Calculation */}
              <div className="space-y-1">
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      theoreticalAvailability >= 98
                        ? 'bg-emerald-500'
                        : theoreticalAvailability >= 95
                        ? 'bg-blue-500'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, theoreticalAvailability))}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Cálculo: A = MTBF / (MTBF + MTTR)</span>
                  <span>{numMtbf}h / ({numMtbf}h + {numMttr}h)</span>
                </div>
              </div>
            </div>

            {/* AI-Suggested Preventive Maintenance Plan Box */}
            <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-800/60 space-y-2 text-xs">
              <div className="flex items-center justify-between text-blue-300 font-bold flex-wrap gap-1">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>{t('preventivePlanSuggested')}</span>
                </div>
                <span className="text-[10px] bg-blue-500/20 text-cyan-300 px-2 py-0.5 rounded font-mono">
                  A cada ~{suggestedPreventiveIntervalHours} horas ({suggestedDaysToInspection} dias)
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Com base no MTBF de <b>{numMtbf}h</b>, o limiar ideal para intervenção preventiva é a cada <b>{suggestedPreventiveIntervalHours}h de operação</b> para evitar a falha antes da probabilidade estatística de quebra.
              </p>

              {/* Checkbox for Auto-Scheduling */}
              <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoSchedulePreventive}
                  onChange={(e) => setAutoSchedulePreventive(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-900 cursor-pointer"
                />
                <span className="text-[11px] text-slate-200 font-semibold">
                  Cadastrar automaticamente este plano preventivo no <b>Agendador de Manutenção</b> com checklist técnico
                </span>
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg font-bold transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-md shadow-blue-700/30 flex items-center gap-1.5 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{t('btnSaveMachine')}</span>
            </button>
          </div>
        </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
