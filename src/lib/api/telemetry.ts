import api from './client';
import type { TimeSeriesPoint } from '@/types';

export interface TelemetryData {
  deviceId: string;
  bridgeId: string;
  timestamp: string;
  frequency?: number;
  frequency2?: number;
  magnitude1?: number;
  magnitude2?: number;
  acceleration?: { x: number; y: number; z: number };
  modoOperacao?: string;
  status?: string;
}

export interface TelemetryHistoryParams {
  startDate?: string;
  endDate?: string;
  limit?: number;
}

// Raw API response interfaces
interface ApiDeviceTelemetry {
  device_id: string;
  bridge_id: string;
  company_id: string;
  modo_operacao: string;
  last_seen: string;
  status: string;
  isActive: boolean;
  accel: { value: number; ts: string } | null;
  freq: { peaks: Array<{ f: number; mag: number }>; ts: string } | null;
}

interface ApiLatestResponse {
  bridge_id: string;
  company_ids: string[];
  updated_at: string;
  devices: ApiDeviceTelemetry[];
}

// New structure for history response - each device has arrays of freq/accel readings
interface ApiHistoryAccelReading {
  ts: string;
  value: number;
  severity: string;
  meta?: { 
    device_id: string;
    axis?: 'x' | 'y' | 'z'; 
  };
}

interface ApiHistoryFreqReading {
  ts: string;
  peaks: Array<{ f: number; mag: number }>;
  severity: string;
  status?: string;
  meta?: { device_id: string };
}

interface ApiHistoryItem {
  device_id: string;
  accel: ApiHistoryAccelReading[] | null;
  freq: ApiHistoryFreqReading[] | null;
}

interface ApiHistoryResponse {
  ok: boolean;
  count: number;
  limit: number;
  bridge_id: string;
  items: ApiHistoryItem[];
}

function mapApiDeviceToTelemetry(device: ApiDeviceTelemetry, bridgeId: string): TelemetryData {
  const isFrequency = device.modo_operacao === 'frequencia';
  const peaks = device.freq?.peaks || [];
  
  return {
    deviceId: device.device_id,
    bridgeId: bridgeId,
    timestamp: device.last_seen,
    modoOperacao: device.modo_operacao,
    status: device.status,
    // Extract frequency and magnitude from peaks
    frequency: peaks[0]?.f,
    magnitude1: peaks[0]?.mag,
    frequency2: peaks[1]?.f,
    magnitude2: peaks[1]?.mag,
    // Extract acceleration Z value if available
    acceleration: !isFrequency && device.accel?.value !== undefined
      ? { x: 0, y: 0, z: device.accel.value }
      : undefined,
  };
}

export async function getLatestByCompany(companyId: string): Promise<TelemetryData[]> {
  const response = await api.get<ApiLatestResponse>(`/telemetry/latest/company/${companyId}`);
  const data = response.data;
  
  if (!data || !Array.isArray(data.devices)) {
    return [];
  }
  
  return data.devices.map(device => mapApiDeviceToTelemetry(device, data.bridge_id));
}

export async function getLatestByBridge(bridgeId: string): Promise<TelemetryData[]> {
  const response = await api.get<ApiLatestResponse>(`/telemetry/latest/bridge/${bridgeId}`);
  const data = response.data;
  
  if (!data || !Array.isArray(data.devices)) {
    return [];
  }
  
  return data.devices.map(device => mapApiDeviceToTelemetry(device, bridgeId));
}

export async function getHistoryByBridge(
  bridgeId: string,
  params?: TelemetryHistoryParams
): Promise<TelemetryData[]> {
  const response = await api.get<ApiHistoryResponse>(`/telemetry/history/bridge/${bridgeId}`, { params });
  const data = response.data;
  
  if (!data || !Array.isArray(data.items)) {
    return [];
  }
  
  // Process each device and extract latest value from freq/accel arrays
  return data.items.map(item => {
    const hasFreq = item.freq && item.freq.length > 0;
    const hasAccel = item.accel && item.accel.length > 0;
    
    // Get the latest reading from each array
    const lastFreq = hasFreq ? item.freq![item.freq!.length - 1] : null;
    const lastAccel = hasAccel ? item.accel![item.accel!.length - 1] : null;
    
    // Determine which reading is more recent to use as timestamp
    const freqTime = lastFreq ? new Date(lastFreq.ts).getTime() : 0;
    const accelTime = lastAccel ? new Date(lastAccel.ts).getTime() : 0;
    const isFrequencyLatest = freqTime >= accelTime;
    
    // Determine modoOperacao based on which has more recent data
    const modoOperacao = isFrequencyLatest && hasFreq ? 'frequencia' : 'aceleracao';
    
    return {
      deviceId: item.device_id,
      bridgeId: bridgeId,
      timestamp: isFrequencyLatest ? lastFreq?.ts : lastAccel?.ts,
      modoOperacao,
      frequency: lastFreq?.peaks?.[0]?.f,
      acceleration: lastAccel?.value !== undefined 
        ? { x: 0, y: 0, z: lastAccel.value } 
        : undefined,
      status: isFrequencyLatest ? lastFreq?.severity : lastAccel?.severity,
    };
  });
}

// Time series point for charts (expanded from freq/accel arrays)
export interface TelemetryTimeSeriesPoint {
  deviceId: string;
  bridgeId: string;
  timestamp: string;
  type: 'frequency' | 'acceleration';
  value: number;
  severity?: string;
  axis?: 'x' | 'y' | 'z'; // Eixo do sensor, default 'z'
}

// Expand freq[] and accel[] arrays into time series points for charts
// Uses limit: 100 by default to avoid excessive data
export async function getHistoryTimeSeries(
  bridgeId: string,
  params?: TelemetryHistoryParams
): Promise<TelemetryTimeSeriesPoint[]> {
  const queryParams = { limit: 100, ...params };
  const response = await api.get<ApiHistoryResponse>(
    `/telemetry/history/bridge/${bridgeId}`,
    { params: queryParams }
  );

  const data = response.data;
  if (!data?.items) return [];

  const points: TelemetryTimeSeriesPoint[] = [];

  data.items.forEach(item => {
    // Expand frequency array
    item.freq?.forEach(reading => {
      if (reading.peaks?.[0]?.f) {
        points.push({
          deviceId: item.device_id,
          bridgeId,
          timestamp: reading.ts,
          type: 'frequency',
          value: reading.peaks[0].f,
          severity: reading.severity,
        });
      }
    });

    // Expand acceleration array with axis detection
    item.accel?.forEach(reading => {
      const axis = reading.meta?.axis || 'z'; // Default Z se não especificado
      points.push({
        deviceId: item.device_id,
        bridgeId,
        timestamp: reading.ts,
        type: 'acceleration',
        value: reading.value,
        severity: reading.severity,
        axis,
      });
    });
  });

  // Sort by timestamp
  return points.sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

export const telemetryService = {
  getLatestByCompany,
  getLatestByBridge,
  getHistoryByBridge,
  getHistoryTimeSeries,
};
