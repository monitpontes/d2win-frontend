import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, ReferenceLine, Scatter, ComposedChart } from 'recharts';
import { Filter, Download, AlertTriangle, TrendingUp, TrendingDown, Maximize2, Calendar, Table, CheckCircle, FileDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportChartData, exportToJSON } from '@/lib/exportUtils';
import { toast } from 'sonner';
import { CreateInterventionDialog } from '@/components/interventions/CreateInterventionDialog';
import { useInterventions, type NewIntervention } from '@/hooks/useInterventions';
import { useTelemetry } from '@/hooks/useTelemetry';
import { useBridge } from '@/hooks/useBridges';
import { useBridgeLimits } from '@/hooks/useBridgeLimits';
import { limitsToThresholds } from '@/lib/api/bridgeLimits';
import { formatValue, formatDateValue } from '@/lib/utils/formatValue';
import { getSensorStatus, getStatusConfig, calculateVariation, formatVariation } from '@/lib/utils/sensorStatus';

interface DataAnalysisSectionProps {
  bridgeId: string;
}

interface AnomalyEvent {
  id: string;
  timestamp: string;
  sensor: string;
  type: string;
  metric: string;
  value: number;
  limit: number;
  currentValue: number;
  severity: 'Crítico' | 'Alerta' | 'Normal';
  description: string;
}

// Axis types
type AccelerationAxis = 'X' | 'Y' | 'Z' | 'Todos';
type FrequencyAxis = 'X' | 'Z' | 'Todos';
type MetricFilter = 'RMS' | 'Pico';
type DataTypeFilter = 'Aceleração' | 'Frequência';

