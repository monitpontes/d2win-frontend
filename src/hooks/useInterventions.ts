import { useState, useEffect, useCallback } from 'react';
import type { Intervention, InterventionPriority, InterventionType } from '@/types';
import { mockInterventions, mockBridges } from '@/data/mockData';

// Session storage key
const STORAGE_KEY = 'interventions_data';

export interface NewIntervention {
  bridgeId: string;
  priority: InterventionPriority;
  type: InterventionType;
  description: string;
  scheduledDate: string;
  estimatedDuration: string;
  team: string;
}

export function useInterventions() {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load interventions from session storage or mock data
  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setInterventions(JSON.parse(stored));
      } catch {
        setInterventions(mockInterventions);
      }
    } else {
      setInterventions(mockInterventions);
    }
    setIsLoading(false);
  }, []);

  // Save to session storage whenever interventions change
  useEffect(() => {
    if (!isLoading) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(interventions));
    }
  }, [interventions, isLoading]);

  const addIntervention = useCallback((data: NewIntervention) => {
    const bridge = mockBridges.find(b => b.id === data.bridgeId);
    const newIntervention: Intervention = {
      id: `intervention-${Date.now()}`,
      bridgeId: data.bridgeId,
      bridgeName: bridge?.name || 'Ponte Desconhecida',
      priority: data.priority,
      type: data.type,
      description: data.description,
      scheduledDate: data.scheduledDate,
      estimatedDuration: data.estimatedDuration,
      team: data.team,
    };
    setInterventions(prev => [newIntervention, ...prev]);
    return newIntervention;
  }, []);

  const updateIntervention = useCallback((id: string, data: Partial<NewIntervention>) => {
    setInterventions(prev => prev.map(intervention => {
      if (intervention.id === id) {
        const bridge = data.bridgeId ? mockBridges.find(b => b.id === data.bridgeId) : null;
        return {
          ...intervention,
          ...data,
          bridgeName: bridge?.name || intervention.bridgeName,
        };
      }
      return intervention;
    }));
  }, []);

  const deleteIntervention = useCallback((id: string) => {
    setInterventions(prev => prev.filter(intervention => intervention.id !== id));
  }, []);

  const getInterventionsByBridge = useCallback((bridgeId: string) => {
    return interventions.filter(i => i.bridgeId === bridgeId);
  }, [interventions]);

  const resetToMock = useCallback(() => {
    setInterventions(mockInterventions);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    interventions,
    isLoading,
    addIntervention,
    updateIntervention,
    deleteIntervention,
    getInterventionsByBridge,
    resetToMock,
  };
}
