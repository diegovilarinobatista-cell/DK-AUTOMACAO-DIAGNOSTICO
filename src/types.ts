export type MachineStatus = 'operational' | 'warning' | 'critical_stopped' | 'maintenance';

export interface Machine {
  id: string;
  name: string;
  code: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  sector: string;
  line: string;
  plant?: string;
  location?: string;
  year: number;
  operatingHours: number;
  lastMaintenance: string;
  status: MachineStatus;
  criticalFailuresCount: number;
  criticalityThreshold: number; // Limite de criticidade: limite tolerado de falhas críticas antes de bloqueio/inspeção mandatória
  mtbfHours: number;
  mttrHours: number;
}

export type FailureSeverity = 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAIXA';
export type DiagnosticStatus = 'completed' | 'in_progress' | 'pending_validation' | 'open';

export interface IndustrialFailure {
  id: string;
  machineId: string;
  machineName: string;
  errorCode: string;
  symptom: string;
  severity: FailureSeverity;
  status: DiagnosticStatus;
  reportedAt: string;
  detectedBy: string;
  probableCause: string;
  downtimeMinutes: number;
  shift: 'Turno 1' | 'Turno 2' | 'Turno 3';
  plant?: string;
  location?: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}

export interface PeriodFailureStat {
  period: string;
  eletrica: number;
  mecanica: number;
  automacao: number;
  total: number;
  resolvidas: number;
}

export interface ParetoItem {
  cause: string;
  count: number;
  cumulativePercentage: number;
}

export interface FactoryKPIs {
  totalDiagnosticos: number;
  diagnosticosEmAndamento: number;
  diagnosticosResolvidos: number;
  maquinasCadastradas: number;
  maquinasParadas: number;
  falhasCriticas: number;
  falhasRecorrentes: number;
  mtbf: number; // horas
  mttr: number; // horas
  oee: number; // porcentagem
}

export type ActivityType =
  | 'preventiva'
  | 'preditiva'
  | 'tpm_inspecao'
  | 'calibracao'
  | 'corretiva_programada'
  | 'backup_auditoria';

export type ActivityPriority = 'critica' | 'alta' | 'media' | 'baixa';
export type ActivityStatus = 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';

export interface ChecklistTask {
  id: string;
  description: string;
  completed: boolean;
  notes?: string;
}

export interface ScheduledActivity {
  id: string;
  title: string;
  description: string;
  type: ActivityType;
  priority: ActivityPriority;
  status: ActivityStatus;
  machineId: string;
  machineName: string;
  machineCode?: string;
  sector?: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm
  estimatedDurationMinutes: number;
  actualDurationMinutes?: number;
  assignedTechnician: string;
  shift: 'Turno 1' | 'Turno 2' | 'Turno 3';
  recurrence: 'unica' | 'diaria' | 'semanal' | 'mensal' | 'trimestral';
  lotoRequired: boolean;
  checklist: ChecklistTask[];
  observations?: string;
  completedAt?: string;
  completedBy?: string;
  failureIdRef?: string;
}