export default function DataAnalysisSection({ bridgeId }: DataAnalysisSectionProps) {
  const [selectedSensors, setSelectedSensors] = useState<string[]>(['Todos', 'T1 Freq N', 'T1 Freq S', 'T1 AccN', 'S4 AccN', 'T Flow']);
  const [dataType, setDataType] = useState<string[]>(['Ambos']);
  const [period, setPeriod] = useState('30d');
  const [aggregation, setAggregation] = useState('1 sem');
  const [showAnomalies, setShowAnomalies] = useState(true);
  
  // Chart-specific axis filters
  const [accelAxisFilter, setAccelAxisFilter] = useState<AccelerationAxis>('Z');
  const [freqAxisFilter, setFreqAxisFilter] = useState<FrequencyAxis>('Z');
  const [distAxisFilter, setDistAxisFilter] = useState<AccelerationAxis>('Z');
  const [distDataTypeFilter, setDistDataTypeFilter] = useState<DataTypeFilter>('Aceleração');
  const [beamAxisFilter, setBeamAxisFilter] = useState<FrequencyAxis>('Z');
  const [beamSensor1, setBeamSensor1] = useState('S1');
  const [beamSensor2, setBeamSensor2] = useState('S2');
  
  const [metricFilter, setMetricFilter] = useState<MetricFilter>('RMS');
  const [fullscreenChart, setFullscreenChart] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<AnomalyEvent | null>(null);
  const [isInterventionDialogOpen, setIsInterventionDialogOpen] = useState(false);
  const [showScheduleConfirm, setShowScheduleConfirm] = useState(false);
  
  const { addIntervention } = useInterventions();
  const { bridge } = useBridge(bridgeId);
  const { latestData, timeSeriesData, isLoading: isTelemetryLoading, isConnected, lastUpdate } = useTelemetry(bridgeId);
  const { rawLimits } = useBridgeLimits(bridgeId);
  const thresholds = useMemo(() => limitsToThresholds(rawLimits), [rawLimits]);
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  // Mock anomaly event
  const anomalyEvent: AnomalyEvent = {
    id: '1',
    timestamp: '09/01/2026, 22:06',
    sensor: 'accel1-Z',
    type: 'Aceleração',
    metric: 'rmsAccelZ',
    value: 10.706,
    limit: 10.5,
    currentValue: 0.122,
    severity: 'Crítico',
    description: 'Sensor accel1-Z registrou valores 8821% acima da média por aproximadamente 31 minutos. Aceleração RMS elevada no eixo Z: 10.706 m/s² (limite: 10.5 m/s²)',
  };

  // Compute KPI data from real telemetry or fallback to defaults
  const kpiData = useMemo(() => {
    if (latestData.length > 0) {
      const frequencies = latestData.filter(d => d.frequency).map(d => d.frequency!);
      const accelerations = latestData.filter(d => d.acceleration?.z).map(d => d.acceleration!.z);
      
      const freqAvg = frequencies.length > 0 ? frequencies.reduce((a, b) => a + b, 0) / frequencies.length : 0;
      const accelAvg = accelerations.length > 0 ? accelerations.reduce((a, b) => a + b, 0) / accelerations.length : 0;
      const accelMax = accelerations.length > 0 ? Math.max(...accelerations) : 0;
      
      // Calculate variation from reference
      const accelVariation = calculateVariation(accelMax, 'acceleration', thresholds);
      const freqStatus = getSensorStatus(freqAvg, 'frequency', thresholds);
      const accelStatus = getSensorStatus(accelMax, 'acceleration', thresholds);
      
      return {
        frequencyAvg: frequencies.length > 0 ? freqAvg.toFixed(2) : '-',
        frequencyMin: frequencies.length > 0 ? Math.min(...frequencies).toFixed(2) : '-',
        frequencyMax: frequencies.length > 0 ? Math.max(...frequencies).toFixed(2) : '-',
        frequencyPeak: frequencies.length > 0 ? Math.max(...frequencies).toFixed(2) : '-',
        frequencyStatus: freqStatus,
        frequencyReference: `< ${thresholds.frequency.normal} Hz`,
        accelerationAvg: accelerations.length > 0 ? accelAvg.toFixed(2) : '-',
        accelerationMin: accelerations.length > 0 ? Math.min(...accelerations).toFixed(2) : '-',
        accelerationMax: accelerations.length > 0 ? accelMax.toFixed(2) : '-',
        accelerationPeak: accelerations.length > 0 ? accelMax.toFixed(2) : '-',
        accelerationStatus: accelStatus,
        accelerationReference: `< ${thresholds.acceleration.normal} m/s²`,
        vibrationLevel: accelVariation !== 0 ? Math.abs(accelVariation).toFixed(1) : '-',
        structuralStatus: bridge?.structuralStatus || '-',
      };
    }
    // Fallback mock data
    return {
      frequencyAvg: '3.68',
      frequencyMin: '3.22',
      accelerationAvg: '9.85',
      accelerationMin: '9.52',
      accelerationMax: '10.45',
      accelerationPeak: '10.92',
      frequencyMax: '4.15',
      frequencyPeak: '4.18',
      frequencyStatus: 'normal' as const,
      frequencyReference: `< ${thresholds.frequency.normal} Hz`,
      accelerationStatus: 'attention' as const,
      accelerationReference: `< ${thresholds.acceleration.normal} m/s²`,
      vibrationLevel: '21.8',
      structuralStatus: 'Crítico',
    };
  }, [latestData, bridge, thresholds]);

  // Real time series data for acceleration from API + WebSocket
  const timeSeriesAcceleration = useMemo(() => {
    if (!timeSeriesData || timeSeriesData.length === 0) {
      // Retorna array vazio se não há dados (sem mock)
      return [];
    }

    // Use real acceleration data
    return timeSeriesData
      .filter(d => d.type === 'acceleration')
      .slice(-50)
      .map(d => ({
        date: formatDateValue(d.timestamp, 'HH:mm:ss'),
        valueX: d.value, // API only provides Z, use same for display
        valueY: d.value,
        valueZ: d.value,
        anomalyX: null,
        anomalyY: null,
        anomalyZ: d.severity === 'critical' ? d.value : null,
        device: d.deviceId,
        axis: d.axis || 'z',
      }));
  }, [timeSeriesData]);

  // Detectar eixos disponíveis nos dados de aceleração
  const availableAccelAxes = useMemo(() => {
    if (!timeSeriesData?.length) return ['Z'];
    
    const axes = new Set<string>();
    timeSeriesData
      .filter(d => d.type === 'acceleration')
      .forEach(d => axes.add((d.axis || 'z').toUpperCase()));
    
    return Array.from(axes).length > 0 ? Array.from(axes).sort() : ['Z'];
  }, [timeSeriesData]);

  // Real time series data for frequency from API + WebSocket
  const timeSeriesFrequency = useMemo(() => {
    if (!timeSeriesData || timeSeriesData.length === 0) {
      // Retorna array vazio se não há dados (sem mock)
      return [];
    }

    // Group frequency data by timestamp for chart
    const freqData = timeSeriesData.filter(d => d.type === 'frequency').slice(-100);
    
    // Build chart data with sensor columns
    const byTimestamp = new Map<string, Record<string, number>>();
    freqData.forEach(d => {
      const time = formatDateValue(d.timestamp, 'HH:mm:ss');
      if (!byTimestamp.has(time)) {
        byTimestamp.set(time, { date: time } as any);
      }
      const row = byTimestamp.get(time)!;
      // Map deviceId to sensor columns (s1Z, s2Z, etc.)
      const sensorNum = d.deviceId.replace(/\D/g, '').slice(-1) || '1';
      row[`s${sensorNum}Z`] = d.value;
      row[`s${sensorNum}X`] = d.value;
      row['referenceZ'] = thresholds.frequency.reference;
      row['referenceX'] = thresholds.frequency.reference;
    });

    return Array.from(byTimestamp.values());
  }, [timeSeriesData, thresholds]);

  // 24-hour data for anomaly modal
  const hourlyData = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => ({
      time: `${String(i).padStart(2, '0')}:00`,
      value: i >= 11 && i <= 13 ? (i === 12 ? 10.7 : 0.5 + Math.random() * 0.3) : 0.1 + Math.random() * 0.2,
      isAnomaly: i === 12,
    }));
  }, []);

  // Distribution data based on axis and data type
  const distributionData = useMemo(() => {
    if (distDataTypeFilter === 'Aceleração') {
      // Acceleration values: 9.5-11 m/s²
      return [
        { range: '9.5-9.7', count: 85 },
        { range: '9.7-9.9', count: 180 },
        { range: '9.9-10.1', count: 280 },
        { range: '10.1-10.3', count: 220 },
        { range: '10.3-10.5', count: 25 },
        { range: '>10.5', count: 10 },
      ];
    }
    // Frequency values: 3.20-4.20 Hz
    return [
      { range: '3.2-3.4', count: 60 },
      { range: '3.4-3.6', count: 150 },
      { range: '3.6-3.8', count: 320 },
      { range: '3.8-4.0', count: 280 },
      { range: '4.0-4.2', count: 140 },
      { range: '>4.2', count: 20 },
    ];
  }, [distDataTypeFilter]);

  // Beam comparison data with sensor filters (3.20-4.20 Hz)
  const beamComparisonData = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      date: `${String(i + 1).padStart(2, '0')}/01`,
      s1X: 3.5 + Math.random() * 0.5,
      s1Z: 3.6 + Math.random() * 0.4,
      s2X: 3.4 + Math.random() * 0.55,
      s2Z: 3.5 + Math.random() * 0.5,
      s3X: 3.3 + Math.random() * 0.5,
      s3Z: 3.4 + Math.random() * 0.55,
      s4X: 3.6 + Math.random() * 0.4,
      s4Z: 3.7 + Math.random() * 0.45,
    }));
  }, []);

  const sensorOptions = ['Todos', 'T1 Freq N', 'T1 Freq S', 'T1 AccN', 'S4 AccN', 'T Flow'];
  const dataTypeOptions = ['Ambos', 'Aceleração', 'Frequência'];
  const sensorSelectOptions = ['S1', 'S2', 'S3', 'S4'];

  const toggleSensor = (sensor: string) => {
    if (sensor === 'Todos') {
      if (selectedSensors.includes('Todos')) {
        setSelectedSensors([]);
      } else {
        setSelectedSensors([...sensorOptions]);
      }
    } else {
      setSelectedSensors(prev => 
        prev.includes(sensor) 
          ? prev.filter(s => s !== sensor && s !== 'Todos')
          : [...prev.filter(s => s !== 'Todos'), sensor]
      );
    }
  };

  const toggleDataType = (type: string) => {
    if (type === 'Ambos') {
      setDataType(['Ambos']);
    } else {
      setDataType(prev => {
        const newTypes = prev.filter(t => t !== 'Ambos');
        if (prev.includes(type)) {
          return newTypes.filter(t => t !== type);
        }
        return [...newTypes, type];
      });
    }
  };

  // Colors for sensors
  const sensorColors = {
    S1: 'hsl(220, 70%, 50%)',
    S2: 'hsl(142, 76%, 36%)',
    S3: 'hsl(38, 92%, 50%)',
    S4: 'hsl(0, 84%, 60%)',
  };

  // Render acceleration chart with X/Y/Z or all
  const renderAccelerationChart = (height: number = 192) => {
    // Se não há dados, mostrar mensagem
    if (timeSeriesAcceleration.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm" style={{ height }}>
          Sem dados de aceleração disponíveis
        </div>
      );
    }

    const showAll = accelAxisFilter === 'Todos';
    
    return (
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={timeSeriesAcceleration}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
          <XAxis dataKey="date" tick={{ fontSize: 9 }} />
          <YAxis domain={[9.2, 11.2]} tick={{ fontSize: 9 }} label={{ value: `${metricFilter} Eixo ${accelAxisFilter} (m/s²)`, angle: -90, position: 'insideLeft', fontSize: 10 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <ReferenceLine y={thresholds.acceleration.alert} stroke="hsl(var(--muted-foreground))" strokeDasharray="8 4" label={{ value: `Limite Alerta (${thresholds.acceleration.alert})`, fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
          <ReferenceLine y={thresholds.acceleration.normal} stroke="hsl(var(--warning))" strokeDasharray="5 5" label={{ value: `Limite Atenção (${thresholds.acceleration.normal})`, fontSize: 9, fill: 'hsl(var(--warning))' }} />
          
          {(showAll || accelAxisFilter === 'X') && (
            <Line type="monotone" dataKey="valueX" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={false} name="Eixo X" />
          )}
          {(showAll || accelAxisFilter === 'Y') && (
            <Line type="monotone" dataKey="valueY" stroke="hsl(var(--chart-2))" strokeWidth={1.5} dot={false} name="Eixo Y" />
          )}
          {(showAll || accelAxisFilter === 'Z') && (
            <Line type="monotone" dataKey="valueZ" stroke="hsl(var(--chart-3))" strokeWidth={1.5} dot={false} name="Eixo Z" />
          )}
          
          {showAnomalies && (
            <Scatter 
              dataKey={accelAxisFilter === 'X' ? 'anomalyX' : accelAxisFilter === 'Y' ? 'anomalyY' : 'anomalyZ'} 
              fill="hsl(var(--destructive))"
              shape={(props: any) => {
                const key = accelAxisFilter === 'X' ? 'anomalyX' : accelAxisFilter === 'Y' ? 'anomalyY' : 'anomalyZ';
                if (!props.payload[key]) return null;
                return (
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    r={6}
                    fill="hsl(var(--destructive))"
                    stroke="white"
                    strokeWidth={2}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedEvent(anomalyEvent)}
                  />
                );
              }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    );
  };

  // Render frequency chart with X/Z or all, showing multiple sensors
  const renderFrequencyChart = (height: number = 192) => {
    // Se não há dados, mostrar mensagem
    if (timeSeriesFrequency.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm" style={{ height }}>
          Sem dados de frequência disponíveis
        </div>
      );
    }

    const showAll = freqAxisFilter === 'Todos';
    const axisKey = freqAxisFilter === 'Todos' ? 'Z' : freqAxisFilter;
    
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={timeSeriesFrequency}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
          <XAxis dataKey="date" tick={{ fontSize: 9 }} />
          <YAxis domain={[3.0, 4.5]} tick={{ fontSize: 9 }} label={{ value: `domFreq1 Eixo ${freqAxisFilter} (Hz)`, angle: -90, position: 'insideLeft', fontSize: 10 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <ReferenceLine y={thresholds.frequency.reference} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" label={{ value: `Referência (${thresholds.frequency.reference} Hz)`, fontSize: 9 }} />
          
          {showAll ? (
            <>
              <Line type="monotone" dataKey="s1Z" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={false} name="S1" />
              <Line type="monotone" dataKey="s2Z" stroke="hsl(var(--chart-2))" strokeWidth={1.5} dot={false} name="S2" />
              <Line type="monotone" dataKey="s3Z" stroke="hsl(var(--chart-3))" strokeWidth={1.5} dot={false} name="S3" />
              <Line type="monotone" dataKey="s4Z" stroke="hsl(var(--chart-4))" strokeWidth={1.5} dot={false} name="S4" />
            </>
          ) : (
            <>
              <Line type="monotone" dataKey={`s1${axisKey}`} stroke="hsl(var(--primary))" strokeWidth={1.5} dot={false} name="S1" />
              <Line type="monotone" dataKey={`s2${axisKey}`} stroke="hsl(var(--chart-2))" strokeWidth={1.5} dot={false} name="S2" />
              <Line type="monotone" dataKey={`s3${axisKey}`} stroke="hsl(var(--chart-3))" strokeWidth={1.5} dot={false} name="S3" />
              <Line type="monotone" dataKey={`s4${axisKey}`} stroke="hsl(var(--chart-4))" strokeWidth={1.5} dot={false} name="S4" />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  // Render distribution chart
  const renderDistributionChart = (height: number = 192) => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={distributionData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
        <XAxis dataKey="range" tick={{ fontSize: 9 }} />
        <YAxis tick={{ fontSize: 9 }} />
        <Tooltip />
        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );

  // Render beam comparison chart with sensor selection
  const renderBeamComparisonChart = (height: number = 192) => {
    const axisKey = beamAxisFilter === 'Todos' ? 'Z' : beamAxisFilter;
    
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={beamComparisonData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
          <XAxis dataKey="date" tick={{ fontSize: 9 }} />
          <YAxis domain={[3.0, 4.5]} tick={{ fontSize: 9 }} label={{ value: `domFreq1 Eixo ${beamAxisFilter} (Hz)`, angle: -90, position: 'insideLeft', fontSize: 10 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Line 
            type="monotone" 
            dataKey={`${beamSensor1.toLowerCase()}${axisKey}`} 
            stroke={sensorColors[beamSensor1 as keyof typeof sensorColors]} 
            strokeWidth={1.5} 
            dot={false} 
            name={beamSensor1} 
          />
          <Line 
            type="monotone" 
            dataKey={`${beamSensor2.toLowerCase()}${axisKey}`} 
            stroke={sensorColors[beamSensor2 as keyof typeof sensorColors]} 
            strokeWidth={1.5} 
            dot={false} 
            name={beamSensor2} 
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Análise de Dados</h3>

      {/* Filters Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros de Análise
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  exportChartData(bridgeId, bridge?.name || 'ponte', 'acceleration', 30);
                  toast.success('Exportando dados de aceleração...');
                }}
              >
                <FileDown className="h-4 w-4 mr-1" />
                Aceleração CSV
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  exportChartData(bridgeId, bridge?.name || 'ponte', 'frequency', 30);
                  toast.success('Exportando dados de frequência...');
                }}
              >
                <FileDown className="h-4 w-4 mr-1" />
                Frequência CSV
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => {
                  setSelectedSensors(['Todos', 'T1 Freq N', 'T1 Freq S', 'T1 AccN', 'S4 AccN', 'T Flow']);
                  setDataType(['Ambos']);
                  setPeriod('30d');
                  setAggregation('1 sem');
                  setShowAnomalies(true);
                  toast.info('Filtros resetados');
                }}
              >
                Limpar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* Sensors */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Sensores</Label>
              <div className="space-y-2">
                {sensorOptions.map((sensor) => (
                  <div key={sensor} className="flex items-center space-x-2">
                    <Checkbox
                      id={sensor}
                      checked={selectedSensors.includes(sensor)}
                      onCheckedChange={() => toggleSensor(sensor)}
                    />
                    <label htmlFor={sensor} className="text-sm cursor-pointer">{sensor}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* Data Type */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Tipo de Dado</Label>
              <div className="space-y-2">
                {dataTypeOptions.map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={type}
                      checked={dataType.includes(type) || (type !== 'Ambos' && dataType.includes('Ambos'))}
                      onCheckedChange={() => toggleDataType(type)}
                    />
                    <label htmlFor={type} className="text-sm cursor-pointer">{type}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* Period */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Período</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="30d">30/01 a 06/02</SelectItem>
                  <SelectItem value="90d">Últimos 90 dias</SelectItem>
                  <SelectItem value="1y">Último ano</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Aggregation */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Agregação</Label>
              <Select value={aggregation} onValueChange={setAggregation}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1 hora">1 hora</SelectItem>
                  <SelectItem value="1 dia">1 dia</SelectItem>
                  <SelectItem value="1 sem">1 sem</SelectItem>
                  <SelectItem value="1 mês">1 mês</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Show Anomalies */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Exibir anomalias</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={showAnomalies}
                  onCheckedChange={setShowAnomalies}
                />
                <span className="text-sm">{showAnomalies ? 'Sim' : 'Não'}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button>
              <Filter className="h-4 w-4 mr-1" />
              Filtrar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Frequency KPI */}
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Frequência Média Geral</p>
                <p className="text-3xl font-bold">{kpiData.frequencyAvg} Hz</p>
                <p className="text-xs text-muted-foreground">Baseado em {selectedSensors.length} sensor(es)</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-xs text-muted-foreground">Aceleração</p>
                  <p className="font-semibold flex items-center gap-1">
                    <TrendingDown className="h-3 w-3 text-destructive" />
                    E m/s²
                  </p>
                  <p className="text-xs text-muted-foreground">Eixo de Ref</p>
                  <p className="text-lg font-bold">{kpiData.accelerationMax} m/s²</p>
                  <p className="text-xs text-muted-foreground mt-1">Pico Máximo</p>
                  <p className="text-sm font-medium">{kpiData.accelerationPeak} m/s²</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Frequência</p>
                  <p className="font-semibold flex items-center gap-1">
                    <TrendingDown className="h-3 w-3 text-destructive" />
                    E m/s²
                  </p>
                  <p className="text-xs text-muted-foreground">Eixo de Ref</p>
                  <p className="text-lg font-bold">{kpiData.frequencyMax} Hz</p>
                  <p className="text-xs text-muted-foreground mt-1">Pico Máximo</p>
                  <p className="text-sm font-medium">{kpiData.frequencyPeak} Hz</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Acceleration KPI */}
        <Card className="border-l-4 border-l-warning">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Aceleração Média Geral</p>
                <p className="text-3xl font-bold">{kpiData.accelerationAvg} m/s²</p>
                <p className="text-xs text-muted-foreground">Valor: 11.89 m/s²</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-xs text-muted-foreground">Nível: Vibrante</p>
                  <p className="font-semibold flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-destructive" />
                    E m/s²
                  </p>
                  <p className="text-xs text-muted-foreground">diff. limite</p>
                  <p className="text-2xl font-bold text-destructive">{kpiData.vibrationLevel}% <TrendingUp className="inline h-4 w-4" /></p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status Estrutural</p>
                  <Badge variant="destructive" className="mt-1">
                    {kpiData.structuralStatus}
                  </Badge>
                  <div className="flex items-center gap-1 mt-2 text-xs text-destructive">
                    <AlertTriangle className="h-3 w-3" />
                    Intervenção recomendada
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Visualization */}
      <div>
        <h4 className="font-medium mb-1">Visualização de Dados</h4>
        <p className="text-sm text-muted-foreground mb-4">Gráficos de Frequência e Aceleração</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Time Series - Acceleration (X, Y, Z axes) */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Série Temporal - Aceleração</CardTitle>
                  <CardDescription className="text-xs">Dados do sensor accel1 eixo {accelAxisFilter} ao longo do tempo</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={accelAxisFilter} onValueChange={(v: AccelerationAxis) => setAccelAxisFilter(v)}>
                    <SelectTrigger className="h-7 w-20 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableAccelAxes.includes('X') && <SelectItem value="X">X</SelectItem>}
                      {availableAccelAxes.includes('Y') && <SelectItem value="Y">Y</SelectItem>}
                      {availableAccelAxes.includes('Z') && <SelectItem value="Z">Z</SelectItem>}
                      {availableAccelAxes.length > 1 && <SelectItem value="Todos">Todos</SelectItem>}
                    </SelectContent>
                  </Select>
                  <div className="flex border rounded-md overflow-hidden">
                    <Button
                      variant={metricFilter === 'RMS' ? 'default' : 'ghost'}
                      size="sm"
                      className="h-7 px-2 text-xs rounded-none"
                      onClick={() => setMetricFilter('RMS')}
                    >
                      RMS
                    </Button>
                    <Button
                      variant={metricFilter === 'Pico' ? 'default' : 'ghost'}
                      size="sm"
                      className="h-7 px-2 text-xs rounded-none"
                      onClick={() => setMetricFilter('Pico')}
                    >
                      Pico
                    </Button>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setFullscreenChart('acceleration')}>
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                {renderAccelerationChart()}
              </div>
            </CardContent>
          </Card>

          {/* Time Series - Frequency (X, Z axes only) */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Série Temporal - Frequência Dominante</CardTitle>
                  <CardDescription className="text-xs">Dados de domFreq1 eixo {freqAxisFilter} dos 4 sensores de frequência</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={freqAxisFilter} onValueChange={(v: FrequencyAxis) => setFreqAxisFilter(v)}>
                    <SelectTrigger className="h-7 w-20 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="X">X</SelectItem>
                      <SelectItem value="Z">Z</SelectItem>
                      <SelectItem value="Todos">Todos</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setFullscreenChart('frequency')}>
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                {renderFrequencyChart()}
              </div>
            </CardContent>
          </Card>

          {/* Distribution with axis AND data type filter */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Distribuição</CardTitle>
                  <CardDescription className="text-xs">Histograma dos valores medidos - Eixo {distAxisFilter}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={distAxisFilter} onValueChange={(v: AccelerationAxis) => setDistAxisFilter(v)}>
                    <SelectTrigger className="h-7 w-16 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="X">X</SelectItem>
                      <SelectItem value="Y">Y</SelectItem>
                      <SelectItem value="Z">Z</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={distDataTypeFilter} onValueChange={(v: DataTypeFilter) => setDistDataTypeFilter(v)}>
                    <SelectTrigger className="h-7 w-28 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aceleração">Aceleração</SelectItem>
                      <SelectItem value="Frequência">Frequência</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setFullscreenChart('distribution')}>
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                {renderDistributionChart()}
              </div>
            </CardContent>
          </Card>

          {/* Beam Comparison with axis and sensor filters */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Comparação entre Vigas</CardTitle>
                  <CardDescription className="text-xs">domFreq1 eixo {beamAxisFilter} ao longo do tempo - Correlação: 0.084</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={beamAxisFilter} onValueChange={(v: FrequencyAxis) => setBeamAxisFilter(v)}>
                    <SelectTrigger className="h-7 w-16 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="X">X</SelectItem>
                      <SelectItem value="Z">Z</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={beamSensor1} onValueChange={setBeamSensor1}>
                    <SelectTrigger className="h-7 w-16 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sensorSelectOptions.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={beamSensor2} onValueChange={setBeamSensor2}>
                    <SelectTrigger className="h-7 w-16 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sensorSelectOptions.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setFullscreenChart('beamComparison')}>
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                {renderBeamComparisonChart()}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fullscreen Chart Dialog */}
      <Dialog open={!!fullscreenChart} onOpenChange={() => setFullscreenChart(null)}>
        <DialogContent className="max-w-6xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {fullscreenChart === 'acceleration' && `Série Temporal - Aceleração (Eixo ${accelAxisFilter})`}
              {fullscreenChart === 'frequency' && `Série Temporal - Frequência Dominante (Eixo ${freqAxisFilter})`}
              {fullscreenChart === 'distribution' && `Distribuição - ${distDataTypeFilter} (Eixo ${distAxisFilter})`}
              {fullscreenChart === 'beamComparison' && `Comparação entre Vigas (Eixo ${beamAxisFilter})`}
            </DialogTitle>
            <DialogDescription>Visualização expandida do gráfico</DialogDescription>
          </DialogHeader>
          <div className="flex-1 h-full min-h-[400px]">
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              {fullscreenChart === 'acceleration' && (
                <>
                  <Select value={accelAxisFilter} onValueChange={(v: AccelerationAxis) => setAccelAxisFilter(v)}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="X">Eixo X</SelectItem>
                      <SelectItem value="Y">Eixo Y</SelectItem>
                      <SelectItem value="Z">Eixo Z</SelectItem>
                      <SelectItem value="Todos">Todos</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex border rounded-md overflow-hidden">
                    <Button variant={metricFilter === 'RMS' ? 'default' : 'ghost'} size="sm" onClick={() => setMetricFilter('RMS')}>RMS</Button>
                    <Button variant={metricFilter === 'Pico' ? 'default' : 'ghost'} size="sm" onClick={() => setMetricFilter('Pico')}>Pico</Button>
                  </div>
                </>
              )}
              {fullscreenChart === 'frequency' && (
                <Select value={freqAxisFilter} onValueChange={(v: FrequencyAxis) => setFreqAxisFilter(v)}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="X">Eixo X</SelectItem>
                    <SelectItem value="Z">Eixo Z</SelectItem>
                    <SelectItem value="Todos">Todos</SelectItem>
                  </SelectContent>
                </Select>
              )}
              {fullscreenChart === 'distribution' && (
                <>
                  <Select value={distAxisFilter} onValueChange={(v: AccelerationAxis) => setDistAxisFilter(v)}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="X">Eixo X</SelectItem>
                      <SelectItem value="Y">Eixo Y</SelectItem>
                      <SelectItem value="Z">Eixo Z</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={distDataTypeFilter} onValueChange={(v: DataTypeFilter) => setDistDataTypeFilter(v)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aceleração">Aceleração</SelectItem>
                      <SelectItem value="Frequência">Frequência</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}
              {fullscreenChart === 'beamComparison' && (
                <>
                  <Select value={beamAxisFilter} onValueChange={(v: FrequencyAxis) => setBeamAxisFilter(v)}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="X">Eixo X</SelectItem>
                      <SelectItem value="Z">Eixo Z</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={beamSensor1} onValueChange={setBeamSensor1}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sensorSelectOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={beamSensor2} onValueChange={setBeamSensor2}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sensorSelectOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
            <div className="h-[calc(100%-60px)]">
              {fullscreenChart === 'acceleration' && renderAccelerationChart(500)}
              {fullscreenChart === 'frequency' && renderFrequencyChart(500)}
              {fullscreenChart === 'distribution' && renderDistributionChart(500)}
              {fullscreenChart === 'beamComparison' && renderBeamComparisonChart(500)}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Anomaly Event Details Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Evento Anômalo</DialogTitle>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              {/* Event Summary */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <h4 className="font-semibold">Resumo do Evento</h4>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                        <p className="text-muted-foreground">Timestamp: <span className="text-foreground">{selectedEvent.timestamp}</span></p>
                        <p className="text-muted-foreground">Sensor: <span className="text-foreground">{selectedEvent.sensor}</span></p>
                        <p className="text-muted-foreground">Tipo: <span className="text-foreground">{selectedEvent.type}</span></p>
                        <p className="text-muted-foreground">Métrica: <span className="text-foreground">{selectedEvent.metric}</span></p>
                      </div>
                      <p className="text-sm">
                        Valor registrado: <span className="text-destructive font-bold">{selectedEvent.value} m/s²</span>
                      </p>
                      <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
                    </div>
                    <Badge variant="destructive">{selectedEvent.severity}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Current Status */}
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-green-600">Status Atual</h4>
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Valores retornaram à média normal
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Valor Atual</p>
                      <p className="text-2xl font-bold text-green-600">{selectedEvent.currentValue} m/s²</p>
                      <p className="text-xs text-muted-foreground">Dentro da média</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 24h Chart or Table */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Valores Registrados (24 horas)</CardTitle>
                    <div className="flex border rounded-md overflow-hidden">
                      <Button
                        variant={viewMode === 'chart' ? 'default' : 'ghost'}
                        size="sm"
                        className="h-7 text-xs rounded-none"
                        onClick={() => setViewMode('chart')}
                      >
                        Gráfico
                      </Button>
                      <Button
                        variant={viewMode === 'table' ? 'default' : 'ghost'}
                        size="sm"
                        className="h-7 text-xs flex items-center gap-1 rounded-none"
                        onClick={() => setViewMode('table')}
                      >
                        <Table className="h-3 w-3" />
                        Tabela
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {viewMode === 'chart' ? (
                    <>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={hourlyData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                            <XAxis dataKey="time" tick={{ fontSize: 9 }} />
                            <YAxis domain={[0, 12]} tick={{ fontSize: 9 }} label={{ value: 'Aceleração (m/s²)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                            <Tooltip />
                            <ReferenceLine y={0.3} stroke="hsl(142, 76%, 36%)" strokeDasharray="5 5" />
                            <Line 
                              type="monotone" 
                              dataKey="value" 
                              stroke="hsl(var(--primary))" 
                              strokeWidth={1.5} 
                              dot={(props: any) => {
                                const { cx, cy, payload } = props;
                                if (payload.isAnomaly) {
                                  return (
                                    <circle
                                      key={`dot-${payload.time}`}
                                      cx={cx}
                                      cy={cy}
                                      r={6}
                                      fill="hsl(var(--destructive))"
                                      stroke="white"
                                      strokeWidth={2}
                                    />
                                  );
                                }
                                return null;
                              }}
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground space-y-1">
                        <p>• Ponto vermelho indica o momento exato da anomalia detectada</p>
                        <p>• Linha verde tracejada representa o valor médio esperado</p>
                      </div>
                    </>
                  ) : (
                    <div className="max-h-48 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-background">
                          <tr className="border-b">
                            <th className="text-left py-2 px-2 font-medium">Hora</th>
                            <th className="text-right py-2 px-2 font-medium">Valor (m/s²)</th>
                            <th className="text-center py-2 px-2 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {hourlyData.map((row: any, idx: number) => (
                            <tr key={idx} className={cn("border-b", row.isAnomaly && "bg-destructive/10")}>
                              <td className="py-1.5 px-2">{row.time}</td>
                              <td className={cn("text-right py-1.5 px-2 font-mono", row.isAnomaly && "text-destructive font-bold")}>{row.value.toFixed(3)}</td>
                              <td className="text-center py-1.5 px-2">
                                {row.isAnomaly ? (
                                  <Badge variant="destructive" className="text-xs">Anomalia</Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">Normal</Badge>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Schedule Intervention */}
              <Card className="border-l-4 border-l-primary">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold">Agendar Intervenção</h4>
                      <p className="text-sm text-muted-foreground">Este evento requer verificação? Deseja agendar uma intervenção para inspeção?</p>
                      
                      {!showScheduleConfirm ? (
                        <Button 
                          className="mt-3" 
                          size="sm"
                          onClick={() => setShowScheduleConfirm(true)}
                        >
                          Avaliar Agendamento
                        </Button>
                      ) : (
                        <div className="mt-3 p-3 bg-muted/50 rounded-lg border">
                          <p className="text-sm font-medium mb-3">Deseja criar uma inspeção para este evento?</p>
                          <div className="flex gap-2">
                            <Button 
                              size="sm"
                              onClick={() => {
                                setShowScheduleConfirm(false);
                                setSelectedEvent(null);
                                setIsInterventionDialogOpen(true);
                              }}
                            >
                              Sim, agendar
                            </Button>
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => setShowScheduleConfirm(false)}
                            >
                              Não
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedEvent(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Intervention Dialog */}
      <CreateInterventionDialog
        open={isInterventionDialogOpen}
        onOpenChange={setIsInterventionDialogOpen}
        onSubmit={(data: NewIntervention) => {
          addIntervention(data);
          toast.success('Intervenção criada com sucesso!');
        }}
        defaultBridgeId={bridgeId}
      />
    </div>
  );
}
