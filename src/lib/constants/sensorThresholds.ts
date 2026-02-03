/**
 * Constantes de thresholds para sensores
 * Prontos para futura integração com API de configurações
 */

export interface SensorThresholds {
  frequency: {
    normal: number;      // < 3.7 Hz = Normal
    attention: number;   // 3.7 - 7.0 Hz = Atenção
    alert: number;       // > 7.0 Hz = Alerta
    reference: number;   // Valor de referência para cálculo de variação
  };
  acceleration: {
    normal: number;      // < 10 m/s² = Normal
    attention: number;   // 10 - 20 m/s² = Atenção
    alert: number;       // > 20 m/s² = Alerta
    reference: number;   // Valor de referência para cálculo de variação
  };
}

/**
 * Valores padrão dos thresholds
 * Estes valores podem ser alterados pelo backend futuramente
 */
export const DEFAULT_THRESHOLDS: SensorThresholds = {
  frequency: {
    normal: 3.7,      // Abaixo disso é Normal
    attention: 7.0,   // Entre 3.7 e 7.0 é Atenção
    alert: 7.0,       // Acima de 7.0 é Alerta
    reference: 3.7,   // Linha de referência nos gráficos
  },
  acceleration: {
    normal: 10,       // Abaixo disso é Normal
    attention: 20,    // Entre 10 e 20 é Atenção
    alert: 20,        // Acima de 20 é Alerta
    reference: 10,    // Linha de referência nos gráficos
  },
};

/**
 * Cores e labels para cada status
 */
export const STATUS_COLORS = {
  normal: { 
    label: 'Normal', 
    color: 'hsl(var(--success))', 
    bgClass: 'bg-success', 
    textClass: 'text-success' 
  },
  attention: { 
    label: 'Atenção', 
    color: 'hsl(var(--warning))', 
    bgClass: 'bg-warning', 
    textClass: 'text-warning' 
  },
  alert: { 
    label: 'Alerta', 
    color: 'hsl(var(--destructive))', 
    bgClass: 'bg-destructive', 
    textClass: 'text-destructive' 
  },
} as const;

export type SensorStatusType = keyof typeof STATUS_COLORS;
