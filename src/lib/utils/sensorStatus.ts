/**
 * Utilitários para calcular status e variação de sensores
 */

import { 
  DEFAULT_THRESHOLDS, 
  STATUS_COLORS, 
  type SensorThresholds,
  type SensorStatusType 
} from '@/lib/constants/sensorThresholds';

export type { SensorStatusType };

/**
 * Calcula o status do sensor baseado no valor e tipo
 * @param value - Valor atual do sensor
 * @param type - Tipo de sensor ('frequency' ou 'acceleration')
 * @param thresholds - Thresholds customizados (opcional)
 * @returns Status: 'normal' | 'attention' | 'alert'
 */
export function getSensorStatus(
  value: number | null | undefined,
  type: 'frequency' | 'acceleration',
  thresholds: SensorThresholds = DEFAULT_THRESHOLDS
): SensorStatusType {
  if (value === null || value === undefined || isNaN(value)) {
    return 'normal'; // Default para valores inválidos
  }

  const limits = thresholds[type];
  
  if (value < limits.normal) {
    return 'normal';
  } else if (value <= limits.attention) {
    return 'attention';
  }
  return 'alert';
}

/**
 * Calcula a variação percentual em relação ao valor de referência
 * @param value - Valor atual do sensor
 * @param type - Tipo de sensor ('frequency' ou 'acceleration')
 * @param thresholds - Thresholds customizados (opcional)
 * @returns Variação percentual
 */
export function calculateVariation(
  value: number | null | undefined,
  type: 'frequency' | 'acceleration',
  thresholds: SensorThresholds = DEFAULT_THRESHOLDS
): number {
  if (value === null || value === undefined || isNaN(value)) {
    return 0;
  }

  const reference = thresholds[type].reference;
  if (reference === 0) return 0;
  
  return ((value - reference) / reference) * 100;
}

/**
 * Retorna a configuração visual do status
 */
export function getStatusConfig(status: SensorStatusType) {
  return STATUS_COLORS[status];
}

/**
 * Formata a variação para exibição
 * @param variation - Valor da variação percentual
 * @returns String formatada (ex: "+15.3%", "-5.2%")
 */
export function formatVariation(variation: number | null | undefined): string {
  if (variation === null || variation === undefined || isNaN(variation)) {
    return '-';
  }
  const sign = variation >= 0 ? '+' : '';
  return `${sign}${variation.toFixed(1)}%`;
}

/**
 * Retorna a cor CSS da variação baseada no valor absoluto
 * @param variation - Valor da variação percentual
 * @returns Classe CSS de cor
 */
export function getVariationColor(variation: number | null | undefined): string {
  if (variation === null || variation === undefined || isNaN(variation)) {
    return 'text-muted-foreground';
  }
  
  const absVariation = Math.abs(variation);
  if (absVariation > 20) return 'text-destructive';
  if (absVariation > 10) return 'text-warning';
  return 'text-success';
}

/**
 * Retorna o texto de referência formatado para o tipo de sensor
 * @param type - Tipo de sensor
 * @param thresholds - Thresholds customizados (opcional)
 * @returns String formatada (ex: "< 3.7 Hz", "< 10 m/s²")
 */
export function getReferenceText(
  type: 'frequency' | 'acceleration',
  thresholds: SensorThresholds = DEFAULT_THRESHOLDS
): string {
  const limits = thresholds[type];
  const unit = type === 'frequency' ? 'Hz' : 'm/s²';
  return `< ${limits.normal} ${unit}`;
}

/**
 * Retorna os limites para linhas de referência nos gráficos
 */
export function getChartReferenceLimits(
  type: 'frequency' | 'acceleration',
  thresholds: SensorThresholds = DEFAULT_THRESHOLDS
) {
  const limits = thresholds[type];
  
  if (type === 'frequency') {
    return {
      reference: { value: limits.reference, label: `Referência (${limits.reference} Hz)` },
      attention: { value: limits.attention, label: `Atenção (${limits.attention} Hz)` },
    };
  }
  
  return {
    normal: { value: limits.normal, label: `Atenção (${limits.normal} m/s²)` },
    alert: { value: limits.alert, label: `Alerta (${limits.alert} m/s²)` },
  };
}
