import api from './client';
import type { Sensor, SensorType, SensorStatus } from '@/types';

export interface ApiDevice {
  _id: string;
  device_id: string; // String ID used by telemetry (e.g., "Motiva_P1_S01")
  bridge_id: string;
  company_id: string;
  type: SensorType;
  name: string;
  status: SensorStatus;
  position?: { x: number; y: number; z: number };
  lastReading?: {
    value: number;
    unit: string;
    timestamp: string;
  };
  acquisitionInterval?: number;
  alertThreshold?: number;
  criticalThreshold?: number;
  isActive?: boolean;
  // Additional device params for update
  samples?: number;
  samplingFreq?: number;
  activityThreshold?: number;
  operationMode?: string;
  executionMode?: string;
  testMode?: string;
}

// Mapeia dispositivo da API para formato do frontend
export function mapApiDeviceToSensor(apiDevice: ApiDevice): Sensor {
  return {
    id: apiDevice._id,
    deviceId: apiDevice.device_id || apiDevice.name, // String ID for telemetry matching
    bridgeId: apiDevice.bridge_id,
    type: apiDevice.type,
    name: apiDevice.name || apiDevice.device_id,
    status: apiDevice.status || 'offline',
    position: apiDevice.position || { x: 0, y: 0, z: 0 },
    lastReading: apiDevice.lastReading || {
      value: 0,
      unit: 'Hz',
      timestamp: new Date().toISOString(),
    },
    acquisitionInterval: apiDevice.acquisitionInterval || 60,
    alertThreshold: apiDevice.alertThreshold || 0,
    criticalThreshold: apiDevice.criticalThreshold || 0,
  };
}

export async function getDevices(companyId?: string, bridgeId?: string): Promise<Sensor[]> {
  const params: Record<string, string> = {};
  if (companyId) params.company_id = companyId;
  if (bridgeId) params.bridge_id = bridgeId;
  
  const response = await api.get<ApiDevice[]>('/devices-crud', { params });
  return response.data.map(mapApiDeviceToSensor);
}

export async function getDevice(id: string): Promise<Sensor> {
  const response = await api.get<ApiDevice>(`/devices-crud/${id}`);
  return mapApiDeviceToSensor(response.data);
}

export async function createDevice(data: Partial<ApiDevice>): Promise<Sensor> {
  const response = await api.post<ApiDevice>('/devices-crud', data);
  return mapApiDeviceToSensor(response.data);
}

export async function updateDevice(id: string, data: Partial<ApiDevice>): Promise<Sensor> {
  const response = await api.put<ApiDevice>(`/devices-crud/${id}`, data);
  return mapApiDeviceToSensor(response.data);
}

export async function deleteDevice(id: string): Promise<void> {
  await api.delete(`/devices-crud/${id}`);
}

export const devicesService = {
  getDevices,
  getDevice,
  createDevice,
  updateDevice,
  deleteDevice,
};
