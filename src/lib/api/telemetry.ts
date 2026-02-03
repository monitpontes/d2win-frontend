import api from './client';
import type { TimeSeriesPoint } from '@/types';

export interface TelemetryData {
  deviceId: string;
  bridgeId: string;
  timestamp: string;
  frequency?: number;
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

interface ApiHistoryResponse {
  ok: boolean;
  count: number;
  limit: number;
  bridge_id: string;
  items: Array<{
    device_id: string;
    ts: string;
    value?: number;
    peaks?: Array<{ f: number; mag: number }>;
    meta?: { axis?: string; stream?: string };
  }>;
}

function mapApiDeviceToTelemetry(device: ApiDeviceTelemetry, bridgeId: string): TelemetryData {
  const isFrequency = device.modo_operacao === 'frequencia';
  
  return {
    deviceId: device.device_id,
    bridgeId: bridgeId,
    timestamp: device.last_seen,
    modoOperacao: device.modo_operacao,
    status: device.status,
    // Extract frequency from peaks if available
    frequency: isFrequency && device.freq?.peaks?.[0]?.f 
      ? device.freq.peaks[0].f 
      : undefined,
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
  
  return data.items.map(item => ({
    deviceId: item.device_id,
    bridgeId: bridgeId,
    timestamp: item.ts,
    frequency: item.peaks?.[0]?.f,
    acceleration: item.value !== undefined ? { x: 0, y: 0, z: item.value } : undefined,
  }));
}

export const telemetryService = {
  getLatestByCompany,
  getLatestByBridge,
  getHistoryByBridge,
};
