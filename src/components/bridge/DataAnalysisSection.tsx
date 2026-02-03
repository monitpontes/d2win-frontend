import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, ReferenceLine, Scatter, ScatterChart, Cell, ComposedChart } from 'recharts';
import { Filter, Download, AlertTriangle, TrendingUp, TrendingDown, Activity, Maximize2, X, Calendar, Table, CheckCircle } from 'lucide-react';
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

type AxisFilter = 'X' | 'Z';
type MetricFilter = 'RMS' | 'Pico';

export default function DataAnalysisSection({ bridgeId }: DataAnalysisSectionProps) {
  const [selectedSensors, setSelectedSensors] = useState<string[]>(['Todos', 'T1 Freq N', 'T1 Freq S', 'T1 AccN', 'S4 AccN', 'T Flow']);
  const [dataType, setDataType] = useState<string[]>(['Ambos']);
  const [period, setPeriod] = useState('30d');
  const [aggregation, setAggregation] = useState('1 sem');
  const [showAnomalies, setShowAnomalies] = useState(true);
  
  // New state for chart controls
  const [axisFilter, setAxisFilter] = useState<AxisFilter>('Z');
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

  // Mock time series data for charts with axis options
  const timeSeriesAcceleration = useMemo(() => {
    const baseData = Array.from({ length: 30 }, (_, i) => ({
      date: `${String(i + 1).padStart(2, '0')}/01`,
      valueX: 9.2 + Math.random() * 0.5 + (i === 15 ? 1.5 : 0),
      valueZ: 9.4 + Math.random() * 0.4 + (i === 15 ? 1.8 : 0),
      anomalyX: i === 15 ? 10.7 : null,
      anomalyZ: i === 15 ? 11.2 : null,
    }));
    return baseData;
  }, []);

  const timeSeriesFrequency = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      date: `${String(i + 1).padStart(2, '0')}/01`,
      frequencyX: 3.5 + Math.random() * 0.3,
      frequencyZ: 3.7 + Math.random() * 0.4,
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

  const distributionData = useMemo(() => {
    return [
      { range: '<2.0', count: 45 },
      { range: '2.0-2.5', count: 120 },
      { range: '2.5-3.0', count: 280 },
      { range: '3.0-3.5', count: 350 },
      { range: '3.5-4.0', count: 180 },
      { range: '4.0-4.5', count: 95 },
      { range: '>4.5', count: 30 },
    ];
  }, []);

  const beamComparisonData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      month: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][i],
      longN1: 3.2 + Math.random() * 0.4,
      longN2: 3.4 + Math.random() * 0.3,
      longS1: 3.1 + Math.random() * 0.5,
      longS2: 3.3 + Math.random() * 0.4,
    }));
  }, []);

  const sensorOptions = ['Todos', 'T1 Freq N', 'T1 Freq S', 'T1 AccN', 'S4 AccN', 'T Flow'];
  const dataTypeOptions = ['Ambos', 'Aceleração', 'Frequência'];

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

  // Chart header with axis filter and fullscreen
  const ChartHeader = ({ 
    title, 
    description, 
    chartId, 
    showAxisFilter = true,
    showMetricFilter = false,
  }: { 
    title: string; 
    description: string; 
    chartId: string;
    showAxisFilter?: boolean;
    showMetricFilter?: boolean;
  }) => (
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <div>
          <CardTitle className="text-sm">{title}</CardTitle>
          <CardDescription className="text-xs">{description}</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {showAxisFilter && (
            <Select value={axisFilter} onValueChange={(v: AxisFilter) => setAxisFilter(v)}>
              <SelectTrigger className="h-7 w-16 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="X">X</SelectItem>
                <SelectItem value="Z">Z</SelectItem>
              </SelectContent>
            </Select>
          )}
          {showMetricFilter && (
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
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setFullscreenChart(chartId)}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </CardHeader>
  );

  // Render acceleration chart
  const renderAccelerationChart = (height: number = 192) => (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={timeSeriesAcceleration}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
        <XAxis dataKey="date" tick={{ fontSize: 9 }} />
        <YAxis domain={[8, 12]} tick={{ fontSize: 9 }} label={{ value: `${metricFilter} Eixo ${axisFilter} (m/s²)`, angle: -90, position: 'insideLeft', fontSize: 10 }} />
        <Tooltip />
        <ReferenceLine y={11} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label={{ value: 'Limite Crítico', fontSize: 9, fill: 'hsl(var(--destructive))' }} />
        <ReferenceLine y={10.5} stroke="hsl(var(--warning))" strokeDasharray="5 5" label={{ value: 'Limite Alerta', fontSize: 9, fill: 'hsl(var(--warning))' }} />
        <Line 
          type="monotone" 
          dataKey={axisFilter === 'X' ? 'valueX' : 'valueZ'} 
          stroke="hsl(var(--primary))" 
          strokeWidth={1.5} 
          dot={false} 
          name={`Eixo ${axisFilter}`} 
        />
        {/* Anomaly points */}
        <Scatter 
          dataKey={axisFilter === 'X' ? 'anomalyX' : 'anomalyZ'} 
          fill="hsl(var(--destructive))"
          shape={(props: any) => {
            if (!props.payload[axisFilter === 'X' ? 'anomalyX' : 'anomalyZ']) return null;
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
      </ComposedChart>
    </ResponsiveContainer>
  );

  // Render frequency chart
  const renderFrequencyChart = (height: number = 192) => (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={timeSeriesFrequency}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
        <XAxis dataKey="date" tick={{ fontSize: 9 }} />
        <YAxis domain={[2.5, 5.5]} tick={{ fontSize: 9 }} />
        <Tooltip />
        <Line 
          type="monotone" 
          dataKey={axisFilter === 'X' ? 'frequencyX' : 'frequencyZ'} 
          stroke="hsl(var(--primary))" 
          strokeWidth={2} 
          dot={false} 
          name={`Frequência Eixo ${axisFilter}`} 
        />
      </LineChart>
    </ResponsiveContainer>
  );

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

  // Render beam comparison chart
  const renderBeamComparisonChart = (height: number = 192) => (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={beamComparisonData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
        <XAxis dataKey="month" tick={{ fontSize: 9 }} />
        <YAxis domain={[2.5, 4.5]} tick={{ fontSize: 9 }} />
        <Tooltip />
        <Line type="monotone" dataKey="longN1" stroke="hsl(220, 70%, 50%)" strokeWidth={1.5} dot={false} name="Long N1" />
        <Line type="monotone" dataKey="longN2" stroke="hsl(140, 70%, 40%)" strokeWidth={1.5} dot={false} name="Long N2" />
        <Line type="monotone" dataKey="longS1" stroke="hsl(30, 90%, 50%)" strokeWidth={1.5} dot={false} name="Long S1" />
        <Line type="monotone" dataKey="longS2" stroke="hsl(280, 70%, 50%)" strokeWidth={1.5} dot={false} name="Long S2" />
      </LineChart>
    </ResponsiveContainer>
  );

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
                  <p className="text-xs text-muted-foreground">Nível: Vibante</p>
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
        <h4 className="font-medium mb-4">Visualização de Dados</h4>
        <p className="text-sm text-muted-foreground mb-4">Gráficos de frequência e aceleração - clique nos pontos vermelhos para ver detalhes de anomalias</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Time Series - Acceleration */}
          <Card>
            <ChartHeader
              title="Série Temporal - Aceleração"
              description={`Dados do sensor accel1 eixo ${axisFilter} ao longo do tempo`}
              chartId="acceleration"
              showAxisFilter
              showMetricFilter
            />
            <CardContent>
              <div className="h-48">
                {renderAccelerationChart()}
              </div>
              <div className="mt-2 text-xs text-muted-foreground space-y-1">
                <p>• Ponto vermelho indica o momento exato da anomalia detectada</p>
                <p>• Linha vermelha tracejada representa o limite crítico</p>
              </div>
            </CardContent>
          </Card>

          {/* Time Series - Frequency */}
          <Card>
            <ChartHeader
              title="Série Temporal - Frequência Dominante"
              description={`Dados do sensor para eixo ${axisFilter} ao longo do tempo - frequência`}
              chartId="frequency"
              showAxisFilter
            />
            <CardContent>
              <div className="h-48">
                {renderFrequencyChart()}
              </div>
            </CardContent>
          </Card>

          {/* Distribution */}
          <Card>
            <ChartHeader
              title="Distribuição"
              description={`Histograma dos valores medidos - Eixo ${axisFilter}`}
              chartId="distribution"
              showAxisFilter
            />
            <CardContent>
              <div className="h-48">
                {renderDistributionChart()}
              </div>
            </CardContent>
          </Card>

          {/* Beam Comparison */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Comparação entre Vigas</CardTitle>
                  <CardDescription className="text-xs">Gráfico das séries ao longo do tempo - Longitudinais ZONA</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-2 text-xs flex-wrap">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />N1</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />N2</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" />S1</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" />S2</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setFullscreenChart('beamComparison')}
                  >
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
              {fullscreenChart === 'acceleration' && `Série Temporal - Aceleração (Eixo ${axisFilter})`}
              {fullscreenChart === 'frequency' && `Série Temporal - Frequência Dominante (Eixo ${axisFilter})`}
              {fullscreenChart === 'distribution' && `Distribuição (Eixo ${axisFilter})`}
              {fullscreenChart === 'beamComparison' && 'Comparação entre Vigas'}
            </DialogTitle>
            <DialogDescription>Visualização expandida do gráfico</DialogDescription>
          </DialogHeader>
          <div className="flex-1 h-full min-h-[400px]">
            <div className="flex items-center gap-4 mb-4">
              {fullscreenChart !== 'beamComparison' && (
                <Select value={axisFilter} onValueChange={(v: AxisFilter) => setAxisFilter(v)}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="X">Eixo X</SelectItem>
                    <SelectItem value="Z">Eixo Z</SelectItem>
                  </SelectContent>
                </Select>
              )}
              {fullscreenChart === 'acceleration' && (
                <div className="flex border rounded-md overflow-hidden">
                  <Button
                    variant={metricFilter === 'RMS' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setMetricFilter('RMS')}
                  >
                    RMS
                  </Button>
                  <Button
                    variant={metricFilter === 'Pico' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setMetricFilter('Pico')}
                  >
                    Pico
                  </Button>
                </div>
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
                        className="h-7 text-xs"
                        onClick={() => setViewMode('chart')}
                      >
                        Gráfico
                      </Button>
                      <Button
                        variant={viewMode === 'table' ? 'default' : 'ghost'}
                        size="sm"
                        className="h-7 text-xs flex items-center gap-1"
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
                        <ReferenceLine y={0.3} stroke="hsl(var(--success))" strokeDasharray="5 5" />
                        <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={false} />
                        {hourlyData.map((entry, index) => (
                          entry.isAnomaly && (
                            <circle
                              key={index}
                              cx={`${(index / 23) * 100}%`}
                              cy={entry.value}
                              r={6}
                              fill="hsl(var(--destructive))"
                            />
                          )
                        ))}
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
