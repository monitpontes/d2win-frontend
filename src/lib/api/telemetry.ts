import api from './client';
import type { TimeSeriesPoint } from '@/types';

export interface TelemetryData {
  deviceId: string;
  bridgeId: string;
  timestamp: string;
  frequency?: number;
  acceleration?: { x: number; y: number; z: number };
}

export interface TelemetryHistoryParams {
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export async function getLatestByCompany(companyId: string): Promise<TelemetryData[]> {
  const response = await api.get<TelemetryData[]>(`/telemetry/latest/company/${companyId}`);
  return response.data;
}

export async function getLatestByBridge(bridgeId: string): Promise<TelemetryData[]> {
  const response = await api.get<TelemetryData[]>(`/telemetry/latest/bridge/${bridgeId}`);
  return response.data;
}

export async function getHistoryByBridge(
  bridgeId: string,
  params?: TelemetryHistoryParams
): Promise<TimeSeriesPoint[]> {
  const response = await api.get<TelemetryData[]>(`/telemetry/history/bridge/${bridgeId}`, { params });
  
  // Transforma dados de telemetria em pontos de série temporal
  return response.data.map((item) => ({
    timestamp: item.timestamp,
    value: item.frequency || 0,
  }));
}

export const telemetryService = {
  getLatestByCompany,
  getLatestByBridge,
  getHistoryByBridge,
};
