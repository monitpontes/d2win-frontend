import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Bridge, Sensor, StructuralStatus } from '@/types';
import { structuralStatusLabels } from '@/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MapPin, Clock, ArrowRight, AlertTriangle, TableIcon, LineChart } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { getSensorsByBridge } from '@/data/mockData';
import { LineChart as RechartsLine, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface BridgeCardProps {
  bridge: Bridge;
}

type AxisFilter = 'all' | 'X' | 'Y' | 'Z';
type ViewMode = 'table' | 'chart';

// Generate mock sensor readings with axis data
const generateSensorReadings = (bridgeId: string) => {
  const sensors = getSensorsByBridge(bridgeId);
  const axes: Array<'X' | 'Y' | 'Z'> = ['X', 'Y', 'Z'];
  const readings: Array<{
    sensorName: string;
    axis: 'X' | 'Y' | 'Z';
    type: 'Frequência' | 'Aceleração';
    lastValue: string;
    reference: string;
    variation: number;
    status: 'normal' | 'alert' | 'critical';
    updatedAt: string;
  }> = [];

  // Generate readings for each sensor with different axes
  for (let i = 1; i <= 5; i++) {
    const sensor = sensors[i % sensors.length] || sensors[0];
    axes.forEach((axis) => {
      if (axis === 'Y' && Math.random() > 0.3) return; // Y axis less common for frequency
      
      const isFrequency = Math.random() > 0.3;
      const baseValue = isFrequency ? 3.5 + Math.random() * 0.8 : 0.1 + Math.random() * 10;
      const refMin = isFrequency ? 3.0 : 0.3;
      const refMax = isFrequency ? 3.7 : 10.0;
      const variation = ((baseValue - refMin) / refMin) * 100;
      
      let status: 'normal' | 'alert' | 'critical' = 'normal';
      if (Math.abs(variation) > 20) status = 'critical';
      else if (Math.abs(variation) > 10) status = 'alert';

      readings.push({
        sensorName: `Sensor 0${i}`,
        axis,
        type: isFrequency ? 'Frequência' : 'Aceleração',
        lastValue: isFrequency ? `${baseValue.toFixed(2)} Hz` : `${baseValue.toFixed(2)} m/s²`,
        reference: isFrequency ? `${refMin}-${refMax} Hz` : `< ${refMax} m/s²`,
        variation: Math.round(variation * 10) / 10,
        status,
        updatedAt: format(new Date(Date.now() - Math.random() * 3600000), 'dd/MM, HH:mm'),
      });
    });
  }

  return readings.slice(0, 12); // Limit to 12 readings
};

// Generate chart data
const generateChartData = (bridgeId: string) => {
  const times = ['10:03', '10:18', '10:33', '10:48', '11:03'];
  
  return {
    frequency: times.map(time => ({
      time,
      sensorX1: 3.4 + Math.random() * 0.3,
      sensorZ1: 3.6 + Math.random() * 0.3,
      sensorX2: 3.7 + Math.random() * 0.3,
      sensorZ2: 3.5 + Math.random() * 0.3,
      sensorX3: 4.0 + Math.random() * 0.3,
      sensorZ3: 3.8 + Math.random() * 0.3,
    })),
    acceleration: times.map(time => ({
      time,
      sensorX: 9.5 + Math.random() * 1.5,
      sensorY: 0.1 + Math.random() * 0.1,
      sensorZ: 0.05 + Math.random() * 0.05,
    })),
  };
};

export function BridgeCard({ bridge }: BridgeCardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [axisFilter, setAxisFilter] = useState<AxisFilter>('all');

  const sensorReadings = useMemo(() => generateSensorReadings(bridge.id), [bridge.id]);
  const chartData = useMemo(() => generateChartData(bridge.id), [bridge.id]);

  const filteredReadings = useMemo(() => {
    if (axisFilter === 'all') return sensorReadings;
    return sensorReadings.filter(r => r.axis === axisFilter);
  }, [sensorReadings, axisFilter]);

  const alertCount = useMemo(() => 
    sensorReadings.filter(r => r.status === 'alert' || r.status === 'critical').length
  , [sensorReadings]);

  const getStatusConfig = (status: Bridge['structuralStatus']) => {
    const configs: Record<StructuralStatus, { label: string; className: string }> = {
      operacional: { label: structuralStatusLabels.operacional, className: 'bg-success text-success-foreground' },
      atencao: { label: structuralStatusLabels.atencao, className: 'bg-warning text-warning-foreground' },
      restricoes: { label: structuralStatusLabels.restricoes, className: 'bg-orange-500 text-white' },
      critico: { label: structuralStatusLabels.critico, className: 'bg-destructive text-destructive-foreground' },
      interdicao: { label: structuralStatusLabels.interdicao, className: 'bg-destructive text-destructive-foreground' },
    };
    return configs[status];
  };

  const getCriticalityConfig = (criticality: Bridge['operationalCriticality']) => {
    const configs = {
      low: { label: 'Baixa', className: 'bg-success/20 text-success' },
      medium: { label: 'Média', className: 'bg-warning/20 text-warning' },
      high: { label: 'Alta', className: 'bg-destructive/20 text-destructive' },
    };
    return configs[criticality];
  };

  const statusConfig = getStatusConfig(bridge.structuralStatus);
  const criticalityConfig = getCriticalityConfig(bridge.operationalCriticality);

  const getVariationColor = (variation: number) => {
    if (Math.abs(variation) > 20) return 'text-destructive';
    if (Math.abs(variation) > 10) return 'text-warning';
    return 'text-success';
  };

  const getStatusIndicator = (status: 'normal' | 'alert' | 'critical') => {
    const colors = {
      normal: 'bg-success',
      alert: 'bg-warning',
      critical: 'bg-destructive',
    };
    return <span className={cn('inline-block h-2.5 w-2.5 rounded-full', colors[status])} />;
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg flex flex-col">
      {/* Bridge Image Header */}
      {bridge.image && (
        <div className="relative h-36 w-full overflow-hidden">
          <img
            src={bridge.image}
            alt={bridge.name}
            className="h-full w-full object-cover"
          />
          <Badge className={cn('absolute top-2 right-2', statusConfig.className)}>
            {statusConfig.label}
          </Badge>
        </div>
      )}

      {/* Header with name and typology */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <Link to={`/bridge/${bridge.id}`} className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1">
              {bridge.name}
            </Link>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="line-clamp-1">{bridge.location}</span>
            </div>
          </div>
          <Badge variant="outline" className="flex-shrink-0">
            {bridge.typology}
          </Badge>
        </div>

        {/* Specs Row */}
        <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t">
          <div>
            <p className="text-xs text-muted-foreground">Comprimento</p>
            <p className="text-sm font-medium">{bridge.length}m</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Material</p>
            <p className="text-sm font-medium line-clamp-1">{bridge.material}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Apoios</p>
            <p className="text-sm font-medium">{bridge.supportCount || 4}</p>
          </div>
        </div>

        {/* Criticality Badge */}
        <div className="mt-3">
          <span className="text-xs text-muted-foreground mr-1.5">Criticidade</span>
          <Badge variant="secondary" className={cn('text-xs', criticalityConfig.className)}>
            {criticalityConfig.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        {/* View Toggle and Axis Filter */}
        <div className="flex items-center justify-between mb-3">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="w-auto">
            <TabsList className="h-8">
              <TabsTrigger value="table" className="h-7 px-2 text-xs">
                <TableIcon className="h-3.5 w-3.5 mr-1" />
                Tabela
              </TabsTrigger>
              <TabsTrigger value="chart" className="h-7 px-2 text-xs">
                <LineChart className="h-3.5 w-3.5 mr-1" />
                Gráfico
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Select value={axisFilter} onValueChange={(v) => setAxisFilter(v as AxisFilter)}>
            <SelectTrigger className="w-[100px] h-8 text-xs">
              <SelectValue placeholder="Eixos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Eixos</SelectItem>
              <SelectItem value="X">Eixo X</SelectItem>
              <SelectItem value="Y">Eixo Y</SelectItem>
              <SelectItem value="Z">Eixo Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {viewMode === 'table' ? (
          /* Table View */
          <div className="border rounded-md overflow-hidden">
            <div className="max-h-[280px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs h-8 sticky top-0 bg-muted/95">Sensor</TableHead>
                    <TableHead className="text-xs h-8 sticky top-0 bg-muted/95">Eixo</TableHead>
                    <TableHead className="text-xs h-8 sticky top-0 bg-muted/95">Tipo</TableHead>
                    <TableHead className="text-xs h-8 sticky top-0 bg-muted/95">Último Valor</TableHead>
                    <TableHead className="text-xs h-8 sticky top-0 bg-muted/95">Referência</TableHead>
                    <TableHead className="text-xs h-8 sticky top-0 bg-muted/95">Variação</TableHead>
                    <TableHead className="text-xs h-8 sticky top-0 bg-muted/95">Status</TableHead>
                    <TableHead className="text-xs h-8 sticky top-0 bg-muted/95">Atualizado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReadings.map((reading, idx) => (
                    <TableRow key={idx} className="h-9">
                      <TableCell className="text-xs font-medium py-1">{reading.sensorName}</TableCell>
                      <TableCell className="text-xs py-1">
                        <Badge variant="outline" className={cn(
                          'text-[10px] px-1.5 py-0',
                          reading.axis === 'X' && 'text-destructive border-destructive',
                          reading.axis === 'Y' && 'text-warning border-warning',
                          reading.axis === 'Z' && 'text-primary border-primary'
                        )}>
                          {reading.axis}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground py-1">{reading.type}</TableCell>
                      <TableCell className="text-xs font-medium py-1">{reading.lastValue}</TableCell>
                      <TableCell className="text-xs text-muted-foreground py-1">{reading.reference}</TableCell>
                      <TableCell className={cn('text-xs font-medium py-1', getVariationColor(reading.variation))}>
                        {reading.variation > 0 ? '+' : ''}{reading.variation}%
                      </TableCell>
                      <TableCell className="py-1">{getStatusIndicator(reading.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground py-1">{reading.updatedAt}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          /* Chart View */
          <div className="space-y-3">
            <div className="text-xs font-medium text-muted-foreground">Últimos 5 Dados por Sensor</div>
            
            {/* Frequency Chart */}
            <div className="border rounded-md p-2">
              <div className="text-xs font-medium mb-2">Frequência (Hz)</div>
              <div className="h-[100px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLine data={chartData.frequency}>
                    <XAxis dataKey="time" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[3, 4.5]} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    {(axisFilter === 'all' || axisFilter === 'X') && (
                      <>
                        <Line type="monotone" dataKey="sensorX1" stroke="hsl(var(--destructive))" strokeWidth={1.5} dot={{ r: 2 }} />
                        <Line type="monotone" dataKey="sensorX2" stroke="hsl(var(--destructive))" strokeWidth={1.5} dot={{ r: 2 }} />
                        <Line type="monotone" dataKey="sensorX3" stroke="hsl(var(--destructive))" strokeWidth={1.5} dot={{ r: 2 }} />
                      </>
                    )}
                    {(axisFilter === 'all' || axisFilter === 'Z') && (
                      <>
                        <Line type="monotone" dataKey="sensorZ1" stroke="hsl(var(--chart-3))" strokeWidth={1.5} strokeDasharray="4 2" dot={{ r: 2 }} />
                        <Line type="monotone" dataKey="sensorZ2" stroke="hsl(var(--chart-3))" strokeWidth={1.5} strokeDasharray="4 2" dot={{ r: 2 }} />
                        <Line type="monotone" dataKey="sensorZ3" stroke="hsl(var(--chart-3))" strokeWidth={1.5} strokeDasharray="4 2" dot={{ r: 2 }} />
                      </>
                    )}
                  </RechartsLine>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Acceleration Chart */}
            <div className="border rounded-md p-2">
              <div className="text-xs font-medium mb-2">Aceleração (m/s²)</div>
              <div className="h-[80px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLine data={chartData.acceleration}>
                    <XAxis dataKey="time" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    {(axisFilter === 'all' || axisFilter === 'X') && (
                      <Line type="monotone" dataKey="sensorX" stroke="hsl(var(--chart-2))" strokeWidth={1.5} dot={{ r: 2 }} />
                    )}
                    {(axisFilter === 'all' || axisFilter === 'Y') && (
                      <Line type="monotone" dataKey="sensorY" stroke="hsl(var(--warning))" strokeWidth={1.5} dot={{ r: 2 }} />
                    )}
                    {(axisFilter === 'all' || axisFilter === 'Z') && (
                      <Line type="monotone" dataKey="sensorZ" stroke="hsl(var(--success))" strokeWidth={1.5} dot={{ r: 2 }} />
                    )}
                  </RechartsLine>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Footer Stats */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span>🔌 {bridge.sensorCount} sensores</span>
          </div>
          {alertCount > 0 && (
            <div className="flex items-center gap-1 text-warning">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>{alertCount} alerta(s)</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
          <Clock className="h-3 w-3" />
          <span>
            Atualizado: {format(new Date(bridge.lastUpdate), "dd/MM/yyyy, HH:mm:ss")}
          </span>
        </div>
      </CardContent>

      <CardFooter className="pt-0 pb-4">
        <Button asChild variant="outline" className="w-full group hover:bg-primary hover:text-primary-foreground">
          <Link to={`/bridge/${bridge.id}`} className="flex items-center gap-2">
            Ver detalhes
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}