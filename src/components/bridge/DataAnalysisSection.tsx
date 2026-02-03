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
import { Filter, Download, AlertTriangle, TrendingUp, TrendingDown, Maximize2, Calendar, Table, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  // Mock KPI data
  const kpiData = {
    frequencyAvg: 4.08,
    frequencyMin: 0,
    accelerationAvg: 9.18,
    accelerationMin: 0,
    accelerationMax: 9.512,
    accelerationPeak: 11.723,
    frequencyMax: 4.49,
    frequencyPeak: 8.100,
    vibrationLevel: 21.8,
    structuralStatus: 'Crítico',
  };

  // Mock time series data with X, Y, Z axes for acceleration
  const timeSeriesAcceleration = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      date: `${String(i + 1).padStart(2, '0')}/01`,
      valueX: 9.2 + Math.random() * 0.5 + (i === 15 ? 1.5 : 0),
      valueY: 9.0 + Math.random() * 0.3 + (i === 15 ? 1.2 : 0),
      valueZ: 9.4 + Math.random() * 0.4 + (i === 15 ? 1.8 : 0),
      anomalyX: i === 15 ? 10.7 : null,
      anomalyY: i === 15 ? 10.2 : null,
      anomalyZ: i === 15 ? 11.2 : null,
    }));
  }, []);

  // Mock time series data with X, Z axes for frequency (4 sensors)
  const timeSeriesFrequency = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      date: `${String(i + 1).padStart(2, '0')}/01`,
      s1X: 4.5 + Math.random() * 0.3,
      s1Z: 4.6 + Math.random() * 0.2,
      s2X: 4.4 + Math.random() * 0.25,
      s2Z: 4.5 + Math.random() * 0.3,
      s3X: 4.3 + Math.random() * 0.35,
      s3Z: 4.4 + Math.random() * 0.25,
      s4X: 4.6 + Math.random() * 0.2,
      s4Z: 4.7 + Math.random() * 0.15,
      referenceX: 4.8,
      referenceZ: 4.9,
    }));
  }, []);

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
      return [
        { range: '8.5-9.0', count: 45 },
        { range: '9.0-9.3', count: 180 },
        { range: '9.3-9.6', count: 280 },
        { range: '9.6-9.9', count: 260 },
        { range: '9.9-10.2', count: 30 },
        { range: '>10.2', count: 5 },
      ];
    }
    return [
      { range: '3.5-4.0', count: 50 },
      { range: '4.0-4.3', count: 180 },
      { range: '4.3-4.6', count: 320 },
      { range: '4.6-4.9', count: 280 },
      { range: '4.9-5.2', count: 120 },
      { range: '>5.2', count: 20 },
    ];
  }, [distDataTypeFilter]);

  // Beam comparison data with sensor filters
  const beamComparisonData = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      date: `${String(i + 1).padStart(2, '0')}/01`,
      s1X: 4.5 + Math.random() * 0.2,
      s1Z: 4.6 + Math.random() * 0.15,
      s2X: 4.4 + Math.random() * 0.25,
      s2Z: 4.5 + Math.random() * 0.2,
      s3X: 4.3 + Math.random() * 0.2,
      s3Z: 4.4 + Math.random() * 0.18,
      s4X: 4.6 + Math.random() * 0.15,
      s4Z: 4.7 + Math.random() * 0.12,
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
    const showAll = accelAxisFilter === 'Todos';
    
    return (
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={timeSeriesAcceleration}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
          <XAxis dataKey="date" tick={{ fontSize: 9 }} />
          <YAxis domain={[8, 12]} tick={{ fontSize: 9 }} label={{ value: `${metricFilter} Eixo ${accelAxisFilter} (m/s²)`, angle: -90, position: 'insideLeft', fontSize: 10 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <ReferenceLine y={11} stroke="hsl(220, 10%, 60%)" strokeDasharray="8 4" label={{ value: 'Limite Crítico', fontSize: 9, fill: 'hsl(220, 10%, 50%)' }} />
          <ReferenceLine y={10.5} stroke="hsl(0, 84%, 60%)" strokeDasharray="5 5" label={{ value: 'Limite Alerta', fontSize: 9, fill: 'hsl(0, 84%, 60%)' }} />
          
          {(showAll || accelAxisFilter === 'X') && (
            <Line type="monotone" dataKey="valueX" stroke="hsl(220, 70%, 50%)" strokeWidth={1.5} dot={false} name="Eixo X" />
          )}
          {(showAll || accelAxisFilter === 'Y') && (
            <Line type="monotone" dataKey="valueY" stroke="hsl(142, 76%, 36%)" strokeWidth={1.5} dot={false} name="Eixo Y" />
          )}
          {(showAll || accelAxisFilter === 'Z') && (
            <Line type="monotone" dataKey="valueZ" stroke="hsl(38, 92%, 50%)" strokeWidth={1.5} dot={false} name="Eixo Z" />
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
    const showAll = freqAxisFilter === 'Todos';
    const axisKey = freqAxisFilter === 'Todos' ? 'Z' : freqAxisFilter;
    
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={timeSeriesFrequency}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
          <XAxis dataKey="date" tick={{ fontSize: 9 }} />
          <YAxis domain={[3.5, 5.5]} tick={{ fontSize: 9 }} label={{ value: `domFreq1 Eixo ${freqAxisFilter} (Hz)`, angle: -90, position: 'insideLeft', fontSize: 10 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <ReferenceLine y={4.8} stroke="hsl(220, 10%, 60%)" strokeDasharray="5 5" label={{ value: 'Referência', fontSize: 9 }} />
          
          {showAll ? (
            <>
              <Line type="monotone" dataKey="s1Z" stroke={sensorColors.S1} strokeWidth={1.5} dot={false} name="S1" />
              <Line type="monotone" dataKey="s2Z" stroke={sensorColors.S2} strokeWidth={1.5} dot={false} name="S2" />
              <Line type="monotone" dataKey="s3Z" stroke={sensorColors.S3} strokeWidth={1.5} dot={false} name="S3" />
              <Line type="monotone" dataKey="s4Z" stroke={sensorColors.S4} strokeWidth={1.5} dot={false} name="S4" />
            </>
          ) : (
            <>
              <Line type="monotone" dataKey={`s1${axisKey}`} stroke={sensorColors.S1} strokeWidth={1.5} dot={false} name="S1" />
              <Line type="monotone" dataKey={`s2${axisKey}`} stroke={sensorColors.S2} strokeWidth={1.5} dot={false} name="S2" />
              <Line type="monotone" dataKey={`s3${axisKey}`} stroke={sensorColors.S3} strokeWidth={1.5} dot={false} name="S3" />
              <Line type="monotone" dataKey={`s4${axisKey}`} stroke={sensorColors.S4} strokeWidth={1.5} dot={false} name="S4" />
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
          <YAxis domain={[3.5, 5.5]} tick={{ fontSize: 9 }} label={{ value: `domFreq1 Eixo ${beamAxisFilter} (Hz)`, angle: -90, position: 'insideLeft', fontSize: 10 }} />
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
            <Button variant="destructive" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Limpar
            </Button>
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
                      <SelectItem value="X">X</SelectItem>
                      <SelectItem value="Y">Y</SelectItem>
                      <SelectItem value="Z">Z</SelectItem>
                      <SelectItem value="Todos">Todos</SelectItem>
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

              {/* 24h Chart */}
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
                </CardContent>
              </Card>

              {/* Schedule Intervention */}
              <Card className="border-l-4 border-l-primary">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Agendar Intervenção</h4>
                      <p className="text-sm text-muted-foreground">Este evento requer verificação? Deseja agendar uma intervenção para inspeção?</p>
                      <Button className="mt-3" size="sm">
                        Avaliar Agendamento
                      </Button>
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
    </div>
  );
}
