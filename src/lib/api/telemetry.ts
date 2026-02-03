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
): Promise<TelemetryData[]> {
  const response = await api.get<TelemetryData[]>(`/telemetry/history/bridge/${bridgeId}`, { params });
  // Retorna dados completos de telemetria (valores do eixo Z conforme API)
  return response.data;
}

export const telemetryService = {
  getLatestByCompany,
  getLatestByBridge,
  getHistoryByBridge,
};
