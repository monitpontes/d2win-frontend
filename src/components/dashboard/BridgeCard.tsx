import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Bridge, StructuralStatus } from '@/types';
import { structuralStatusLabels } from '@/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { MapPin, Clock, ArrowRight, AlertTriangle, TableIcon, LineChart, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { LineChart as RechartsLine, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';
import { useTelemetry } from '@/hooks/useTelemetry';
import { DEFAULT_THRESHOLDS } from '@/lib/constants/sensorThresholds';
import { 
  getSensorStatus, 
  calculateVariation, 
  formatVariation, 
  getVariationColor, 
  getStatusConfig,
  getReferenceText
} from '@/lib/utils/sensorStatus';
import { formatDateValue } from '@/lib/utils/formatValue';

interface BridgeCardProps {
  bridge: Bridge;
}

type AxisFilter = 'all' | 'X' | 'Y' | 'Z';
type ViewMode = 'table' | 'chart';

export function BridgeCard({ bridge }: BridgeCardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [axisFilter, setAxisFilter] = useState<AxisFilter>('all');

  // Fetch real telemetry data
  const { latestData, isLoadingLatest } = useTelemetry(bridge.id);

  // Transform telemetry data into sensor readings
  const sensorReadings = useMemo(() => {
    if (!latestData || latestData.length === 0) {
      return [];
    }

    return latestData.map((telemetry, idx) => {
      // Determine type based on data structure
      // API: frequency = peaks[0].f from stream freq:z
      // API: acceleration = value from axis z
      const isFrequency = telemetry.frequency !== undefined;
      const value = isFrequency 
        ? telemetry.frequency! 
        : telemetry.acceleration?.z || 0;
      
      const type: 'frequency' | 'acceleration' = isFrequency ? 'frequency' : 'acceleration';
      const status = getSensorStatus(value, type);
      const variation = calculateVariation(value, type);

      return {
        sensorName: telemetry.deviceId || `Sensor ${idx + 1}`,
        axis: 'Z' as const,
        type: isFrequency ? 'Frequência' : 'Aceleração',
        lastValue: isFrequency ? `${value.toFixed(2)} Hz` : `${value.toFixed(2)} m/s²`,
        reference: getReferenceText(type),
        variation,
        status,
        updatedAt: formatDateValue(telemetry.timestamp, 'dd/MM HH:mm'),
      };
    });
  }, [latestData]);

  // Generate chart data from telemetry
  const chartData = useMemo(() => {
    if (!latestData || latestData.length === 0) {
      // Fallback mock data if no telemetry
      const times = ['10:03', '10:18', '10:33', '10:48', '11:03'];
      return {
        frequency: times.map(time => ({
          time,
          value: 3.5 + Math.random() * 0.3,
        })),
        acceleration: times.map(time => ({
          time,
          value: 9.5 + Math.random() * 0.5,
        })),
      };
    }

    // Use real data - take last 5 readings
    const frequencyData = latestData
      .filter(d => d.frequency !== undefined)
      .slice(-5)
      .map(d => ({
        time: formatDateValue(d.timestamp, 'dd/MM HH:mm'),
        value: d.frequency!,
      }));

    const accelerationData = latestData
      .filter(d => d.acceleration?.z !== undefined)
      .slice(-5)
      .map(d => ({
        time: formatDateValue(d.timestamp, 'dd/MM HH:mm'),
        value: d.acceleration!.z,
      }));

    return {
      frequency: frequencyData.length > 0 ? frequencyData : [{ time: '-', value: 0 }],
      acceleration: accelerationData.length > 0 ? accelerationData : [{ time: '-', value: 0 }],
    };
  }, [latestData]);

  const filteredReadings = useMemo(() => {
    if (axisFilter === 'all') return sensorReadings;
    return sensorReadings.filter(r => r.axis === axisFilter);
  }, [sensorReadings, axisFilter]);

  const alertCount = useMemo(() => 
    sensorReadings.filter(r => r.status === 'alert' || r.status === 'attention').length
  , [sensorReadings]);

  const getBridgeStatusConfig = (status: Bridge['structuralStatus']) => {
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

  const statusConfig = getBridgeStatusConfig(bridge.structuralStatus);
  const criticalityConfig = getCriticalityConfig(bridge.operationalCriticality);

  // Status indicator using imported getStatusConfig
  const renderStatusIndicator = (status: 'normal' | 'attention' | 'alert') => {
    const config = getStatusConfig(status);
    return <span className={cn('inline-block h-2.5 w-2.5 rounded-full', config.bgClass)} />;
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
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-primary border-primary">
                          {reading.axis}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground py-1">{reading.type}</TableCell>
                      <TableCell className="text-xs font-medium py-1">{reading.lastValue}</TableCell>
                      <TableCell className="text-xs text-muted-foreground py-1">{reading.reference}</TableCell>
                      <TableCell className={cn('text-xs font-medium py-1', getVariationColor(reading.variation))}>
                        {formatVariation(reading.variation)}
                      </TableCell>
                      <TableCell className="py-1">{renderStatusIndicator(reading.status)}</TableCell>
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
              <div className="text-xs font-medium mb-2">Frequência (Hz) - Eixo Z</div>
              <div className="h-[100px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLine data={chartData.frequency}>
                    <XAxis dataKey="time" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[2, 8]} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <ReferenceLine 
                      y={DEFAULT_THRESHOLDS.frequency.reference} 
                      stroke="hsl(var(--muted-foreground))" 
                      strokeDasharray="4 2" 
                      label={{ value: `Ref ${DEFAULT_THRESHOLDS.frequency.reference}`, fontSize: 8, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <ReferenceLine 
                      y={DEFAULT_THRESHOLDS.frequency.attention} 
                      stroke="hsl(var(--warning))" 
                      strokeDasharray="4 2"
                    />
                    <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={{ r: 2 }} name="Freq Z" />
                  </RechartsLine>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Acceleration Chart */}
            <div className="border rounded-md p-2">
              <div className="text-xs font-medium mb-2">Aceleração (m/s²) - Eixo Z</div>
              <div className="h-[80px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLine data={chartData.acceleration}>
                    <XAxis dataKey="time" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 25]} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <ReferenceLine 
                      y={DEFAULT_THRESHOLDS.acceleration.normal} 
                      stroke="hsl(var(--warning))" 
                      strokeDasharray="4 2" 
                      label={{ value: `Atenção ${DEFAULT_THRESHOLDS.acceleration.normal}`, fontSize: 8, fill: 'hsl(var(--warning))' }}
                    />
                    <ReferenceLine 
                      y={DEFAULT_THRESHOLDS.acceleration.alert} 
                      stroke="hsl(var(--destructive))" 
                      strokeDasharray="4 2"
                    />
                    <Line type="monotone" dataKey="value" stroke="hsl(var(--chart-2))" strokeWidth={1.5} dot={{ r: 2 }} name="Acel Z" />
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