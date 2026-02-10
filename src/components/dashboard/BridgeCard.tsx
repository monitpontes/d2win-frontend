import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Clock, ArrowRight, AlertTriangle, TableIcon, LineChart } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { LineChart as RechartsLine, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine, Legend } from 'recharts';
import { useTelemetry } from '@/hooks/useTelemetry';
import { useDevices } from '@/hooks/useDevices';
import { useBridgeLimits } from '@/hooks/useBridgeLimits';
import { limitsToThresholds } from '@/lib/api/bridgeLimits';
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

const TEN_MINUTES_MS = 10 * 60 * 1000;
const SENSOR_COLORS = ['#4F8EF7', '#34D399', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

// Calculate if sensor is active based on 10-minute threshold
const calculateActivityStatus = (timestamp: string | undefined): 'online' | 'offline' => {
  if (!timestamp) return 'offline';
  return (Date.now() - new Date(timestamp).getTime()) < TEN_MINUTES_MS ? 'online' : 'offline';
};

export function BridgeCard({ bridge }: BridgeCardProps) {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [axisFilter, setAxisFilter] = useState<AxisFilter>('all');

  // Fetch devices from database first (instant HTTP)
  const { devices, isLoading: isDevicesLoading } = useDevices(undefined, bridge.id);
  
  // Fetch real telemetry data with cache support
  const { latestData, timeSeriesData, isLoading: isTelemetryLoading } = useTelemetry(bridge.id);

  // Combined loading flag - only show content when BOTH are ready
  const isDataLoading = isDevicesLoading || isTelemetryLoading;
  
  // Fetch bridge limits and convert to thresholds
  const { rawLimits } = useBridgeLimits(bridge.id);
  const thresholds = useMemo(() => limitsToThresholds(rawLimits), [rawLimits]);

  // Combine devices with telemetry - devices come first to show all sensors immediately
  const sensorReadings = useMemo(() => {
    // Helper to format sensor name - use name if available, else last 4 chars of ID
    const formatSensorName = (name: string | undefined, id: string) => {
      if (name) return name;
      return `Sensor ${id.slice(-4)}`;
    };

    // Helper to process telemetry data into a reading
    const processReading = (
      deviceId: string,
      deviceName: string | undefined,
      telemetry: typeof latestData[0] | undefined,
      deviceType?: string
    ) => {
      // Determine type based on device type or telemetry mode
      const isFrequency = deviceType === 'frequency' || telemetry?.modoOperacao === 'frequencia';
      const type: 'frequency' | 'acceleration' = isFrequency ? 'frequency' : 'acceleration';
      
      // Extract value if telemetry exists
      let value: number | undefined;
      if (telemetry) {
        if (isFrequency) {
          value = telemetry.frequency;
        } else {
          value = telemetry.acceleration?.z;
        }
      }
      
      const status = getSensorStatus(value, type, thresholds);
      const variation = calculateVariation(value, type, thresholds);
      const activityStatus = calculateActivityStatus(telemetry?.timestamp);

      // Format display value
      const displayValue = value !== undefined && value !== null
        ? `${value.toFixed(2)} ${isFrequency ? 'Hz' : 'm/s²'}`
        : '-';

      return {
        sensorName: formatSensorName(deviceName, deviceId),
        axis: 'Z' as const,
        lastValue: displayValue,
        reference: getReferenceText(type, thresholds),
        variation,
        status,
        activityStatus,
        updatedAt: telemetry?.timestamp ? formatDateValue(telemetry.timestamp, 'dd/MM HH:mm:ss') : '-',
      };
    };

    // If we have devices from the database, use them as the base
    if (devices.length > 0) {
      return devices.map(device => {
        // Match using deviceId (string) instead of id (ObjectId)
        const telemetry = latestData.find(t => 
          t.deviceId === device.deviceId || t.deviceId === device.name
        );
        return processReading(device.deviceId, device.name, telemetry, device.type);
      });
    }

    // Fallback to latestData if no devices (API timeout or empty)
    if (latestData.length > 0) {
      return latestData.map(telemetry => {
        return processReading(telemetry.deviceId, undefined, telemetry);
      });
    }

    return [];
  }, [devices, latestData, thresholds]);

  // Count active sensors (data within last 10 minutes)
  const activeSensorsCount = useMemo(() => 
    sensorReadings.filter(r => r.activityStatus === 'online').length
  , [sensorReadings]);

  // Generate chart data grouped by sensor
  const chartData = useMemo(() => {
    if (!timeSeriesData || timeSeriesData.length === 0) {
      return { frequency: { data: [], sensorIds: [] }, acceleration: { data: [], sensorIds: [] }, thresholds };
    }

    const buildSensorChart = (type: 'frequency' | 'acceleration') => {
      // 1. Filter by device type from DB
      const validDeviceIds = new Set(
        devices.filter(d => d.type === type).map(d => d.deviceId)
      );
      // 2. Filter telemetry by type AND valid devices
      const filtered = timeSeriesData.filter(d => 
        d.type === type && (validDeviceIds.size === 0 || validDeviceIds.has(d.deviceId))
      );
      const sensorIds = [...new Set(filtered.map(d => d.deviceId))];
      const timeMap = new Map<string, Record<string, number | string>>();
      filtered.forEach(d => {
        const time = formatDateValue(d.timestamp, 'HH:mm:ss');
        if (!timeMap.has(time)) timeMap.set(time, { time });
        const row = timeMap.get(time)!;
        const device = devices.find(dev => dev.deviceId === d.deviceId);
        const label = device?.name || d.deviceId?.slice(-4) || 'Sensor';
        row[label] = d.value;
      });
      const sensorLabels = sensorIds.map(id => {
        const device = devices.find(dev => dev.deviceId === id);
        return device?.name || id?.slice(-4) || 'Sensor';
      });
      const data = Array.from(timeMap.values()).slice(-10);
      // 3. Only keep sensors with at least 1 value in the final data
      const activeSensorLabels = sensorLabels.filter(label =>
        data.some(row => row[label] !== undefined && row[label] !== null)
      );
      return { data, sensorIds: activeSensorLabels };
    };

    return {
      frequency: buildSensorChart('frequency'),
      acceleration: buildSensorChart('acceleration'),
      thresholds,
    };
  }, [timeSeriesData, thresholds, devices]);

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
        {isDataLoading ? (
          /* Loading State - shows skeleton while devices and telemetry load */
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <div className="flex space-x-2">
              <Skeleton className="h-4 w-4 rounded-full animate-pulse" />
              <Skeleton className="h-4 w-4 rounded-full animate-pulse" />
              <Skeleton className="h-4 w-4 rounded-full animate-pulse" />
            </div>
            <p className="text-sm text-muted-foreground">Carregando dados dos sensores...</p>
            <div className="w-full space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        ) : (
          <>
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
                <div className="max-h-[320px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-[11px] h-8 py-1 px-2 sticky top-0 bg-muted/95 whitespace-nowrap">Sensor</TableHead>
                        <TableHead className="text-[11px] h-8 py-1 px-2 sticky top-0 bg-muted/95 w-10">Eixo</TableHead>
                        <TableHead className="text-[11px] h-8 py-1 px-2 sticky top-0 bg-muted/95 whitespace-nowrap">Valor</TableHead>
                        <TableHead className="text-[11px] h-8 py-1 px-2 sticky top-0 bg-muted/95 whitespace-nowrap">Ref.</TableHead>
                        <TableHead className="text-[11px] h-8 py-1 px-2 sticky top-0 bg-muted/95 w-8">St.</TableHead>
                        <TableHead className="text-[11px] h-8 py-1 px-2 sticky top-0 bg-muted/95 whitespace-nowrap">Atualizado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReadings.map((reading, idx) => (
                        <TableRow key={idx} className="h-8 cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/bridge/${bridge.id}?sensor=${encodeURIComponent(reading.sensorName)}`)}>
                          <TableCell className="text-[11px] font-medium py-1 px-2 whitespace-nowrap">{reading.sensorName}</TableCell>
                          <TableCell className="text-[11px] py-1 px-2">
                            <Badge variant="outline" className="text-[9px] px-1 py-0 text-primary border-primary">
                              {reading.axis}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-[11px] font-medium py-1 px-2 whitespace-nowrap">{reading.lastValue}</TableCell>
                          <TableCell className="text-[11px] text-muted-foreground py-1 px-2 whitespace-nowrap">{reading.reference}</TableCell>
                          <TableCell className="py-1 px-2">{renderStatusIndicator(reading.status)}</TableCell>
                          <TableCell className="text-[11px] text-muted-foreground py-1 px-2 whitespace-nowrap">{reading.updatedAt}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              /* Chart View */
              <div className="space-y-3">
                <div className="text-xs font-medium text-muted-foreground">Últimos Dados por Sensor</div>
                
                {/* Frequency Chart */}
                <div className="border rounded-md p-2">
                  <div className="text-xs font-medium mb-2">Frequência (Hz)</div>
                  <div className="h-[160px]">
                    {chartData.frequency.data.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                        Sem dados de frequência disponíveis
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsLine data={chartData.frequency.data}>
                          <XAxis dataKey="time" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                          <YAxis domain={[0, 8]} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: 9 }} />
                          <ReferenceLine 
                            y={chartData.thresholds.frequency.reference} 
                            stroke="hsl(var(--muted-foreground))" 
                            strokeDasharray="4 2" 
                            label={{ value: `Ref ${chartData.thresholds.frequency.reference}`, fontSize: 8, fill: 'hsl(var(--muted-foreground))' }}
                          />
                          <ReferenceLine 
                            y={chartData.thresholds.frequency.attention} 
                            stroke="hsl(var(--warning))" 
                            strokeDasharray="4 2"
                          />
                          {chartData.frequency.sensorIds.map((sensorId, idx) => (
                            <Line key={sensorId} type="monotone" dataKey={sensorId} stroke={SENSOR_COLORS[idx % SENSOR_COLORS.length]} strokeWidth={1.5} dot={{ r: 2 }} />
                          ))}
                        </RechartsLine>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Acceleration Chart */}
                <div className="border rounded-md p-2">
                  <div className="text-xs font-medium mb-2">Aceleração (m/s²)</div>
                  <div className="h-[160px]">
                    {chartData.acceleration.data.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                        Sem dados de aceleração disponíveis
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsLine data={chartData.acceleration.data}>
                          <XAxis dataKey="time" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                          <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: 9 }} />
                          <ReferenceLine 
                            y={chartData.thresholds.acceleration.normal} 
                            stroke="hsl(var(--warning))" 
                            strokeDasharray="4 2" 
                            label={{ value: `Atenção ${chartData.thresholds.acceleration.normal}`, fontSize: 8, fill: 'hsl(var(--warning))' }}
                          />
                          <ReferenceLine 
                            y={chartData.thresholds.acceleration.alert} 
                            stroke="hsl(var(--destructive))" 
                            strokeDasharray="4 2"
                          />
                          {chartData.acceleration.sensorIds.map((sensorId, idx) => (
                            <Line key={sensorId} type="monotone" dataKey={sensorId} stroke={SENSOR_COLORS[idx % SENSOR_COLORS.length]} strokeWidth={1.5} dot={{ r: 2 }} />
                          ))}
                        </RechartsLine>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer Stats */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className={activeSensorsCount > 0 ? 'text-success' : ''}>
              🔌 {activeSensorsCount}/{sensorReadings.length} sensores ativos
            </span>
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