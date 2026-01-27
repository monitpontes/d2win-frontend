import { useMemo } from 'react';
import type { Bridge } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardChartsProps {
  bridges: Bridge[];
  onFilterByTypology?: (typology: string) => void;
  onFilterBySpanType?: (spanType: string) => void;
  onFilterByBeamType?: (beamType: string) => void;
}

const COLORS = {
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--chart-2))',
  tertiary: 'hsl(var(--chart-3))',
  quaternary: 'hsl(var(--chart-4))',
  quinary: 'hsl(var(--chart-5))',
};

const PIE_COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'];

// Custom tooltip component moved outside to avoid ref issues with Recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-md">
        <p className="text-sm font-medium">{label || payload[0]?.name}</p>
        <p className="text-sm text-muted-foreground">Quantidade: {payload[0]?.value}</p>
      </div>
    );
  }
  return null;
};

export function DashboardCharts({ bridges, onFilterByTypology, onFilterBySpanType, onFilterByBeamType }: DashboardChartsProps) {
  // Calculate typology distribution
  const typologyData = useMemo(() => {
    const counts: Record<string, number> = {};
    bridges.forEach((bridge) => {
      counts[bridge.typology] = (counts[bridge.typology] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [bridges]);

  // Calculate span type distribution
  const spanTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    bridges.forEach((bridge) => {
      counts[bridge.spanType] = (counts[bridge.spanType] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [bridges]);

  // Calculate beam type distribution
  const beamTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    bridges.forEach((bridge) => {
      counts[bridge.beamType] = (counts[bridge.beamType] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [bridges]);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Typology Pie Chart */}
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Distribuição por Tipologia do Ativo</CardTitle>
          <CardDescription>Visão geral dos tipos de estruturas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typologyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={70}
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
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Distribuição por Tipo de Vão</CardTitle>
          <CardDescription>Clique para filtrar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spanTypeData}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11 }} 
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 11 }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="value" 
                  fill="hsl(var(--primary))"
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
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Distribuição por Tipo de Viga</CardTitle>
          <CardDescription>Clique para filtrar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={beamTypeData}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10 }} 
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 11 }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="value" 
                  fill="hsl(var(--chart-3))"
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
