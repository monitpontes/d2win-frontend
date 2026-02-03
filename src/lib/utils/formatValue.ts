/**
 * Formata um valor para exibição, retornando "-" se o valor for vazio/inválido.
 * 
 * @param value - O valor a ser formatado
 * @param suffix - Sufixo opcional para adicionar ao valor (ex: 'm', 'Hz', ' ton')
 * @param options - Opções adicionais de formatação
 * @returns String formatada ou "-" se o valor for inválido
 */
export function formatValue(
  value: any,
  suffix: string = '',
  options?: {
    decimals?: number;
    zeroIsEmpty?: boolean;
    prefix?: string;
  }
): string {
  const { decimals, zeroIsEmpty = false, prefix = '' } = options || {};
  
  // Valores que devem exibir "-"
  if (
    value === null ||
    value === undefined ||
    value === '' ||
    (zeroIsEmpty && value === 0) ||
    (typeof value === 'number' && isNaN(value))
  ) {
    return '-';
  }
  
  // Formatação numérica
  if (typeof value === 'number' && decimals !== undefined) {
    return `${prefix}${value.toFixed(decimals)}${suffix}`;
  }
  
  return `${prefix}${value}${suffix}`;
}

/**
 * Formata uma data para exibição, retornando "-" se inválida.
 */
export function formatDateValue(
  dateValue: string | Date | null | undefined,
  formatStr: string = 'dd/MM/yyyy'
): string {
  if (!dateValue) return '-';
  
  try {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    if (isNaN(date.getTime())) return '-';
    
    // Simple formatting without date-fns for basic cases
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    switch (formatStr) {
      case 'dd/MM/yyyy':
        return `${day}/${month}/${year}`;
      case 'dd/MM/yyyy HH:mm':
        return `${day}/${month}/${year} ${hours}:${minutes}`;
      case 'dd/MM HH:mm':
        return `${day}/${month} ${hours}:${minutes}`;
      default:
        return `${day}/${month}/${year}`;
    }
  } catch {
    return '-';
  }
}

/**
 * Mapeamento de tipos de sensor para labels em português
 */
export const sensorTypeLabels: Record<string, string> = {
  'acceleration': 'Aceleração',
  'frequency': 'Frequência',
  'command_box': 'Caixa de Comando',
  'accelerometer': 'Acelerômetro',
  'frequencia': 'Frequência',
  'aceleracao': 'Aceleração',
};

/**
 * Retorna o label do tipo de sensor
 */
export function getSensorTypeLabel(type: string | undefined | null): string {
  if (!type) return '-';
  return sensorTypeLabels[type.toLowerCase()] || type;
}
