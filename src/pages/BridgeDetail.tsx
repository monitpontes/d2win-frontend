import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockBridges, getSensorsByBridge, getEventsByBridge, getCamerasByBridge, getSchedulesByBridge, getDocumentsByBridge, mockSystemStatus, mockStructuralProblems } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { structuralStatusLabels, type StructuralStatus } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Activity, FileText, Camera, Settings, Calendar, MapPin, AlertTriangle, Wifi, WifiOff, Play, RefreshCw, FileUp, Download, Eye, Wrench, XCircle, CheckCircle, Clock, TriangleAlert, ExternalLink, FolderOpen, History, Video, Link as LinkIcon, Zap, Box, Table as TableIcon, Plus, Pencil, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ComposedChart, ReferenceLine as ReferenceLineComposed } from 'recharts';
import type { BridgeEvent, Intervention } from '@/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import Bridge3D, { type Bridge3DSensor } from '@/components/bridge/Bridge3D';
import DataAnalysisSection from '@/components/bridge/DataAnalysisSection';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useInterventions, type NewIntervention } from '@/hooks/useInterventions';
import { CreateInterventionDialog } from '@/components/interventions/CreateInterventionDialog';
import { exportInterventions, exportSensorData, exportEvents, generateBridgeReport, exportToJSON } from '@/lib/exportUtils';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function BridgeDetail() {
  const { id } = useParams<{ id: string }>();
  const { hasRole } = useAuth();
  const [selectedTab, setSelectedTab] = useState('monitoring');
  const [selectedSensor3D, setSelectedSensor3D] = useState<Bridge3DSensor | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<BridgeEvent | null>(null);
  const [isCreateInterventionOpen, setIsCreateInterventionOpen] = useState(false);
  const [editingIntervention, setEditingIntervention] = useState<(NewIntervention & { id: string }) | null>(null);
  const [deleteInterventionId, setDeleteInterventionId] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<{name: string; type: string; files: Array<{name: string; size: string; date: string; type: string}>} | null>(null);

  const { interventions, addIntervention, updateIntervention, deleteIntervention, getInterventionsByBridge } = useInterventions();

  const bridge = useMemo(() => mockBridges.find((b) => b.id === id), [id]);
  const sensors = useMemo(() => getSensorsByBridge(id || ''), [id]);
  const events = useMemo(() => getEventsByBridge(id || ''), [id]);
  const cameras = useMemo(() => getCamerasByBridge(id || ''), [id]);
  const schedules = useMemo(() => getSchedulesByBridge(id || ''), [id]);
  const documents = useMemo(() => getDocumentsByBridge(id || ''), [id]);
  const bridgeProblems = useMemo(() => mockStructuralProblems.filter(p => p.bridgeId === id), [id]);
  const bridgeInterventions = useMemo(() => getInterventionsByBridge(id || ''), [id, interventions]);

  const canEdit = hasRole(['admin', 'gestor']);

  if (!bridge) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6">
        <h2 className="text-xl font-semibold">Ponte não encontrada</h2>
        <Button asChild className="mt-4">
          <Link to="/dashboard">Voltar ao Dashboard</Link>
        </Button>
      </div>
    );
  }

  // Generate mock chart data with reference lines
  const chartData = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = (i % 2) * 30;
    return {
      time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      frequencyX: 2.3 + Math.random() * 0.4,
      frequencyZ: 2.1 + Math.random() * 0.3,
      accelerationX: 0.03 + Math.random() * 0.02,
      accelerationY: 0.02 + Math.random() * 0.015,
      accelerationZ: 0.04 + Math.random() * 0.025,
    };
  });

  const getStructuralStatusConfig = (status: StructuralStatus) => {
    const configs: Record<StructuralStatus, { label: string; className: string; badgeClass: string }> = {
      operacional: { label: structuralStatusLabels.operacional, className: 'text-success', badgeClass: 'bg-success text-success-foreground' },
      atencao: { label: structuralStatusLabels.atencao, className: 'text-warning', badgeClass: 'bg-warning text-warning-foreground' },
      restricoes: { label: structuralStatusLabels.restricoes, className: 'text-orange-500', badgeClass: 'bg-orange-500 text-white' },
      critico: { label: structuralStatusLabels.critico, className: 'text-destructive', badgeClass: 'bg-destructive text-destructive-foreground' },
      interdicao: { label: structuralStatusLabels.interdicao, className: 'text-destructive', badgeClass: 'bg-destructive text-destructive-foreground' },
    };
    return configs[status];
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      online: { label: 'Online', className: 'bg-success text-success-foreground' },
      offline: { label: 'Offline', className: 'bg-muted text-muted-foreground' },
      maintenance: { label: 'Manutenção', className: 'bg-warning text-warning-foreground' },
      planned: { label: 'Agendada', className: 'bg-muted text-foreground' },
      in_progress: { label: 'Em Andamento', className: 'bg-warning text-warning-foreground' },
      completed: { label: 'Concluída', className: 'bg-success text-success-foreground' },
      attention: { label: 'Atenção', className: 'bg-destructive text-destructive-foreground' },
    };
    return configs[status] || { label: status, className: 'bg-muted' };
  };

  const getProblemStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      'Em Análise': { label: 'Em Análise', className: 'bg-primary text-primary-foreground' },
      'Corrigido': { label: 'Corrigido', className: 'bg-success text-success-foreground' },
      'Agendado': { label: 'Agendado', className: 'bg-orange-500 text-white' },
      'Pendente': { label: 'Pendente', className: 'bg-muted text-muted-foreground' },
    };
    return configs[status] || { label: status, className: 'bg-muted' };
  };

  const getPriorityConfig = (priority: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      'Urgente': { label: 'Urgente', className: 'bg-destructive text-destructive-foreground' },
      'Média': { label: 'Média', className: 'bg-orange-500 text-white' },
      'Baixa': { label: 'Baixa', className: 'bg-muted text-muted-foreground' },
    };
    return configs[priority] || { label: priority, className: 'bg-muted' };
  };

  const getSeverityConfig = (severity: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      low: { label: 'Baixa', className: 'text-success' },
      medium: { label: 'Média', className: 'text-warning' },
      high: { label: 'Alta', className: 'text-destructive' },
      critical: { label: 'Crítica', className: 'text-destructive font-bold' },
    };
    return configs[severity] || { label: severity, className: '' };
  };

  const getCriticalityBadge = (criticality: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      low: { label: 'LOW', className: 'bg-success text-success-foreground' },
      medium: { label: 'MEDIUM', className: 'bg-primary text-primary-foreground' },
      high: { label: 'HIGH', className: 'bg-destructive text-destructive-foreground' },
    };
    return configs[criticality] || { label: criticality.toUpperCase(), className: 'bg-muted' };
  };

  // Mock service statuses
  const serviceStatuses = [
    { name: 'Aquisição de Dados', status: 'online', description: 'Operacional' },
    { name: 'Processamento de Sinais', status: 'online', description: 'Operacional' },
    { name: 'Sistema de Alertas', status: 'attention', description: 'Degradado' },
    { name: 'Sincronização Cloud', status: 'online', description: 'Operacional' },
  ];

  // Mock system events
  const systemEvents = [
    { time: '10:23', description: 'Backup automático concluído com sucesso' },
    { time: '09:15', description: 'Sensor F3 reportou variação de frequência' },
    { time: '08:47', description: 'Manutenção preventiva agendada para próxima semana' },
  ];

  const structuralStatusConfig = getStructuralStatusConfig(bridge.structuralStatus);
  const needsIntervention = ['critico', 'interdicao'].includes(bridge.structuralStatus);

  // Mock cameras data for the bridge
  const mockBridgeCameras = [
    { id: 1, name: 'Câmera 1', location: 'Vão 1 - Vista lateral', image: bridge.image },
    { id: 2, name: 'Câmera 2', location: 'Vão 2 - Vista lateral', image: 'https://images.unsplash.com/photo-1545296664-39db56ad95bd?w=800' },
    { id: 3, name: 'Câmera 3', location: 'Vão 3 - Vista lateral', image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800' },
    { id: 4, name: 'Câmera 4', location: 'Vão 4 - Vista lateral', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800' },
  ];

  // Generate more sensor data for the cards
  const sensorCards = Array.from({ length: 5 }, (_, i) => ({
    id: `S${i + 1}`,
    name: `Sensor S${i + 1}`,
    location: `Longarina ${i + 1 <= 3 ? 'N' : 'S'}`,
    frequency: `Frequência ${i + 1}`,
    status: i === 2 ? 'alert' : 'normal',
    freqK: (3.20 + Math.random() * 0.5).toFixed(2),
    freqP: (3.40 + Math.random() * 0.5).toFixed(2),
    accK: (0.10 + Math.random() * 0.05).toFixed(2),
    accP: (0.15 + Math.random() * 0.05).toFixed(2),
  }));

  // Bridge 3D sensors data
  const bridge3DSensors: Bridge3DSensor[] = sensorCards.map((s, i) => ({
    id: s.id,
    name: s.name,
    position: s.location,
    type: i < 4 ? 'Frequência' : 'Aceleração',
    deviceType: i < 4 ? 'frequencia' : 'aceleracao',
    status: s.status === 'alert' ? 'alert' : 'normal',
    frequency1: parseFloat(s.freqK),
    frequency2: parseFloat(s.freqP),
    acceleration: parseFloat(s.accK),
    timestamp: new Date().toISOString(),
  }));
  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="border-b bg-card p-4 md:p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard" className="flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">OAE km {bridge.km}+{Math.floor(Math.random() * 999)} ({bridge.name} - {bridge.rodovia})</h1>
              </div>
              <p className="text-sm text-muted-foreground">ID: {bridge.id.replace('bridge-', 'A-P')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border-2 border-destructive/50 bg-destructive/5 px-4 py-2">
            <span className="text-sm text-muted-foreground">Status Estrutural:</span>
            <Badge className={structuralStatusConfig.badgeClass}>
              {bridge.structuralStatus === 'critico' ? 'Crítico' : structuralStatusConfig.label}
            </Badge>
            {needsIntervention && (
              <button 
                onClick={() => setSelectedTab('monitoring')}
                className="flex items-center gap-1 text-sm text-destructive hover:text-destructive/80 hover:underline transition-all cursor-pointer"
              >
                <TriangleAlert className="h-4 w-4" />
                Intervenção recomendada
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1">
        <div className="border-b bg-card">
          <TabsList className="h-14 w-full justify-stretch gap-0 rounded-none bg-transparent p-0">
            <TabsTrigger 
              value="monitoring" 
              className="relative h-14 flex-1 rounded-none border-b-2 border-transparent font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              Monitoramento e Dados
            </TabsTrigger>
            <TabsTrigger 
              value="specifications" 
              className="relative h-14 flex-1 rounded-none border-b-2 border-transparent font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              Especificações
            </TabsTrigger>
            <TabsTrigger 
              value="cameras" 
              className="relative h-14 flex-1 rounded-none border-b-2 border-transparent font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              Câmeras
            </TabsTrigger>
            <TabsTrigger 
              value="service" 
              className="relative h-14 flex-1 rounded-none border-b-2 border-transparent font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              Dashboard de Serviço
            </TabsTrigger>
            <TabsTrigger 
              value="schedules" 
              className="relative h-14 flex-1 rounded-none border-b-2 border-transparent font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              Programações
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="p-6">
          {/* Monitoring Tab */}
          <TabsContent value="monitoring" className="m-0 space-y-6">
            {/* 3D Visualization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Box className="h-5 w-5" />
                  Visualização 3D
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 lg:grid-cols-3">
                  <div className="lg:col-span-2 h-[450px]">
                    <Bridge3D
                      sensors={bridge3DSensors}
                      onSensorClick={(sensor) => setSelectedSensor3D(sensor)}
                      selectedSensor={selectedSensor3D}
                      frequencyLimits={{ normalToAlert: 3.7, alertToCritical: 7 }}
                      accelerationLimits={{ normalToAlert: 2.5, alertToCritical: 5.0 }}
                    />
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium">Dados dos Sensores</h4>
                    {selectedSensor3D ? (
                      <div className="space-y-4">
                        <div className="space-y-2 rounded-lg border bg-card p-4">
                          {/* Info rows - one per line */}
                          <div className="flex justify-between items-center py-1 border-b">
                            <span className="text-muted-foreground text-sm">Nome:</span>
                            <span className="font-medium text-sm">{bridge.id.replace('bridge-', 'A-P')}-{selectedSensor3D.id}</span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-b">
                            <span className="text-muted-foreground text-sm">Posição:</span>
                            <span className="font-medium text-sm text-primary">Posição {selectedSensor3D.id}</span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-b">
                            <span className="text-muted-foreground text-sm">Tipo:</span>
                            <span className="font-medium text-sm text-primary">{selectedSensor3D.type}</span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-b">
                            <span className="text-muted-foreground text-sm">Status:</span>
                            <div className="flex items-center gap-1">
                              <span className={cn(
                                "w-2 h-2 rounded-full",
                                selectedSensor3D.status === 'alert' || selectedSensor3D.status === 'critical' 
                                  ? 'bg-destructive' 
                                  : selectedSensor3D.status === 'warning' 
                                  ? 'bg-warning' 
                                  : 'bg-success'
                              )} />
                              <Badge variant={
                                selectedSensor3D.status === 'alert' || selectedSensor3D.status === 'critical' 
                                  ? 'destructive' 
                                  : selectedSensor3D.status === 'warning' 
                                  ? 'outline' 
                                  : 'secondary'
                              } className="text-xs">
                                {selectedSensor3D.status === 'alert' || selectedSensor3D.status === 'critical' ? 'Alerta' : 
                                 selectedSensor3D.status === 'warning' ? 'Atenção' : 'Normal'}
                              </Badge>
                            </div>
                          </div>
                          
                          {selectedSensor3D.deviceType === 'frequencia' && (
                            <>
                              <div className="flex justify-between items-center py-1 border-b">
                                <span className="text-muted-foreground text-sm">Frequência Eixo X:</span>
                                <span className="font-bold text-sm">{selectedSensor3D.frequency1?.toFixed(2)} Hz</span>
                              </div>
                              <div className="flex justify-between items-center py-1 border-b">
                                <span className="text-muted-foreground text-sm">Magnitude Pico X:</span>
                                <span className="font-medium text-sm">{((selectedSensor3D.frequency1 || 3.5) * 5.5).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center py-1 border-b">
                                <span className="text-muted-foreground text-sm">Frequência Eixo Z:</span>
                                <span className="font-bold text-sm">{selectedSensor3D.frequency2?.toFixed(2)} Hz</span>
                              </div>
                              <div className="flex justify-between items-center py-1 border-b">
                                <span className="text-muted-foreground text-sm">Magnitude Pico Z:</span>
                                <span className="font-medium text-sm">{((selectedSensor3D.frequency2 || 3.2) * 6.8).toFixed(2)}</span>
                              </div>
                            </>
                          )}
                          
                          {selectedSensor3D.deviceType === 'aceleracao' && (
                            <>
                              <div className="flex justify-between items-center py-1 border-b">
                                <span className="text-muted-foreground text-sm">Aceleração Eixo X:</span>
                                <span className="font-bold text-sm">{selectedSensor3D.acceleration?.toFixed(2)} m/s²</span>
                              </div>
                              <div className="flex justify-between items-center py-1 border-b">
                                <span className="text-muted-foreground text-sm">Aceleração Eixo Z:</span>
                                <span className="font-bold text-sm">{((selectedSensor3D.acceleration || 0.15) * 1.2).toFixed(2)} m/s²</span>
                              </div>
                            </>
                          )}
                          
                          <div className="flex justify-between items-center py-1">
                            <span className="text-muted-foreground text-sm">Timestamp:</span>
                            <span className="font-mono text-xs">{selectedSensor3D.timestamp}</span>
                          </div>
                        </div>

                        {/* Sensor Chart - Last 8 readings */}
                        <div className="rounded-lg border bg-card p-4">
                          <h5 className="font-medium text-sm mb-2">
                            {selectedSensor3D.deviceType === 'frequencia' 
                              ? 'Frequência Eixos X e Z - Últimas 8 Leituras'
                              : 'Aceleração Eixos X e Z - Últimas 8 Leituras'
                            }
                          </h5>
                          <div className="h-36">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={Array.from({ length: 8 }, (_, i) => {
                                const baseTime = new Date();
                                baseTime.setMinutes(baseTime.getMinutes() - (7 - i) * 5);
                                const timeStr = `${baseTime.getHours().toString().padStart(2, '0')}:${baseTime.getMinutes().toString().padStart(2, '0')}:${baseTime.getSeconds().toString().padStart(2, '0')}`;
                                
                                if (selectedSensor3D.deviceType === 'frequencia') {
                                  return {
                                    time: timeStr,
                                    eixoX: (selectedSensor3D.frequency1 || 3.5) + (Math.random() - 0.5) * 0.3,
                                    eixoZ: (selectedSensor3D.frequency2 || 3.2) + (Math.random() - 0.5) * 0.2,
                                  };
                                } else {
                                  return {
                                    time: timeStr,
                                    eixoX: (selectedSensor3D.acceleration || 0.15) + (Math.random() - 0.5) * 0.05,
                                    eixoZ: ((selectedSensor3D.acceleration || 0.15) * 1.2) + (Math.random() - 0.5) * 0.05,
                                  };
                                }
                              })}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                                <XAxis dataKey="time" tick={{ fontSize: 8 }} angle={-45} textAnchor="end" height={40} />
                                <YAxis 
                                  tick={{ fontSize: 9 }} 
                                  domain={selectedSensor3D.deviceType === 'frequencia' ? [2.8, 4.0] : [0, 0.5]} 
                                  width={35}
                                />
                                <Tooltip 
                                  contentStyle={{ fontSize: 11 }}
                                  formatter={(value: number) => [
                                    selectedSensor3D.deviceType === 'frequencia' 
                                      ? `${value.toFixed(2)} Hz` 
                                      : `${value.toFixed(3)} m/s²`,
                                    ''
                                  ]}
                                />
                                <Legend 
                                  wrapperStyle={{ fontSize: 10 }}
                                  formatter={(value) => value === 'eixoX' ? 'Eixo X' : 'Eixo Z'}
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="eixoX" 
                                  stroke="hsl(var(--primary))" 
                                  strokeWidth={2} 
                                  dot={{ r: 3, fill: 'hsl(var(--primary))' }}
                                  name="eixoX"
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="eixoZ" 
                                  stroke="hsl(142, 76%, 36%)" 
                                  strokeWidth={2} 
                                  dot={{ r: 3, fill: 'hsl(142, 76%, 36%)' }}
                                  name="eixoZ"
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg border bg-muted/30 text-center">
                        <p className="text-sm text-muted-foreground">
                          Clique em um sensor no modelo 3D para ver os detalhes e o gráfico de leituras.
                        </p>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>• Utilize o mouse para girar a visualização</p>
                      <p>• Scroll para zoom</p>
                      <p>• Use os botões de navegação para vistas predefinidas</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Real-time Sensors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Sensores e Dados em Tempo Real
                </CardTitle>
                <CardDescription>
                  Sistema de Monitoramento Estrutural (SHM) com 5 sensores instalados na OAE.<br/>
                  Sensores utilizados: Acelerômetros triaxiais (1 Hz, 10 Hz, 50 Hz) (em todos os sensores exceto o 5) e 1 sensor de deformação (FBG) com frequência de 1 e 50 Hz. Não são utilizadas estações metereológicas nesta análise.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
                  {sensorCards.map((sensor) => (
                    <Card key={sensor.id} className={cn(
                      "border-2",
                      sensor.status === 'alert' ? 'border-destructive' : 'border-border'
                    )}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Localização</p>
                            <p className="font-medium text-sm">{sensor.location}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">{sensor.frequency}</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Status</span>
                            <span className={sensor.status === 'alert' ? 'text-destructive' : ''}>
                              {sensor.status === 'alert' ? 'Anomalia' : 'Normal'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Freq. K</span>
                            <span>{sensor.freqK} Hz</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Freq. P</span>
                            <span>{sensor.freqP} Hz</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Acc K</span>
                            <span>{sensor.accK} m/s²</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Acc P</span>
                            <span>{sensor.accP} m/s²</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Aquisição</span>
                            <span>10 Hz/1k</span>
                          </div>
                        </div>
                        {sensor.status === 'alert' && (
                          <div className="mt-3 flex items-center gap-1 text-destructive text-xs">
                            <AlertTriangle className="h-3 w-3" />
                            Tempo no trajeto elevado
                          </div>
                        )}
                        <Button variant="outline" size="sm" className="w-full mt-3 text-xs">
                          + Alarme
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Charts */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Frequência - Últimas 24 Horas</CardTitle>
                      <CardDescription>Monitoramento contínuo dos eixos X e Z dos sensores de frequência</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Eixos: X, Z</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="time" className="text-xs" tick={{ fontSize: 10 }} />
                        <YAxis className="text-xs" domain={[1.5, 3.5]} tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend />
                        <ReferenceLine y={3.0} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label={{ value: 'Limite', position: 'right', fontSize: 10 }} />
                        <Line type="monotone" dataKey="frequencyX" stroke="hsl(220, 70%, 50%)" name="Eixo X" strokeWidth={1} dot={false} />
                        <Line type="monotone" dataKey="frequencyZ" stroke="hsl(280, 70%, 50%)" name="Eixo Z" strokeWidth={1} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Aceleração - Últimas 24 Horas</CardTitle>
                      <CardDescription>Monitoramento triaxial dos eixos X, Y e Z da aceleração estrutural</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Eixos: X, Y, Z</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="time" className="text-xs" tick={{ fontSize: 10 }} />
                        <YAxis className="text-xs" domain={[0, 0.1]} tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="accelerationX" stroke="hsl(0, 70%, 50%)" name="X" strokeWidth={1} dot={false} />
                        <Line type="monotone" dataKey="accelerationY" stroke="hsl(120, 70%, 40%)" name="Y" strokeWidth={1} dot={false} />
                        <Line type="monotone" dataKey="accelerationZ" stroke="hsl(40, 90%, 50%)" name="Z" strokeWidth={1} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-2 text-xs">
                    <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-500"></span> Eixo X (Lateral)</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-green-600"></span> Eixo Y (Longitudinal)</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-yellow-500"></span> Eixo Z (Vertical)</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Data Analysis Section */}
            <DataAnalysisSection bridgeId={bridge.id} />

            {/* Events Table */}
            <Card>
              <CardHeader>
                <CardTitle>Eventos e Anomalias</CardTitle>
                <CardDescription>Detalhes de anomalias detectadas nos dados</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Sensor</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Métrica</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Severidade</TableHead>
                      <TableHead>Descrição</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.length > 0 ? (
                      events.map((event) => {
                        const sensor = sensors.find((s) => s.id === event.sensorId);
                        const severityConfig = getSeverityConfig(event.severity);
                        return (
                          <TableRow 
                            key={event.id} 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setSelectedEvent(event)}
                          >
                            <TableCell className="text-sm">
                              {format(new Date(event.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </TableCell>
                            <TableCell>{sensor?.name || event.sensorId}</TableCell>
                            <TableCell className="capitalize">{event.type}</TableCell>
                            <TableCell>frequência</TableCell>
                            <TableCell>11.89 m/s²</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={severityConfig.className}>
                                {severityConfig.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{event.description}</TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          Nenhum evento registrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                <p className="text-xs text-muted-foreground mt-2">
                  Clique em um evento para ver detalhes
                </p>
              </CardContent>
            </Card>

            {/* Event Details Dialog */}
            <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Detalhes do Evento Anômalo</DialogTitle>
                </DialogHeader>
                
                {selectedEvent && (() => {
                  const sensor = sensors.find((s) => s.id === selectedEvent.sensorId);
                  const severityConfig = getSeverityConfig(selectedEvent.severity);
                  
                  // Generate 24h mock data
                  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
                    time: `${String(i).padStart(2, '0')}:00`,
                    value: i >= 11 && i <= 13 ? (i === 12 ? 10.7 : 0.5 + Math.random() * 0.3) : 0.1 + Math.random() * 0.2,
                    isAnomaly: i === 12,
                  }));
                  
                  return (
                    <div className="space-y-4">
                      {/* Event Summary */}
                      <Card>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <h4 className="font-semibold">Resumo do Evento</h4>
                              <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                                <p className="text-muted-foreground">Timestamp: <span className="text-foreground">{format(new Date(selectedEvent.timestamp), 'dd/MM/yyyy, HH:mm', { locale: ptBR })}</span></p>
                                <p className="text-muted-foreground">Sensor: <span className="text-foreground">{sensor?.name || selectedEvent.sensorId}</span></p>
                                <p className="text-muted-foreground">Tipo: <span className="text-foreground capitalize">{selectedEvent.type}</span></p>
                                <p className="text-muted-foreground">Métrica: <span className="text-foreground">rmsAccelZ</span></p>
                              </div>
                              <p className="text-sm">
                                Valor registrado: <span className="text-destructive font-bold">10.706 m/s²</span>
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Sensor {sensor?.name || 'accel1-Z'} registrou valores 8821% acima da média por aproximadamente 31 minutos. 
                                Aceleração RMS elevada no eixo Z: 10.706 m/s² (limite: 10.5 m/s²)
                              </p>
                            </div>
                            <Badge 
                              variant={selectedEvent.severity === 'critical' || selectedEvent.severity === 'high' ? 'destructive' : 'secondary'}
                            >
                              {severityConfig.label}
                            </Badge>
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
                              <p className="text-2xl font-bold text-green-600">0.122 m/s²</p>
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
                              <Button variant="default" size="sm" className="h-7 text-xs rounded-none">
                                Gráfico
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 text-xs flex items-center gap-1 rounded-none">
                                <TableIcon className="h-3 w-3" />
                                Tabela
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={hourlyData}>
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
                              </LineChart>
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
                  );
                })()}

                <DialogFooter>
                  <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                    Fechar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Specifications Tab */}
          <TabsContent value="specifications" className="m-0 space-y-6">
            {/* Photo and Info */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  <CardTitle>Fotografia da OAE</CardTitle>
                </div>
                <CardDescription>Registro visual atualizado da estrutura</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-[21/9] overflow-hidden rounded-lg bg-muted">
                  {bridge.image ? (
                    <img src={bridge.image} alt={bridge.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Activity className="h-12 w-12 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                  <span>Última atualização: {format(new Date(bridge.lastUpdate), 'dd/MM/yyyy', { locale: ptBR })}</span>
                  <span>{bridge.typology} em {bridge.material.toLowerCase()}</span>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Gerais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Comprimento</p>
                      <p className="text-xl font-bold">{bridge.length}m</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Largura</p>
                      <p className="text-xl font-bold">{bridge.width || 12.5}m</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Número de Apoios</p>
                      <p className="text-xl font-bold">{bridge.supportCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Ano de Construção</p>
                      <p className="text-xl font-bold">{bridge.constructionYear || 1998}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Tipologia</p>
                      <p className="font-semibold">{bridge.typology} em {bridge.material.toLowerCase()}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Material</p>
                      <p className="font-semibold">{bridge.material}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Capacidade</p>
                      <p className="font-semibold">{bridge.capacity || 450} ton</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Última Intervenção Maior</p>
                      <p className="font-semibold">{bridge.lastMajorIntervention ? format(new Date(bridge.lastMajorIntervention), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Criticidade e Impacto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Nível de Criticidade</p>
                    <Badge className={getCriticalityBadge(bridge.operationalCriticality).className}>
                      {getCriticalityBadge(bridge.operationalCriticality).label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Impacto Operacional</p>
                    <p className="font-semibold">Alto - {bridge.operationalImpact || 'Via principal de acesso'}</p>
                  </div>
                  {needsIntervention && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                      <TriangleAlert className="h-5 w-5 mt-0.5" />
                      <div>
                        <p className="font-semibold">Necessidade de Interdição</p>
                        <p className="text-sm opacity-80">Baseado na criticidade dos sensores e nível de impacto operacional.</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Geo-referenced Image */}
            <Card>
              <CardHeader>
                <CardTitle>Imagem Georreferenciada</CardTitle>
                <CardDescription>Localização via Google Earth</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-[21/9] overflow-hidden rounded-lg bg-muted relative">
                  <img 
                    src="https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=1200" 
                    alt="Mapa georreferenciado" 
                    className="h-full w-full object-cover" 
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white bg-black/50 p-4 rounded-lg">
                      <p className="font-mono text-lg">SP-348_042+563_S_(PI)</p>
                      <div className="w-8 h-8 mx-auto my-2">
                        <MapPin className="w-full h-full text-yellow-400" />
                      </div>
                      <p className="font-mono text-lg">SP-348_042+563_N_(PI)</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Technical Integrations */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <div>
                    <CardTitle>Integrações Técnicas</CardTitle>
                    <CardDescription>Acesso centralizado aos documentos técnicos da OAE e integrações com sistemas corporativos.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {documents.map((doc) => {
                    const iconMap: Record<string, any> = {
                      project: FileText,
                      report: FileText,
                      video: Video,
                      bim: Box,
                      cde: LinkIcon,
                      api: Zap,
                    };
                    const Icon = iconMap[doc.type] || FileText;
                    const actionLabel = doc.type === 'cde' ? 'Acessar' : doc.type === 'api' ? (doc.status === 'connected' ? 'Conectado' : 'Conectar') : doc.type === 'bim' ? 'Em Breve' : 'Ver Pasta';
                    
                    // Mock files for each folder type
                    const getMockFiles = (docType: string, docName: string) => {
                      const filesByType: Record<string, Array<{name: string; size: string; date: string; type: string}>> = {
                        project: [
                          { name: 'Projeto_Estrutural_v3.pdf', size: '15.2 MB', date: '15/03/2021', type: 'pdf' },
                          { name: 'Planta_Baixa.dwg', size: '8.7 MB', date: '15/03/2021', type: 'dwg' },
                          { name: 'Cortes_Transversais.dwg', size: '5.3 MB', date: '12/03/2021', type: 'dwg' },
                          { name: 'Memorial_Calculos.pdf', size: '3.8 MB', date: '10/03/2021', type: 'pdf' },
                          { name: 'Detalhes_Armadura.pdf', size: '2.1 MB', date: '08/03/2021', type: 'pdf' },
                        ],
                        report: [
                          { name: 'Relatorio_Inspecao_2025.pdf', size: '12.5 MB', date: '10/01/2025', type: 'pdf' },
                          { name: 'Relatorio_Inspecao_2024.pdf', size: '11.2 MB', date: '15/06/2024', type: 'pdf' },
                          { name: 'Relatorio_Inspecao_2023.pdf', size: '10.8 MB', date: '20/07/2023', type: 'pdf' },
                          { name: 'Relatorio_Inspecao_2022.pdf', size: '9.5 MB', date: '18/08/2022', type: 'pdf' },
                          { name: 'Relatorio_Inspecao_2021.pdf', size: '8.9 MB', date: '22/09/2021', type: 'pdf' },
                          { name: 'Relatorio_Inspecao_2020.pdf', size: '7.6 MB', date: '14/10/2020', type: 'pdf' },
                        ],
                        video: [
                          { name: 'Inspecao_Drone_Jan2025.mp4', size: '245 MB', date: '15/01/2025', type: 'mp4' },
                          { name: 'Inspecao_Drone_Jul2024.mp4', size: '312 MB', date: '20/07/2024', type: 'mp4' },
                          { name: 'Inspecao_Subaquatica_2024.mp4', size: '189 MB', date: '05/05/2024', type: 'mp4' },
                          { name: 'Voo_Panoramico_2024.mp4', size: '156 MB', date: '10/03/2024', type: 'mp4' },
                        ],
                      };
                      return filesByType[docType] || [];
                    };
                    
                    const handleFolderClick = () => {
                      if (['project', 'report', 'video'].includes(doc.type)) {
                        setSelectedFolder({
                          name: doc.name,
                          type: doc.type,
                          files: getMockFiles(doc.type, doc.name)
                        });
                      } else if (doc.type === 'cde' && doc.url) {
                        window.open(doc.url, '_blank');
                      }
                    };
                    
                    return (
                      <div key={doc.id} className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded",
                            doc.type === 'api' && doc.status === 'connected' ? 'bg-destructive/10 text-destructive' : 'bg-muted'
                          )}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">{doc.description}</p>
                          </div>
                        </div>
                        <Button 
                          variant={doc.status === 'connected' ? 'outline' : 'outline'} 
                          size="sm"
                          className={cn(
                            doc.status === 'connected' && 'border-success text-success hover:bg-success/10',
                            doc.status === 'pending' && 'opacity-50'
                          )}
                          disabled={doc.status === 'pending'}
                          onClick={handleFolderClick}
                        >
                          {actionLabel}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Folder Contents Dialog */}
            <Dialog open={!!selectedFolder} onOpenChange={() => setSelectedFolder(null)}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5 text-primary" />
                    {selectedFolder?.name}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedFolder?.files.length} arquivo(s) disponível(is)
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {selectedFolder?.files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded",
                          file.type === 'pdf' ? 'bg-destructive/10 text-destructive' :
                          file.type === 'dwg' ? 'bg-primary/10 text-primary' :
                          file.type === 'mp4' ? 'bg-purple-500/10 text-purple-600' :
                          'bg-muted'
                        )}>
                          {file.type === 'mp4' ? <Video className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{file.size} • {file.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-8">
                          <Eye className="h-4 w-4 mr-1" />
                          Visualizar
                        </Button>
                        <Button variant="outline" size="sm" className="h-8">
                          <Download className="h-4 w-4 mr-1" />
                          Baixar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSelectedFolder(null)}>
                    Fechar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Cameras Tab */}
          <TabsContent value="cameras" className="m-0 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  <div>
                    <CardTitle>Sistema de Câmeras</CardTitle>
                    <CardDescription>Monitoramento visual em tempo real da estrutura</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {mockBridgeCameras.map((camera) => (
                    <div key={camera.id} className="relative aspect-video overflow-hidden rounded-lg bg-muted group">
                      <img 
                        src={camera.image} 
                        alt={camera.name} 
                        className="h-full w-full object-cover transition-transform group-hover:scale-105" 
                      />
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-destructive text-destructive-foreground flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                          AO VIVO
                        </Badge>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                        <p className="font-medium text-white">{camera.name}</p>
                        <p className="text-sm text-white/70">{camera.location}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm">
                    <span className="font-medium text-primary">Sistema em desenvolvimento:</span>{' '}
                    <span className="text-muted-foreground">
                      As câmeras serão instaladas para monitoramento 24/7 da estrutura, permitindo inspeção visual remota e detecção de anomalias.
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Service Dashboard Tab */}
          <TabsContent value="service" className="m-0 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TriangleAlert className="h-5 w-5" />
                  <div>
                    <CardTitle>Dashboard Operacional</CardTitle>
                    <CardDescription>Histórico de problemas estruturais e status dos elementos desta ponte</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* KPI Cards */}
                <div className="grid gap-4 md:grid-cols-4 mb-6">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Problemas Detectados</p>
                          <p className="text-3xl font-bold">{bridgeProblems.length || 3}</p>
                          <p className="text-xs text-muted-foreground">Últimos 90 dias</p>
                        </div>
                        <TriangleAlert className="h-5 w-5 text-warning" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Manutenções Pendentes</p>
                          <p className="text-3xl font-bold">2</p>
                          <p className="text-xs text-muted-foreground">Requer atenção</p>
                        </div>
                        <Wrench className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Interdições Parciais</p>
                          <p className="text-3xl font-bold">0</p>
                          <p className="text-xs text-muted-foreground">Faixas bloqueadas</p>
                        </div>
                        <XCircle className="h-5 w-5 text-destructive" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Inspeções Realizadas</p>
                          <p className="text-3xl font-bold">12</p>
                          <p className="text-xs text-muted-foreground">Últimos 180 dias</p>
                        </div>
                        <CheckCircle className="h-5 w-5 text-success" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Structural Problems */}
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Registro de Problemas Estruturais (Últimos 90 dias)</h4>
                  <div className="space-y-3">
                    {bridgeProblems.slice(0, 3).map((problem) => (
                      <div key={problem.id} className="flex items-center justify-between rounded-lg border p-4">
                        <div className="grid grid-cols-3 gap-8 flex-1">
                          <div>
                            <p className="text-xs text-muted-foreground">Tipo</p>
                            <Badge variant="outline" className="mt-1">{problem.type}</Badge>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Descrição</p>
                            <p className="text-sm">{problem.description}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Data</p>
                            <p className="text-sm">{format(new Date(problem.date), 'dd/MM/yyyy', { locale: ptBR })}</p>
                          </div>
                        </div>
                        <Badge className={getProblemStatusConfig(problem.status).className}>
                          {problem.status}
                        </Badge>
                      </div>
                    ))}
                    {bridgeProblems.length === 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                          <div className="grid grid-cols-3 gap-8 flex-1">
                            <div>
                              <p className="text-xs text-muted-foreground">Tipo</p>
                              <Badge variant="outline" className="mt-1">Fissura</Badge>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Descrição</p>
                              <p className="text-sm">Fissura longitudinal na viga V2, extensão 1.8m</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Data</p>
                              <p className="text-sm">22/12/2025</p>
                            </div>
                          </div>
                          <Badge className="bg-primary text-primary-foreground">Em Análise</Badge>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-4">
                          <div className="grid grid-cols-3 gap-8 flex-1">
                            <div>
                              <p className="text-xs text-muted-foreground">Tipo</p>
                              <Badge variant="outline" className="mt-1">Desgaste</Badge>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Descrição</p>
                              <p className="text-sm">Desgaste superficial no tabuleiro, trecho 0+085</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Data</p>
                              <p className="text-sm">14/12/2025</p>
                            </div>
                          </div>
                          <Badge className="bg-orange-500 text-white">Agendado</Badge>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-4">
                          <div className="grid grid-cols-3 gap-8 flex-1">
                            <div>
                              <p className="text-xs text-muted-foreground">Tipo</p>
                              <Badge variant="outline" className="mt-1">Limpeza</Badge>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Descrição</p>
                              <p className="text-sm">Acúmulo de detritos no sistema de drenagem</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Data</p>
                              <p className="text-sm">05/12/2025</p>
                            </div>
                          </div>
                          <Badge className="bg-success text-success-foreground">Corrigido</Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service Dashboard */}
            <Card>
              <CardHeader>
                <CardTitle>Dashboard de Serviço</CardTitle>
                <CardDescription>Métricas operacionais e indicadores de desempenho</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3 mb-6">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Uptime do Sistema</p>
                      <p className="text-2xl font-bold text-success">99.8%</p>
                      <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Sensores Ativos</p>
                      <p className="text-2xl font-bold text-primary">{bridge.sensorCount}/{bridge.sensorCount}</p>
                      <p className="text-xs text-muted-foreground">Funcionando normalmente</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Alertas Pendentes</p>
                      <p className="text-2xl font-bold text-warning">2</p>
                      <p className="text-xs text-muted-foreground">Requerem atenção</p>
                    </CardContent>
                  </Card>
                </div>

                <h4 className="font-medium mb-3">Status dos Serviços</h4>
                <div className="space-y-2">
                  {serviceStatuses.map((service, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          service.status === 'online' ? 'bg-success' : service.status === 'attention' ? 'bg-warning' : 'bg-destructive'
                        )} />
                        <div>
                          <p className="font-medium">{service.name}</p>
                          <p className="text-xs text-muted-foreground">{service.description}</p>
                        </div>
                      </div>
                      <Badge className={getStatusConfig(service.status).className}>
                        {service.status === 'online' ? 'Online' : service.status === 'attention' ? 'Atenção' : 'Offline'}
                      </Badge>
                    </div>
                  ))}
                </div>

                <h4 className="font-medium mb-3 mt-6">Eventos Recentes do Sistema</h4>
                <div className="space-y-2">
                  {systemEvents.map((event, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground font-mono">{event.time}</span>
                      <span>{event.description}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedules Tab */}
          <TabsContent value="schedules" className="m-0 space-y-4">
            {/* Header with actions */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Programações e Intervenções</h3>
                <p className="text-sm text-muted-foreground">{bridgeInterventions.length} intervenções agendadas para esta ponte</p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    exportInterventions(bridgeInterventions);
                    toast.success('Exportação iniciada!');
                  }}
                  disabled={bridgeInterventions.length === 0}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Exportar CSV
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const report = generateBridgeReport(bridge, sensors, events, bridgeInterventions, bridgeProblems);
                    exportToJSON(report, `relatorio_${bridge.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`);
                    toast.success('Relatório JSON gerado!');
                  }}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Relatório JSON
                </Button>
                {canEdit && (
                  <Button size="sm" onClick={() => setIsCreateInterventionOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Nova Intervenção
                  </Button>
                )}
              </div>
            </div>

            {/* Interventions List */}
            {bridgeInterventions.length > 0 ? (
              bridgeInterventions.map((item) => (
                <Card key={item.id} className="group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{item.type}</h3>
                          <Badge className={getPriorityConfig(item.priority).className}>
                            {item.priority}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mb-2">{item.description}</p>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>Duração: {item.estimatedDuration}</span>
                          <span>Equipe: {item.team}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="text-right">
                          <p className="font-medium">{format(new Date(item.scheduledDate), 'dd/MM/yyyy', { locale: ptBR })}</p>
                          <Badge variant="outline" className="mt-1">Agendada</Badge>
                        </div>
                        {canEdit && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => setEditingIntervention({
                                id: item.id,
                                bridgeId: item.bridgeId,
                                priority: item.priority,
                                type: item.type,
                                description: item.description,
                                scheduledDate: item.scheduledDate,
                                estimatedDuration: item.estimatedDuration,
                                team: item.team,
                              })}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteInterventionId(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="font-semibold mb-2">Nenhuma intervenção agendada</h3>
                  <p className="text-muted-foreground mb-4">Crie uma nova intervenção para esta ponte.</p>
                  {canEdit && (
                    <Button onClick={() => setIsCreateInterventionOpen(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Criar primeira intervenção
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </div>
      </Tabs>

      {/* Create Intervention Dialog */}
      <CreateInterventionDialog
        open={isCreateInterventionOpen}
        onOpenChange={setIsCreateInterventionOpen}
        onSubmit={(data) => {
          addIntervention(data);
          toast.success('Intervenção criada com sucesso!');
        }}
        defaultBridgeId={id}
      />

      {/* Edit Intervention Dialog */}
      {editingIntervention && (
        <CreateInterventionDialog
          open={!!editingIntervention}
          onOpenChange={(open) => !open && setEditingIntervention(null)}
          onSubmit={(data) => {
            updateIntervention(editingIntervention.id, data);
            setEditingIntervention(null);
            toast.success('Intervenção atualizada com sucesso!');
          }}
          editData={editingIntervention}
          defaultBridgeId={id}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteInterventionId} onOpenChange={(open) => !open && setDeleteInterventionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta intervenção? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (deleteInterventionId) {
                  deleteIntervention(deleteInterventionId);
                  setDeleteInterventionId(null);
                  toast.success('Intervenção excluída com sucesso!');
                }
              }} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
