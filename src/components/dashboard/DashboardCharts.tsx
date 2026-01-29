import * as React from 'react';
import type { Bridge } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardChartsProps {
  bridges: Bridge[];
  onFilterByTypology?: (typology: string) => void;
  onFilterBySpanType?: (spanType: string) => void;
  onFilterByBeamType?: (beamType: string) => void;
}

// Neutral color palette for charts
const NEUTRAL_COLORS = [
  'hsl(220, 15%, 45%)',
  'hsl(220, 10%, 60%)',
  'hsl(220, 10%, 75%)',
  'hsl(220, 15%, 35%)',
  'hsl(220, 10%, 50%)',
];

const PIE_COLORS = NEUTRAL_COLORS.slice(0, 3);

// Custom tooltip component moved outside to avoid ref issues with Recharts
const CustomTooltip = React.forwardRef<HTMLDivElement, any>(({ active, payload, label }, ref) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div ref={ref} className="rounded-lg border bg-background p-2 shadow-md">
      <p className="text-sm font-medium">{label || payload[0]?.name}</p>
      <p className="text-sm text-muted-foreground">Quantidade: {payload[0]?.value}</p>
    </div>
  );
});
CustomTooltip.displayName = 'CustomTooltip';

export function DashboardCharts({ bridges, onFilterByTypology, onFilterBySpanType, onFilterByBeamType }: DashboardChartsProps) {
  // Calculate typology distribution
  const typologyData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    bridges.forEach((bridge) => {
      counts[bridge.typology] = (counts[bridge.typology] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [bridges]);

  // Calculate span type distribution
  const spanTypeData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    bridges.forEach((bridge) => {
      counts[bridge.spanType] = (counts[bridge.spanType] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [bridges]);

  // Calculate beam type distribution
  const beamTypeData = React.useMemo(() => {
    const counts: Record<string, number> = {};
    bridges.forEach((bridge) => {
      counts[bridge.beamType] = (counts[bridge.beamType] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [bridges]);

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {/* Typology Pie Chart */}
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardHeader className="p-3 pb-1">
          <CardTitle className="text-sm">Distribuição por Tipologia</CardTitle>
          <CardDescription className="text-xs">Clique para filtrar</CardDescription>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typologyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={50}
                  dataKey="value"
                  onClick={(data) => onFilterByTypology?.(data.name)}
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={true}
                >
                  {typologyData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Span Type Bar Chart */}
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardHeader className="p-3 pb-1">
          <CardTitle className="text-sm">Distribuição por Tipo de Vão</CardTitle>
          <CardDescription className="text-xs">Clique para filtrar</CardDescription>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spanTypeData}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10 }} 
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10 }} 
                  axisLine={false}
                  tickLine={false}
                  width={20}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="value" 
                  fill="hsl(220, 15%, 50%)"
                  radius={[4, 4, 0, 0]}
                  onClick={(data) => onFilterBySpanType?.(data.name)}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Beam Type Bar Chart */}
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardHeader className="p-3 pb-1">
          <CardTitle className="text-sm">Distribuição por Tipo de Viga</CardTitle>
          <CardDescription className="text-xs">Clique para filtrar</CardDescription>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={beamTypeData}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 9 }} 
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10 }} 
                  axisLine={false}
                  tickLine={false}
                  width={20}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="value" 
                  fill="hsl(220, 10%, 65%)"
                  radius={[4, 4, 0, 0]}
                  onClick={(data) => onFilterByBeamType?.(data.name)}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
