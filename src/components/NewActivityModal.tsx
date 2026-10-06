import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from '../i18n/LanguageContext';
import { Machine, ScheduledActivity, ActivityType, ActivityPriority, ChecklistTask } from '../types';
import {
  X,
  Calendar,
  Clock,
  User,
  ShieldAlert,
  Plus,
  Trash2,
  Sparkles,
  CheckSquare,
  Wrench,
  Activity,
  Layers,
  Sliders,
  Database,
  AlertTriangle,
} from 'lucide-react';

interface NewActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (activity: ScheduledActivity) => void;
  onSaveActivity?: (activity: ScheduledActivity) => void;
  machines: Machine[];
  preselectedMachineId?: string;
}

export const NewActivityModal: React.FC<NewActivityModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onSaveActivity,
  machines,
  preselectedMachineId,
}) => {
  const { t } = useTranslation();

  const [machineId, setMachineId] = useState<string>(
    preselectedMachineId || (machines.length > 0 ? machines[0].id : '')
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ActivityType>('preventiva');
  const [priority, setPriority] = useState<ActivityPriority>('alta');
  const [scheduledDate, setScheduledDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [scheduledTime, setScheduledTime] = useState('08:00');
  const [estimatedDurationMinutes, setEstimatedDurationMinutes] = useState(60);
  const [assignedTechnician, setAssignedTechnician] = useState('Técnico Especialista DK');
  const [shift, setShift] = useState<'Turno 1' | 'Turno 2' | 'Turno 3'>('Turno 1');
  const [recurrence, setRecurrence] = useState<'unica' | 'diaria' | 'semanal' | 'mensal' | 'trimestral'>('unica');
  const [lotoRequired, setLotoRequired] = useState(true);
  const [observations, setObservations] = useState('');
  
  // Checklist state
  const [checklist, setChecklist] = useState<ChecklistTask[]>([
    { id: 'ck-1', description: 'Bloqueio de energias perigosas (LOTO) e teste de ausência de tensão', completed: false },
    { id: 'ck-2', description: 'Inspeção visual e limpeza técnica do conjunto', completed: false },
    { id: 'ck-3', description: 'Verificação de conexões elétricas e reaperto', completed: false },
    { id: 'ck-4', description: 'Teste funcional a frio e validação de sensores', completed: false },
  ]);
  const [newChecklistText, setNewChecklistText] = useState('');

  const selectedMachine = machines.find((m) => m.id === machineId);

  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    setChecklist([
      ...checklist,
      {
        id: `ck-${Date.now()}`,
        description: newChecklistText.trim(),
        completed: false,
      },
    ]);
    setNewChecklistText('');
  };

  const handleRemoveChecklistItem = (id: string) => {
    setChecklist(checklist.filter((item) => item.id !== id));
  };

  const handleLoadTemplate = (templateType: ActivityType) => {
    setType(templateType);
    if (templateType === 'preventiva') {
      setTitle(`Manutenção Preventiva - ${selectedMachine ? selectedMachine.name : 'Equipamento'}`);
      setLotoRequired(true);
      setChecklist([
        { id: `ck-1`, description: 'Bloqueio mecânico/elétrico LOTO e teste de ausência de tensão', completed: false },
        { id: `ck-2`, description: 'Aspiração e limpeza técnica interna do painel / guias mecânicas', completed: false },
        { id: `ck-3`, description: 'Reaperto torquimétrico conforme especificações de manual do fabricante', completed: false },
        { id: `ck-4`, description: 'Checagem de isolação e aterramento equipotencial', completed: false },
        { id: `ck-5`, description: 'Teste a quente e liberação operacional junto à produção', completed: false },
      ]);
    } else if (templateType === 'preditiva') {
      setTitle(`Análise Preditiva de Vibração & Termografia - ${selectedMachine ? selectedMachine.name : 'Equipamento'}`);
      setLotoRequired(false);
      setChecklist([
        { id: `ck-1`, description: 'Inspeção termográfica infravermelha de barramento e conexões sob carga', completed: false },
        { id: `ck-2`, description: 'Coleta de vibração FFT nos mancais (velocidade e aceleração)', completed: false },
        { id: `ck-3`, description: 'Comparação espectral com limites da norma ISO 10816', completed: false },
        { id: `ck-4`, description: 'Registro de laudo fotográfico e térmico no sistema DK', completed: false },
      ]);
    } else if (templateType === 'tpm_inspecao') {
      setTitle(`Checklist TPM Autônomo & Inspeção Diária - ${selectedMachine ? selectedMachine.name : 'Equipamento'}`);
      setLotoRequired(false);
      setChecklist([
        { id: `ck-1`, description: 'Limpeza 5S e remoção de cavacos/sujeira acumulada nos sensores', completed: false },
        { id: `ck-2`, description: 'Inspeção de nível de óleo lubrificante e pressão pneumática da linha', completed: false },
        { id: `ck-3`, description: 'Checagem de ruídos anômalos, vibração ou aquecimento excessivo', completed: false },
        { id: `ck-4`, description: 'Verificação da integridade das chaves de segurança e paradas de emergência', completed: false },
      ]);
    } else if (templateType === 'calibracao') {
      setTitle(`Calibração & Aferição Dimensional - ${selectedMachine ? selectedMachine.name : 'Equipamento'}`);
      setLotoRequired(true);
      setChecklist([
        { id: `ck-1`, description: 'Alinhamento com instrumentos de medição com certificado RBC válido', completed: false },
        { id: `ck-2`, description: 'Calibração dos limites de curso e folgas de acoplamento', completed: false },
        { id: `ck-3`, description: 'Teste de repetibilidade e tolerância com relógio comparador', completed: false },
        { id: `ck-4`, description: 'Colocação de selo de calibração aferido e emissão de laudo', completed: false },
      ]);
    } else if (templateType === 'backup_auditoria') {
      setTitle(`Backup de Segurança & Auditoria de Parâmetros - ${selectedMachine ? selectedMachine.name : 'Equipamento'}`);
      setLotoRequired(false);
      setChecklist([
        { id: `ck-1`, description: 'Upload do programa de CLP, IHM e inversores de frequência', completed: false },
        { id: `ck-2`, description: 'Comparação de parâmetros online vs offline (Checksum)', completed: false },
        { id: `ck-3`, description: 'Verificação de integridade da bateria de memória de retenção', completed: false },
        { id: `ck-4`, description: 'Envio de cópia de segurança para o repositório seguro DK Automação', completed: false },
      ]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newActivity: ScheduledActivity = {
      id: `ACT-${Date.now().toString().slice(-6)}`,
      title: title.trim(),
      description: description.trim() || 'Atividade programada no cronograma preventivo industrial DK.',
      type,
      priority,
      status: 'pendente',
      machineId: machineId || 'm-custom',
      machineName: selectedMachine?.name || 'Equipamento Industrial',
      machineCode: selectedMachine?.code || 'TAG-PENDENTE',
      sector: selectedMachine?.sector || 'Planta Industrial',
      scheduledDate,
      scheduledTime,
      estimatedDurationMinutes: Number(estimatedDurationMinutes) || 60,
      assignedTechnician: assignedTechnician.trim() || 'Técnico DK',
      shift,
      recurrence,
      lotoRequired,
      checklist,
      observations: observations.trim(),
    };

    if (onSave) {
      onSave(newActivity);
    } else if (onSaveActivity) {
      onSaveActivity(newActivity);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="new-activity-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            key="new-activity-card"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-6"
          >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950/40 p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">
                Novo Agendamento de Atividade
              </h2>
              <p className="text-xs text-slate-400">
                Ordem de Serviço (OS) e Cronograma de Manutenção Preventiva / Preditiva
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Template Presets */}
        <div className="bg-slate-950/60 px-4 sm:px-6 py-3 border-b border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-bold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Templates Rápidos:
          </span>
          <button
            type="button"
            onClick={() => handleLoadTemplate('preventiva')}
            className="px-2.5 py-1 rounded-md bg-blue-950/60 hover:bg-blue-900 text-blue-300 border border-blue-700/50 flex items-center gap-1.5 transition-colors"
          >
            <Wrench className="w-3 h-3" />
            Preventiva
          </button>
          <button
            type="button"
            onClick={() => handleLoadTemplate('preditiva')}
            className="px-2.5 py-1 rounded-md bg-purple-950/60 hover:bg-purple-900 text-purple-300 border border-purple-700/50 flex items-center gap-1.5 transition-colors"
          >
            <Activity className="w-3 h-3" />
            Preditiva / FFT
          </button>
          <button
            type="button"
            onClick={() => handleLoadTemplate('tpm_inspecao')}
            className="px-2.5 py-1 rounded-md bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/50 flex items-center gap-1.5 transition-colors"
          >
            <Layers className="w-3 h-3" />
            TPM Autônomo
          </button>
          <button
            type="button"
            onClick={() => handleLoadTemplate('calibracao')}
            className="px-2.5 py-1 rounded-md bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-700/50 flex items-center gap-1.5 transition-colors"
          >
            <Sliders className="w-3 h-3" />
            Calibração
          </button>
          <button
            type="button"
            onClick={() => handleLoadTemplate('backup_auditoria')}
            className="px-2.5 py-1 rounded-md bg-cyan-950/60 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/50 flex items-center gap-1.5 transition-colors"
          >
            <Database className="w-3 h-3" />
            Backup CLP
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Main Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Machine Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Equipamento / Máquina *
              </label>
              {machines.length > 0 ? (
                <select
                  value={machineId}
                  onChange={(e) => setMachineId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  required
                >
                  {machines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.code}) - {m.sector}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Nome do Equipamento (Ex: Prensa Hidráulica 01)"
                  value={machineId}
                  onChange={(e) => setMachineId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  required
                />
              )}
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Tipo de Atividade *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ActivityType)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="preventiva">Manutenção Preventiva</option>
                <option value="preditiva">Manutenção Preditiva (Termografia/Vibração)</option>
                <option value="tpm_inspecao">Inspeção Autônoma / Checklist TPM</option>
                <option value="calibracao">Calibração & Aferição de Instrumentos</option>
                <option value="corretiva_programada">Intervenção Corretiva Programada</option>
                <option value="backup_auditoria">Backup de CLP / Auditoria de Segurança</option>
              </select>
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Título da Atividade / Ordem de Serviço (OS) *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Manutenção Preventiva dos Inversores e Filtros de Potência"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Escopo / Descrição Técnica
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Detalhe o objetivo da intervenção, componentes a inspecionar e observações de processo..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Date, Time, Duration, Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Data Programada *
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Horário *
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Duração Estimada
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="15"
                  step="15"
                  value={estimatedDurationMinutes}
                  onChange={(e) => setEstimatedDurationMinutes(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-500">min</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Prioridade
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ActivityPriority)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="critica">Crítica (Parada Urgente)</option>
                <option value="alta">Alta</option>
                <option value="media">Média</option>
                <option value="baixa">Baixa (Rotina)</option>
              </select>
            </div>
          </div>

          {/* Technician, Shift, Recurrence */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Técnico Responsável
              </label>
              <input
                type="text"
                value={assignedTechnician}
                onChange={(e) => setAssignedTechnician(e.target.value)}
                placeholder="Nome do técnico"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Turno Operacional
              </label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Turno 1">Turno 1 (06h - 14h)</option>
                <option value="Turno 2">Turno 2 (14h - 22h)</option>
                <option value="Turno 3">Turno 3 (22h - 06h)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Periodicidade / Recorrência
              </label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="unica">Única (Sem repetição)</option>
                <option value="diaria">Diária</option>
                <option value="semanal">Semanal</option>
                <option value="mensal">Mensal</option>
                <option value="trimestral">Trimestral</option>
              </select>
            </div>
          </div>

          {/* LOTO & Safety Protocol */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${lotoRequired ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'}`}>
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  Exige Bloqueio e Etiquetagem LOTO (NR-10 / NR-12)
                </span>
                <span className="text-[11px] text-slate-400">
                  Desenergização com chave mecânica, cadeado de segurança e teste de ausência de potencial
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={lotoRequired}
                onChange={(e) => setLotoRequired(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
            </label>
          </div>

          {/* Checklist Tasks Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-blue-400" />
                Procedimentos & Checklist Técnico ({checklist.length})
              </label>
              <span className="text-[11px] text-slate-400">
                Itens a serem validados pelo técnico em campo
              </span>
            </div>

            <div className="space-y-2">
              {checklist.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs text-slate-300"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-mono text-[10px] shrink-0">
                      {idx + 1}
                    </span>
                    <span>{item.description}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveChecklistItem(item.id)}
                    className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {/* Add checklist item */}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Novo item de inspeção ou teste..."
                  value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddChecklistItem();
                    }
                  }}
                  className="flex-1 bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddChecklistItem}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Observations */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Instruções Adicionais & Requisitos de Parada
            </label>
            <input
              type="text"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Ex: Peças sobressalentes já retiradas no almoxarifado. Parada negociada com PCP."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30 transition-colors cursor-pointer"
            >
              Agendar Atividade
            </button>
          </div>
        </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
