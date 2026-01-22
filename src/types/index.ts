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
}

// Structural status of a bridge
export type StructuralStatus = 'normal' | 'alert' | 'critical';
export type OperationalCriticality = 'low' | 'medium' | 'high';

// Bridge/Asset
export interface Bridge {
  id: string;
  name: string;
  companyId: string;
  location: string;
  concession: string;
  km: number;
  beamType: string;
  spanType: string;
  material: string;
  length: number;
  structuralStatus: StructuralStatus;
  operationalCriticality: OperationalCriticality;
  sensorCount: number;
  hasActiveAlerts: boolean;
  lastUpdate: string;
  image?: string;
  coordinates?: { lat: number; lng: number };
}

// Sensor types
export type SensorType = 'acceleration' | 'frequency' | 'command_box';
export type SensorStatus = 'online' | 'offline' | 'maintenance';

export interface Sensor {
  id: string;
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
  type: 'project' | 'report' | 'video' | 'bim' | 'other';
  url: string;
  uploadedBy: string;
  uploadedAt: string;
}

// Dashboard filters
export interface DashboardFilters {
  search: string;
  structuralStatus: StructuralStatus | 'all';
  operationalCriticality: OperationalCriticality | 'all';
  concession: string;
  beamType: string;
  spanType: string;
  material: string;
  kmRange: [number, number];
  hasActiveAlerts: boolean | null;
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
