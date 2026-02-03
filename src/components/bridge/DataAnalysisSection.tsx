import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import { Filter, Download, AlertTriangle, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataAnalysisSectionProps {
  bridgeId: string;
}

export default function DataAnalysisSection({ bridgeId }: DataAnalysisSectionProps) {
  const [selectedSensors, setSelectedSensors] = useState<string[]>(['Todos', 'T1 Freq N', 'T1 Freq S', 'T1 AccN', 'S4 AccN', 'T Flow']);
  const [dataType, setDataType] = useState<string[]>(['Ambos']);
  const [period, setPeriod] = useState('30d');
  const [aggregation, setAggregation] = useState('1 sem');
  const [showAnomalies, setShowAnomalies] = useState(true);

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

  // Mock time series data for charts
  const timeSeriesAcceleration = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      date: `${i + 1}/01`,
      sensor1: 1.5 + Math.random() * 2,
      sensor2: 1.8 + Math.random() * 1.5,
      referenceMax: 4.5,
      referenceMin: 0.5,
    }));
  }, []);

  const timeSeriesFrequency = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      date: `${i + 1}/01`,
      frequency: 3.5 + Math.random() * 1.5 - (i > 20 ? 0.5 : 0),
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
        <p className="text-sm text-muted-foreground mb-4">Gráficos de frequência e aceleração</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Time Series - Acceleration */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Série Temporal - Aceleração</CardTitle>
                <div className="flex gap-2 text-xs">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />Eixo</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />Risco</span>
                </div>
              </div>
              <CardDescription className="text-xs">Dados do sensor para S-3 ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeSeriesAcceleration}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                    <YAxis domain={[0, 5]} tick={{ fontSize: 9 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="sensor1" stroke="hsl(var(--chart-1))" strokeWidth={1.5} dot={false} name="Sensor 1" />
                    <Line type="monotone" dataKey="sensor2" stroke="hsl(var(--chart-2))" strokeWidth={1.5} dot={false} name="Sensor 2" />
                    <Line type="monotone" dataKey="referenceMax" stroke="hsl(var(--destructive))" strokeDasharray="5 5" strokeWidth={1} dot={false} name="Limite Máx" />
                    <Line type="monotone" dataKey="referenceMin" stroke="hsl(var(--success))" strokeDasharray="5 5" strokeWidth={1} dot={false} name="Limite Min" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Time Series - Frequency */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Série Temporal - Frequência Dominante</CardTitle>
                <div className="flex gap-2 text-xs">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" />Frequência (Hz)</span>
                </div>
              </div>
              <CardDescription className="text-xs">Dados do sensor para S-3 ao longo do tempo - frequência</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeSeriesFrequency}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                    <YAxis domain={[2.5, 5.5]} tick={{ fontSize: 9 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="frequency" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Frequência" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Distribution */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Distribuição</CardTitle>
              <CardDescription className="text-xs">Histograma dos valores medidos - Eixo Y</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distributionData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                    <XAxis dataKey="range" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Beam Comparison */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Comparação entre Vigas</CardTitle>
                <div className="flex gap-2 text-xs flex-wrap">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />Long N1</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />Long N2</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" />Long S1</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" />Long S2</span>
                </div>
              </div>
              <CardDescription className="text-xs">Gráfico das séries ao longo do tempo - Longitudinais ZONA</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
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
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
