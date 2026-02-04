// User roles for RBAC
export type UserRole = 'viewer' | 'gestor' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId: string;
  avatar?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

// Company/Organization
export interface Company {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  createdAt: string;
  // Cadastro do cliente
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  // Contato responsável
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

// Operational status of a bridge
export type StructuralStatus = 'operacional' | 'atencao' | 'restricoes' | 'critico' | 'interdicao';
export type OperationalCriticality = 'low' | 'medium' | 'high';

// Status labels for display
export const structuralStatusLabels: Record<StructuralStatus, string> = {
  operacional: 'Operacional',
  atencao: 'Operacional com atenção',
  restricoes: 'Operacional com restrições',
  critico: 'Condição crítica',
  interdicao: 'Interdição recomendada',
};

// Bridge/Asset typology
export type BridgeTypology = 'Ponte' | 'Viaduto' | 'Passarela';

// Bridge/Asset
export interface Bridge {
  id: string;
  name: string;
  companyId: string;
  location: string;
  concession: string;
  rodovia: string;
  typology: BridgeTypology;
  km: number;
  beamType: string;
  spanType: string;
  material: string;
  length: number;
  width?: number;
  constructionYear?: number;
  capacity?: number;
  lastMajorIntervention?: string;
  structuralStatus: StructuralStatus;
  operationalCriticality: OperationalCriticality;
  operationalImpact?: string;
  sensorCount: number;
  hasActiveAlerts: boolean;
  lastUpdate: string;
  image?: string;
  geoReferencedImage?: string;
  coordinates?: { lat: number; lng: number };
  supportCount?: number;
  kmzFile?: string; // URL do arquivo KMZ da ponte
}

// Sensor types
export type SensorType = 'acceleration' | 'frequency' | 'command_box';
export type SensorStatus = 'online' | 'offline' | 'maintenance';

export interface Sensor {
  id: string;
  deviceId: string; // String ID for telemetry matching (e.g., "Motiva_P1_S01")
  bridgeId: string;
  type: SensorType;
  name: string;
  status: SensorStatus;
  position: { x: number; y: number; z: number };
  lastReading: {
    value: number;
    unit: string;
    timestamp: string;
  };
  acquisitionInterval: number; // seconds
  alertThreshold: number;
  criticalThreshold: number;
}

// Event/Anomaly
export type EventSeverity = 'low' | 'medium' | 'high' | 'critical';
export type EventStatus = 'new' | 'acknowledged' | 'resolved';

export interface BridgeEvent {
  id: string;
  bridgeId: string;
  sensorId: string;
  timestamp: string;
  type: 'anomaly' | 'alert' | 'maintenance' | 'inspection';
  description: string;
  severity: EventSeverity;
  status: EventStatus;
}

// Time series data point
export interface TimeSeriesPoint {
  timestamp: string;
  value: number;
  axis?: 'x' | 'y' | 'z';
}

export interface TimeSeries {
  sensorId: string;
  dataType: 'frequency' | 'acceleration';
  data: TimeSeriesPoint[];
}

// Camera
export interface Camera {
  id: string;
  bridgeId: string;
  name: string;
  status: 'online' | 'offline';
  streamUrl?: string;
  thumbnail?: string;
}

// Schedule/Maintenance
export type ScheduleStatus = 'planned' | 'in_progress' | 'completed';
export type ScheduleType = 'inspection' | 'maintenance';

export interface Schedule {
  id: string;
  bridgeId: string;
  type: ScheduleType;
  title: string;
  description?: string;
  status: ScheduleStatus;
  scheduledDate: string;
  completedDate?: string;
  responsibleUser: string;
}

// Document
export interface Document {
  id: string;
  bridgeId: string;
  name: string;
  type: 'project' | 'report' | 'video' | 'bim' | 'cde' | 'api' | 'other';
  description?: string;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
  status?: 'active' | 'connected' | 'pending';
}

// Service Status for bridge detail
export interface ServiceStatus {
  name: string;
  status: 'online' | 'attention' | 'offline';
  description: string;
}

// System Event for bridge
export interface SystemEvent {
  time: string;
  description: string;
}

// Dashboard filters
export interface DashboardFilters {
  search: string;
  structuralStatus: StructuralStatus | 'all';
  operationalCriticality: OperationalCriticality | 'all';
  concession: string;
  rodovia: string;
  typology: BridgeTypology | '';
  beamType: string;
  spanType: string;
  material: string;
  kmRange: [number, number];
  hasActiveAlerts: 'all' | 'yes' | 'no';
  companyId: string | 'all';
}

// Analysis filters
export interface AnalysisFilters {
  sensorIds: string[];
  dataType: 'frequency' | 'acceleration';
  dateRange: [Date, Date];
  aggregation: 'none' | 'avg' | 'max' | 'min';
  showAnomalies: boolean;
}

// KPI data
export interface KPIData {
  average: number;
  peak: number;
  eventCount: number;
  severityIndicator: EventSeverity;
}

// System status
export interface SystemStatus {
  power: 'ok' | 'warning' | 'error';
  communication: 'ok' | 'warning' | 'error';
  sensors: { online: number; offline: number; maintenance: number };
  failures: Array<{
    id: string;
    description: string;
    timestamp: string;
    severity: EventSeverity;
  }>;
}

// Structural Problem types
export type StructuralProblemType = 'Fissura' | 'Corrosão' | 'Desgaste' | 'Trinca' | 'Desplacamento';
export type StructuralProblemStatus = 'Em Análise' | 'Corrigido' | 'Agendado' | 'Pendente';

export interface StructuralProblem {
  id: string;
  bridgeId: string;
  bridgeName: string;
  type: StructuralProblemType;
  description: string;
  date: string;
  status: StructuralProblemStatus;
}

// Intervention types
export type InterventionPriority = 'Urgente' | 'Média' | 'Baixa';
export type InterventionType = 'Reparo' | 'Inspeção' | 'Upgrade' | 'Manutenção';

export interface Intervention {
  id: string;
  bridgeId: string;
  bridgeName: string;
  priority: InterventionPriority;
  type: InterventionType;
  description: string;
  scheduledDate: string;
  estimatedDuration: string;
  team: string;
}
