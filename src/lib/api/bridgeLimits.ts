import { api } from './client';

// API response structure
export interface ApiBridgeLimits {
  _id: string;
  bridge_id: { _id: string } | string;
  freq_alert: number;
  freq_critical: number;
  accel_alert: number;
  accel_critical: number;
}

// Frontend-friendly structure
export interface BridgeLimits {
  id: string;
  bridgeId: string;
  freqAlert: number;      // Limite atenção frequência (Hz)
  freqCritical: number;   // Limite crítico frequência (Hz)
  accelAlert: number;     // Limite atenção aceleração (m/s²)
  accelCritical: number;  // Limite crítico aceleração (m/s²)
}

// Default fallback values
export const DEFAULT_LIMITS: Omit<BridgeLimits, 'id' | 'bridgeId'> = {
  freqAlert: 3.7,
  freqCritical: 7.0,
  accelAlert: 10,
  accelCritical: 15,
};

function mapApiBridgeLimits(apiLimits: ApiBridgeLimits): BridgeLimits {
  const bridgeId = typeof apiLimits.bridge_id === 'string' 
    ? apiLimits.bridge_id 
    : apiLimits.bridge_id._id;

  return {
    id: apiLimits._id,
    bridgeId,
    freqAlert: apiLimits.freq_alert,
    freqCritical: apiLimits.freq_critical,
    accelAlert: apiLimits.accel_alert,
    accelCritical: apiLimits.accel_critical,
  };
}

export const bridgeLimitsService = {
  async getBridgeLimits(bridgeId: string): Promise<BridgeLimits | null> {
    try {
      const response = await api.get<ApiBridgeLimits[]>('/bridge-limits', {
        params: { bridge_id: bridgeId }
      });
      
      if (response.data && response.data.length > 0) {
        return mapApiBridgeLimits(response.data[0]);
      }
      
      return null;
    } catch (error) {
      console.error('[BridgeLimits] Error fetching limits:', error);
      return null;
    }
  },

  async updateBridgeLimits(
    bridgeId: string, 
    data: Partial<Omit<BridgeLimits, 'id' | 'bridgeId'>>
  ): Promise<BridgeLimits | null> {
    try {
      const payload = {
        bridge_id: bridgeId,
        freq_alert: data.freqAlert,
        freq_critical: data.freqCritical,
        accel_alert: data.accelAlert,
        accel_critical: data.accelCritical,
      };
      
      const response = await api.put<ApiBridgeLimits>('/bridge-limits', payload);
      
      if (response.data) {
        return mapApiBridgeLimits(response.data);
      }
      
      return null;
    } catch (error) {
      console.error('[BridgeLimits] Error updating limits:', error);
      throw error;
    }
  },
};
