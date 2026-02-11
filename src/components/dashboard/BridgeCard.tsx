import { useState, useMemo, useEffect } from 'react';
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
import {
  LineChart as RechartsLine,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
  Legend,
} from 'recharts';
import { useTelemetry } from '@/hooks/useTelemetry';
import { useDevices } from '@/hooks/useDevices';
import { useBridgeLimits } from '@/hooks/useBridgeLimits';
import { limitsToThresholds } from '@/lib/api/bridgeLimits';
import {
  getSensorStatus,
  calculateVariation,
  getStatusConfig,
  getReferenceText,
} from '@/lib/utils/sensorStatus';
import { formatDateValue } from '@/lib/utils/formatValue';

interface BridgeCardProps {
  bridge: Bridge;
}

type AxisFilter = 'all' | 'X' | 'Y' | 'Z';
type ViewMode = 'table' | 'chart';

const TEN_MINUTES_MS = 10 * 60 * 1000;
const SENSOR_COLORS = ['#4F8EF7', '#34D399', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

const CHART_HEIGHT_CLASS = 'h-[240px]';

const calculateActivityStatus = (timestamp: string | undefined): 'online' | 'offline' => {
  if (!timestamp) return 'offline';
  return (Date.now() - new Date(timestamp).getTime()) < TEN_MINUTES_MS ? 'online' : 'offline';
};

// ===== Legend custom (sensores + limites) =====
type LegendThresholdItem = {
  key: string;
  label: string;
  valueText: string;
  color: string;
};

type LegendProps = {
  sensors: string[];
  colorMap: Map<string, string>;
  selected: Set<string>;
  onToggleSensor: (key: string) => void;
  thresholds: LegendThresholdItem[];
  enableFilter: boolean; // regra: só filtra quando tiver >2 sensores
};

function ChartLegend({
  sensors,
  colorMap,
  selected,
  onToggleSensor,
  thresholds,
  enableFilter,
}: LegendProps) {
  const hasFilter = enableFilter && selected.size > 0;

  return (
    <div className="flex w-full flex-col gap-2">
      {/* Linha 1: sensores (centralizado) */}
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] leading-none">
        {sensors.map((s) => {
          const color = colorMap.get(s) ?? '#999';
          const isDimmed = hasFilter && !selected.has(s);

          return (
            <button
              key={s}
              type="button"
              className={cn(
                'flex items-center gap-1.5 select-none',
                enableFilter ? 'cursor-pointer' : 'cursor-default',
                isDimmed && 'opacity-30'
              )}
              onClick={() => {
                if (!enableFilter) return;
                onToggleSensor(s);
              }}
              title={enableFilter ? 'Clique para ocultar/mostrar' : undefined}
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-[3px]"
                style={{ backgroundColor: color }}
              />
              <span className="whitespace-nowrap">{s}</span>
            </button>
          );
        })}
      </div>

      {/* Linha 2: referências (abaixo, centralizado) */}
      {thresholds.length > 0 && (
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] leading-none opacity-90">
          {thresholds.map((t) => (
            <span key={t.key} className="flex items-center gap-1.5 select-none">
              <span
                className="inline-block h-[2px] w-5"
                style={{
                  backgroundColor: t.color,
                  backgroundImage:
                    'repeating-linear-gradient(to right, currentColor 0 6px, transparent 6px 10px)',
                  color: t.color,
                }}
              />
              <span className="whitespace-nowrap">
                {t.label}: {t.valueText}
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function BridgeCard({ bridge }: BridgeCardProps) {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [axisFilter, setAxisFilter] = useState<AxisFilter>('all');

  const [freqSelected, setFreqSelected] = useState<Set<string>>(new Set());
  const [accSelected, setAccSelected] = useState<Set<string>>(new Set());

  const toggleSelected = (key: string, type: 'frequency' | 'acceleration') => {
    const setter = type === 'frequency' ? setFreqSelected : setAccSelected;
    setter(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  useEffect(() => {
    if (viewMode !== 'chart') {
      setFreqSelected(new Set());
      setAccSelected(new Set());
    }
  }, [viewMode]);

  const { devices, isLoading: isDevicesLoading } = useDevices(undefined, bridge.id);
  const { latestData, timeSeriesData, isLoading: isTelemetryLoading } = useTelemetry(bridge.id);

  const isDataLoading = isDevicesLoading || isTelemetryLoading;

  const { rawLimits } = useBridgeLimits(bridge.id);
  const thresholds = useMemo(() => limitsToThresholds(rawLimits), [rawLimits]);

  const deviceKindMap = useMemo(() => {
    const m = new Map<string, 'frequency' | 'acceleration' | 'command_box' | 'unknown'>();

    devices.forEach(d => {
      if (d.type === 'frequency') m.set(d.deviceId, 'frequency');
      else if (d.type === 'acceleration') m.set(d.deviceId, 'acceleration');
      else if (d.type === 'command_box') m.set(d.deviceId, 'command_box');
      else m.set(d.deviceId, 'unknown');
    });

    latestData.forEach(t => {
      const current = m.get(t.deviceId);
      if (current && current !== 'unknown') return;

      const mode = String((t as any)?.modoOperacao ?? '').toLowerCase();
      if (mode === 'frequencia') m.set(t.deviceId, 'frequency');
      else if (mode === 'aceleracao') m.set(t.deviceId, 'acceleration');
      else if (!current) m.set(t.deviceId, 'unknown');
    });

    return m;
  }, [devices, latestData]);

  const frequencyDeviceIds = useMemo(() => {
    const out: string[] = [];
    deviceKindMap.forEach((kind, deviceId) => {
      if (kind === 'frequency') out.push(deviceId);
    });
    return out;
  }, [deviceKindMap]);

  const accelerationDeviceIds = useMemo(() => {
    const out: string[] = [];
    deviceKindMap.forEach((kind, deviceId) => {
      if (kind === 'acceleration') out.push(deviceId);
    });
    return out;
  }, [deviceKindMap]);

  const excludedDeviceIds = useMemo(() => {
    const out = new Set<string>();
    deviceKindMap.forEach((kind, deviceId) => {
      if (kind === 'command_box') out.add(deviceId);
    });
    return out;
  }, [deviceKindMap]);

  const sensorReadings = useMemo(() => {
    const formatSensorName = (name: string | undefined, id: string) => {
      if (name) return name;
      return `Sensor ${id.slice(-4)}`;
    };

    const processReading = (
      deviceId: string,
      deviceName: string | undefined,
      telemetry: typeof latestData[0] | undefined,
      deviceType?: string
    ) => {
      const isFrequency = deviceType === 'frequency' || telemetry?.modoOperacao === 'frequencia';
      const type: 'frequency' | 'acceleration' = isFrequency ? 'frequency' : 'acceleration';

      let value: number | undefined;
      if (telemetry) {
        if (isFrequency) value = telemetry.frequency;
        else value = telemetry.acceleration?.z;
      }

      const status = getSensorStatus(value, type, thresholds);
      const variation = calculateVariation(value, type, thresholds);
      const activityStatus = calculateActivityStatus(telemetry?.timestamp);

      const displayValue =
        value !== undefined && value !== null
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

    if (devices.length > 0) {
      return devices.map(device => {
        const telemetry = latestData.find(t =>
          t.deviceId === device.deviceId || t.deviceId === device.name
        );
        return processReading(device.deviceId, device.name, telemetry, device.type);
      });
    }

    if (latestData.length > 0) {
      return latestData.map(telemetry => {
        return processReading(telemetry.deviceId, undefined, telemetry);
      });
    }

    return [];
  }, [devices, latestData, thresholds]);

  const activeSensorsCount = useMemo(
    () => sensorReadings.filter(r => r.activityStatus === 'online').length,
    [sensorReadings]
  );

  const chartData = useMemo(() => {
    if (!timeSeriesData || timeSeriesData.length === 0) {
      return {
        frequency: { data: [], sensorIds: [] as string[] },
        acceleration: { data: [], sensorIds: [] as string[] },
        thresholds,
      };
    }

    const buildSensorChart = (type: 'frequency' | 'acceleration') => {
      const allowedIds =
        type === 'frequency' ? new Set(frequencyDeviceIds) : new Set(accelerationDeviceIds);

      const filtered = timeSeriesData.filter(d => {
        if (excludedDeviceIds.has(d.deviceId)) return false;
        return allowedIds.has(d.deviceId);
      });

      const sensorDataMap = new Map<string, typeof filtered>();
      filtered.forEach(d => {
        if (!sensorDataMap.has(d.deviceId)) sensorDataMap.set(d.deviceId, []);
        sensorDataMap.get(d.deviceId)!.push(d);
      });

      const allTimestamps = new Set<string>();
      const sensorLabelsMap = new Map<string, string>();

      sensorDataMap.forEach((points, deviceId) => {
        const device = devices.find(dev => dev.deviceId === deviceId);
        const label = device?.name || deviceId?.slice(-4) || 'Sensor';
        sensorLabelsMap.set(deviceId, label);

        const sorted = [...points].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        sorted.slice(-10).forEach(p => {
          allTimestamps.add(formatDateValue(p.timestamp, 'HH:mm:ss'));
        });
      });

      const sortedTimes = [...allTimestamps].sort();
      const timeMap = new Map<string, Record<string, number | string>>();
      sortedTimes.forEach(time => timeMap.set(time, { time }));

      sensorDataMap.forEach((points, deviceId) => {
        const label = sensorLabelsMap.get(deviceId)!;

        const sorted = [...points].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        sorted.slice(-10).forEach(p => {
          const time = formatDateValue(p.timestamp, 'HH:mm:ss');
          const row = timeMap.get(time);
          if (row) row[label] = p.value;
        });
      });

      const data = Array.from(timeMap.values());
      const sensorLabels = [...sensorLabelsMap.values()];

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
  }, [timeSeriesData, thresholds, devices, excludedDeviceIds, frequencyDeviceIds, accelerationDeviceIds]);

  const freqColorMap = useMemo(() => {
    const m = new Map<string, string>();
    chartData.frequency.sensorIds.forEach((label, idx) => {
      m.set(label, SENSOR_COLORS[idx % SENSOR_COLORS.length]);
    });
    return m;
  }, [chartData.frequency.sensorIds]);

  const accColorMap = useMemo(() => {
    const m = new Map<string, string>();
    chartData.acceleration.sensorIds.forEach((label, idx) => {
      m.set(label, SENSOR_COLORS[idx % SENSOR_COLORS.length]);
    });
    return m;
  }, [chartData.acceleration.sensorIds]);

  const visibleFreqIds = useMemo(() => {
    if (chartData.frequency.sensorIds.length > 2 && freqSelected.size > 0) {
      return chartData.frequency.sensorIds.filter(id => freqSelected.has(id));
    }
    return chartData.frequency.sensorIds;
  }, [chartData.frequency.sensorIds, freqSelected]);

  const visibleAccIds = useMemo(() => {
    if (chartData.acceleration.sensorIds.length > 2 && accSelected.size > 0) {
      return chartData.acceleration.sensorIds.filter(id => accSelected.has(id));
    }
    return chartData.acceleration.sensorIds;
  }, [chartData.acceleration.sensorIds, accSelected]);

  const filteredReadings = useMemo(() => {
    if (axisFilter === 'all') return sensorReadings;
    return sensorReadings.filter(r => r.axis === axisFilter);
  }, [sensorReadings, axisFilter]);

  const alertCount = useMemo(
    () => sensorReadings.filter(r => r.status === 'alert' || r.status === 'attention').length,
    [sensorReadings]
  );

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

  const renderStatusIndicator = (status: 'normal' | 'attention' | 'alert') => {
    const config = getStatusConfig(status);
    return <span className={cn('inline-block h-2.5 w-2.5 rounded-full', config.bgClass)} />;
  };

  // ===== thresholds pra legenda (freq e accel) =====
  // ✅ FREQUÊNCIA: trocar nomes/cores conforme você pediu:
  // - reference (3.7) => Atenção (warning)
  // - attention (7)   => Alerta (destructive)
  const freqLegendThresholds = useMemo<LegendThresholdItem[]>(() => {
    const att = chartData.thresholds?.frequency?.reference; // 3.7 => Atenção
    const al = chartData.thresholds?.frequency?.attention;  // 7   => Alerta
    const items: LegendThresholdItem[] = [];

    if (att !== undefined && att !== null) {
      items.push({
        key: 'freq_attention',
        label: 'Atenção',
        valueText: `${Number(att).toFixed(2)} Hz`,
        color: 'hsl(var(--warning))',
      });
    }

    if (al !== undefined && al !== null) {
      items.push({
        key: 'freq_alert',
        label: 'Alerta',
        valueText: `${Number(al).toFixed(2)} Hz`,
        color: 'hsl(var(--destructive))',
      });
    }

    return items;
  }, [chartData.thresholds]);

  const accLegendThresholds = useMemo<LegendThresholdItem[]>(() => {
    const att = chartData.thresholds?.acceleration?.normal; // atenção
    const al = chartData.thresholds?.acceleration?.alert;   // alerta
    const items: LegendThresholdItem[] = [];
    if (att !== undefined && att !== null) {
      items.push({
        key: 'acc_attention',
        label: 'Atenção',
        valueText: `${Number(att).toFixed(2)} m/s²`,
        color: 'hsl(var(--warning))',
      });
    }
    if (al !== undefined && al !== null) {
      items.push({
        key: 'acc_alert',
        label: 'Alerta',
        valueText: `${Number(al).toFixed(2)} m/s²`,
        color: 'hsl(var(--destructive))',
      });
    }
    return items;
  }, [chartData.thresholds]);

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg flex flex-col">
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

        <div className="mt-3">
          <span className="text-xs text-muted-foreground mr-1.5">Criticidade</span>
          <Badge variant="secondary" className={cn('text-xs', criticalityConfig.className)}>
            {criticalityConfig.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        {isDataLoading ? (
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
                        <TableRow
                          key={idx}
                          className="h-8 cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/bridge/${bridge.id}?sensor=${encodeURIComponent(reading.sensorName)}`)}
                        >
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
              <div className="space-y-3">
                <div className="text-xs font-medium text-muted-foreground">Últimos Dados por Sensor</div>

                {/* Frequency Chart */}
                <div className="border rounded-md p-2">
                  <div className="text-xs font-medium mb-2">Frequência (Hz)</div>
                  <div className={CHART_HEIGHT_CLASS}>
                    {chartData.frequency.data.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                        Sem dados de frequência disponíveis
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsLine data={chartData.frequency.data}>
                          <XAxis dataKey="time" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                          <YAxis domain={[3, 10.5]} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                          <Tooltip />

                          <Legend
                            content={() => (
                              <ChartLegend
                                sensors={chartData.frequency.sensorIds}
                                colorMap={freqColorMap}
                                selected={freqSelected}
                                enableFilter={chartData.frequency.sensorIds.length > 2}
                                onToggleSensor={(k) => toggleSelected(k, 'frequency')}
                                thresholds={freqLegendThresholds}
                              />
                            )}
                          />

                          {/* ✅ Atenção = thresholds.frequency.reference (3.7) */}
                          <ReferenceLine
                            y={chartData.thresholds.frequency.reference}
                            stroke="hsl(var(--warning))"
                            strokeDasharray="4 2"
                          />

                          {/* ✅ Alerta = thresholds.frequency.attention (7) */}
                          <ReferenceLine
                            y={chartData.thresholds.frequency.attention}
                            stroke="hsl(var(--destructive))"
                            strokeDasharray="4 2"
                          />

                          {visibleFreqIds.map((sensorId) => (
                            <Line
                              key={sensorId}
                              type="monotone"
                              dataKey={sensorId}
                              stroke={freqColorMap.get(sensorId) ?? SENSOR_COLORS[0]}
                              strokeWidth={1.5}
                              dot={{ r: 2 }}
                              connectNulls
                              isAnimationActive={true}
                              animationDuration={450}
                              animationEasing="ease-out"
                            />
                          ))}
                        </RechartsLine>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Acceleration Chart */}
                <div className="border rounded-md p-2">
                  <div className="text-xs font-medium mb-2">Aceleração (m/s²)</div>
                  <div className={CHART_HEIGHT_CLASS}>
                    {chartData.acceleration.data.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                        Sem dados de aceleração disponíveis
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsLine data={chartData.acceleration.data}>
                          <XAxis dataKey="time" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                          <YAxis domain={[9, 13]} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                          <Tooltip />

                          <Legend
                            content={() => (
                              <ChartLegend
                                sensors={chartData.acceleration.sensorIds}
                                colorMap={accColorMap}
                                selected={accSelected}
                                enableFilter={chartData.acceleration.sensorIds.length > 2}
                                onToggleSensor={(k) => toggleSelected(k, 'acceleration')}
                                thresholds={accLegendThresholds}
                              />
                            )}
                          />

                          <ReferenceLine
                            y={chartData.thresholds.acceleration.normal}
                            stroke="hsl(var(--warning))"
                            strokeDasharray="4 2"
                          />
                          <ReferenceLine
                            y={chartData.thresholds.acceleration.alert}
                            stroke="hsl(var(--destructive))"
                            strokeDasharray="4 2"
                          />

                          {visibleAccIds.map((sensorId) => (
                            <Line
                              key={sensorId}
                              type="monotone"
                              dataKey={sensorId}
                              stroke={accColorMap.get(sensorId) ?? SENSOR_COLORS[0]}
                              strokeWidth={1.5}
                              dot={{ r: 2 }}
                              connectNulls
                              isAnimationActive={true}
                              animationDuration={450}
                              animationEasing="ease-out"
                            />
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
            Atualizado: {format(new Date(bridge.lastUpdate), 'dd/MM/yyyy, HH:mm:ss')}
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
