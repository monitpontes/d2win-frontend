import type { Bridge, Intervention, BridgeEvent, Sensor, StructuralProblem } from '@/types';

// CSV Export utility
export function exportToCSV<T extends Record<string, any>>(data: T[], filename: string, headers?: Record<string, string>) {
  if (data.length === 0) {
    alert('Não há dados para exportar.');
    return;
  }

  const keys = Object.keys(data[0]);
  const headerRow = headers 
    ? keys.map(k => headers[k] || k).join(',')
    : keys.join(',');

  const rows = data.map(item => 
    keys.map(key => {
      const value = item[key];
      // Handle values that might contain commas or quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value ?? '';
    }).join(',')
  );

  const csvContent = [headerRow, ...rows].join('\n');
  downloadFile(csvContent, `${filename}.csv`, 'text/csv;charset=utf-8;');
}

// JSON Export utility
export function exportToJSON<T>(data: T, filename: string) {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, `${filename}.json`, 'application/json');
}

// Download file helper
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Bridge report data
export function generateBridgeReport(bridge: Bridge, sensors: Sensor[], events: BridgeEvent[], interventions: Intervention[], problems: StructuralProblem[]) {
  return {
    generatedAt: new Date().toISOString(),
    bridge: {
      id: bridge.id,
      name: bridge.name,
      location: bridge.location,
      concession: bridge.concession,
      rodovia: bridge.rodovia,
      km: bridge.km,
      typology: bridge.typology,
      material: bridge.material,
      length: bridge.length,
      width: bridge.width,
      constructionYear: bridge.constructionYear,
      structuralStatus: bridge.structuralStatus,
      operationalCriticality: bridge.operationalCriticality,
      sensorCount: bridge.sensorCount,
      hasActiveAlerts: bridge.hasActiveAlerts,
      lastUpdate: bridge.lastUpdate,
    },
    sensors: sensors.map(s => ({
      id: s.id,
      name: s.name,
      type: s.type,
      status: s.status,
      lastReading: s.lastReading,
    })),
    events: events.map(e => ({
      id: e.id,
      timestamp: e.timestamp,
      type: e.type,
      description: e.description,
      severity: e.severity,
      status: e.status,
    })),
    interventions: interventions.map(i => ({
      id: i.id,
      type: i.type,
      priority: i.priority,
      description: i.description,
      scheduledDate: i.scheduledDate,
      estimatedDuration: i.estimatedDuration,
      team: i.team,
    })),
    problems: problems.map(p => ({
      id: p.id,
      type: p.type,
      description: p.description,
      date: p.date,
      status: p.status,
    })),
  };
}

// Export sensor readings
export function exportSensorData(sensors: Sensor[], bridgeName: string) {
  const data = sensors.map(sensor => ({
    sensorId: sensor.id,
    name: sensor.name,
    type: sensor.type,
    status: sensor.status,
    value: sensor.lastReading.value,
    unit: sensor.lastReading.unit,
    timestamp: sensor.lastReading.timestamp,
    alertThreshold: sensor.alertThreshold,
    criticalThreshold: sensor.criticalThreshold,
  }));

  const headers: Record<string, string> = {
    sensorId: 'ID Sensor',
    name: 'Nome',
    type: 'Tipo',
    status: 'Status',
    value: 'Valor',
    unit: 'Unidade',
    timestamp: 'Data/Hora',
    alertThreshold: 'Limite Alerta',
    criticalThreshold: 'Limite Crítico',
  };

  const filename = `sensores_${bridgeName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;
  exportToCSV(data, filename, headers);
}

// Export events
export function exportEvents(events: BridgeEvent[], bridgeName: string) {
  const data = events.map(event => ({
    id: event.id,
    timestamp: event.timestamp,
    type: event.type,
    description: event.description,
    severity: event.severity,
    status: event.status,
  }));

  const headers: Record<string, string> = {
    id: 'ID Evento',
    timestamp: 'Data/Hora',
    type: 'Tipo',
    description: 'Descrição',
    severity: 'Severidade',
    status: 'Status',
  };

  const filename = `eventos_${bridgeName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;
  exportToCSV(data, filename, headers);
}

// Export interventions
export function exportInterventions(interventions: Intervention[]) {
  const data = interventions.map(i => ({
    id: i.id,
    bridgeName: i.bridgeName,
    type: i.type,
    priority: i.priority,
    description: i.description,
    scheduledDate: i.scheduledDate,
    estimatedDuration: i.estimatedDuration,
    team: i.team,
  }));

  const headers: Record<string, string> = {
    id: 'ID',
    bridgeName: 'Ponte',
    type: 'Tipo',
    priority: 'Prioridade',
    description: 'Descrição',
    scheduledDate: 'Data Agendada',
    estimatedDuration: 'Duração Estimada',
    team: 'Equipe',
  };

  const filename = `intervencoes_${new Date().toISOString().split('T')[0]}`;
  exportToCSV(data, filename, headers);
}

// Generate mock time series data for charts export
export function generateChartDataForExport(bridgeId: string, dataType: 'acceleration' | 'frequency', days: number = 30) {
  const data = [];
  const now = new Date();
  
  for (let i = 0; i < days * 24; i++) {
    const date = new Date(now.getTime() - (days * 24 - i) * 60 * 60 * 1000);
    
    if (dataType === 'acceleration') {
      data.push({
        timestamp: date.toISOString(),
        axisX: (9.5 + Math.random() * 1.0).toFixed(3),
        axisY: (9.6 + Math.random() * 0.9).toFixed(3),
        axisZ: (9.7 + Math.random() * 1.1).toFixed(3),
        unit: 'm/s²',
      });
    } else {
      data.push({
        timestamp: date.toISOString(),
        axisX: (3.3 + Math.random() * 0.7).toFixed(3),
        axisZ: (3.4 + Math.random() * 0.6).toFixed(3),
        unit: 'Hz',
      });
    }
  }
  
  return data;
}

export function exportChartData(bridgeId: string, bridgeName: string, dataType: 'acceleration' | 'frequency', days: number = 30) {
  const data = generateChartDataForExport(bridgeId, dataType, days);
  const typeName = dataType === 'acceleration' ? 'aceleracao' : 'frequencia';
  const filename = `${typeName}_${bridgeName.replace(/\s+/g, '_')}_${days}dias_${new Date().toISOString().split('T')[0]}`;
  
  const headers: Record<string, string> = dataType === 'acceleration' 
    ? { timestamp: 'Data/Hora', axisX: 'Eixo X', axisY: 'Eixo Y', axisZ: 'Eixo Z', unit: 'Unidade' }
    : { timestamp: 'Data/Hora', axisX: 'Eixo X', axisZ: 'Eixo Z', unit: 'Unidade' };
  
  exportToCSV(data, filename, headers);
}
