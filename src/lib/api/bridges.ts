import api from './client';
import type { Bridge, StructuralStatus, OperationalCriticality, BridgeTypology } from '@/types';

export interface ApiBridge {
  _id: string;
  name: string;
  company_id: string;
  location?: string;
  concession?: string;
  rodovia?: string;
  typology?: BridgeTypology;
  km?: number;
  beamType?: string;
  spanType?: string;
  material?: string;
  length?: number;
  width?: number;
  constructionYear?: number;
  capacity?: number;
  lastMajorIntervention?: string;
  structuralStatus?: StructuralStatus;
  operationalCriticality?: OperationalCriticality;
  operationalImpact?: string;
  sensorCount?: number;
  hasActiveAlerts?: boolean;
  lastUpdate?: string;
  image?: string;
  geoReferencedImage?: string;
  coordinates?: { lat: number; lng: number };
  supportCount?: number;
  isActive?: boolean;
  createdAt?: string;
}

// Mapeia ponte da API para formato do frontend
export function mapApiBridgeToBridge(apiBridge: ApiBridge): Bridge {
  return {
    id: apiBridge._id,
    name: apiBridge.name,
    companyId: apiBridge.company_id,
    location: apiBridge.location || '',
    concession: apiBridge.concession || '',
    rodovia: apiBridge.rodovia || '',
    typology: apiBridge.typology || 'Ponte',
    km: apiBridge.km || 0,
    beamType: apiBridge.beamType || '',
    spanType: apiBridge.spanType || '',
    material: apiBridge.material || '',
    length: apiBridge.length || 0,
    width: apiBridge.width,
    constructionYear: apiBridge.constructionYear,
    capacity: apiBridge.capacity,
    lastMajorIntervention: apiBridge.lastMajorIntervention,
    structuralStatus: apiBridge.structuralStatus || 'operacional',
    operationalCriticality: apiBridge.operationalCriticality || 'low',
    operationalImpact: apiBridge.operationalImpact,
    sensorCount: apiBridge.sensorCount || 0,
    hasActiveAlerts: apiBridge.hasActiveAlerts || false,
    lastUpdate: apiBridge.lastUpdate || new Date().toISOString(),
    image: apiBridge.image,
    geoReferencedImage: apiBridge.geoReferencedImage,
    coordinates: apiBridge.coordinates,
    supportCount: apiBridge.supportCount,
  };
}

export async function getBridges(companyId?: string): Promise<Bridge[]> {
  try {
    const params = companyId ? { company_id: companyId } : {};
    console.log('[Bridges] Fetching with params:', params);
    const response = await api.get<ApiBridge[]>('/bridges', { params });
    console.log('[Bridges] Raw response:', response.data);
    console.log('[Bridges] Count:', response.data?.length || 0);
    return response.data.map(mapApiBridgeToBridge);
  } catch (error) {
    console.error('[Bridges] Error fetching:', error);
    throw error;
  }
}

export async function getBridge(id: string): Promise<Bridge> {
  const response = await api.get<ApiBridge>(`/bridges/${id}`);
  return mapApiBridgeToBridge(response.data);
}

export async function createBridge(data: Partial<ApiBridge>): Promise<Bridge> {
  const response = await api.post<ApiBridge>('/bridges', data);
  return mapApiBridgeToBridge(response.data);
}

export async function updateBridge(id: string, data: Partial<ApiBridge>): Promise<Bridge> {
  const response = await api.put<ApiBridge>(`/bridges/${id}`, data);
  return mapApiBridgeToBridge(response.data);
}

export async function deleteBridge(id: string): Promise<void> {
  await api.delete(`/bridges/${id}`);
}

export const bridgesService = {
  getBridges,
  getBridge,
  createBridge,
  updateBridge,
  deleteBridge,
};
