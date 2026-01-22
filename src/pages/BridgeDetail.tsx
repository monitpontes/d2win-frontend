import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockBridges, getSensorsByBridge, getEventsByBridge, getCamerasByBridge, getSchedulesByBridge, getDocumentsByBridge, mockSystemStatus } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Activity, FileText, Camera, Settings, Calendar, MapPin, AlertTriangle, Wifi, WifiOff, Play, RefreshCw, FileUp, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function BridgeDetail() {
  const { id } = useParams<{ id: string }>();
  const { hasRole } = useAuth();
  const [selectedTab, setSelectedTab] = useState('monitoring');

  const bridge = useMemo(() => mockBridges.find((b) => b.id === id), [id]);
  const sensors = useMemo(() => getSensorsByBridge(id || ''), [id]);
  const events = useMemo(() => getEventsByBridge(id || ''), [id]);
  const cameras = useMemo(() => getCamerasByBridge(id || ''), [id]);
  const schedules = useMemo(() => getSchedulesByBridge(id || ''), [id]);
  const documents = useMemo(() => getDocumentsByBridge(id || ''), [id]);

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

  // Generate mock chart data
  const chartData = Array.from({ length: 24 }, (_, i) => ({
    time: `${String(i).padStart(2, '0')}:00`,
    frequencyX: 2.3 + Math.random() * 0.4,
    frequencyZ: 2.1 + Math.random() * 0.3,
    accelerationX: 0.03 + Math.random() * 0.02,
    accelerationY: 0.02 + Math.random() * 0.015,
    accelerationZ: 0.04 + Math.random() * 0.025,
  }));

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      normal: { label: 'Normal', className: 'bg-success text-success-foreground' },
      alert: { label: 'Alerta', className: 'bg-warning text-warning-foreground' },
      critical: { label: 'Crítico', className: 'bg-destructive text-destructive-foreground' },
      online: { label: 'Online', className: 'bg-success text-success-foreground' },
      offline: { label: 'Offline', className: 'bg-muted text-muted-foreground' },
      maintenance: { label: 'Manutenção', className: 'bg-warning text-warning-foreground' },
      planned: { label: 'Planejada', className: 'bg-info text-info-foreground' },
      in_progress: { label: 'Em Andamento', className: 'bg-warning text-warning-foreground' },
      completed: { label: 'Concluída', className: 'bg-success text-success-foreground' },
    };
    return configs[status] || { label: status, className: 'bg-muted' };
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

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="border-b bg-card p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{bridge.name}</h1>
                <Badge className={getStatusConfig(bridge.structuralStatus).className}>
                  {getStatusConfig(bridge.structuralStatus).label}
                </Badge>
              </div>
              <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {bridge.location}
                </span>
                <span>Concessão: {bridge.concession}</span>
                <span>{bridge.sensorCount} sensores</span>
              </div>
            </div>
          </div>
          {bridge.hasActiveAlerts && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Alertas Ativos</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1">
        <div className="border-b bg-card px-6">
          <TabsList className="h-12 bg-transparent">
            <TabsTrigger value="monitoring" className="data-[state=active]:bg-muted">
              <Activity className="mr-2 h-4 w-4" />
              Monitoramento
            </TabsTrigger>
            <TabsTrigger value="specifications" className="data-[state=active]:bg-muted">
              <FileText className="mr-2 h-4 w-4" />
              Especificações
            </TabsTrigger>
            <TabsTrigger value="cameras" className="data-[state=active]:bg-muted">
              <Camera className="mr-2 h-4 w-4" />
              Câmeras
            </TabsTrigger>
            <TabsTrigger value="service" className="data-[state=active]:bg-muted">
              <Settings className="mr-2 h-4 w-4" />
              Dashboard de Serviço
            </TabsTrigger>
            <TabsTrigger value="schedules" className="data-[state=active]:bg-muted">
              <Calendar className="mr-2 h-4 w-4" />
              Programações
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="p-6">
          {/* Monitoring Tab */}
          <TabsContent value="monitoring" className="m-0 space-y-6">
            {/* Digital Twin Section */}
            <Card>
              <CardHeader>
                <CardTitle>Gêmeo Digital - Visualização 3D</CardTitle>
                <CardDescription>Visualização interativa dos sensores na estrutura</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative h-64 rounded-lg bg-muted">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Activity className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Visualização 3D da estrutura
                      </p>
                      <p className="text-xs text-muted-foreground">
                        (Em desenvolvimento)
                      </p>
                    </div>
                  </div>
                  {/* Sensor Markers */}
                  {sensors.slice(0, 3).map((sensor, i) => (
                    <div
                      key={sensor.id}
                      className={cn(
                        'absolute flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-card bg-primary text-xs font-bold text-primary-foreground shadow-lg transition-transform hover:scale-110',
                        sensor.status === 'offline' && 'bg-muted-foreground'
                      )}
                      style={{
                        left: `${20 + i * 30}%`,
                        top: `${40 + (i % 2) * 20}%`,
                      }}
                      title={`${sensor.name} - ${sensor.status}`}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Frequência - Últimas 24h</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="time" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="frequencyX" stroke="hsl(var(--chart-1))" name="Eixo X" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="frequencyZ" stroke="hsl(var(--chart-2))" name="Eixo Z" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Aceleração - Últimas 24h</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="time" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="accelerationX" stroke="hsl(var(--chart-1))" name="X" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="accelerationY" stroke="hsl(var(--chart-2))" name="Y" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="accelerationZ" stroke="hsl(var(--chart-3))" name="Z" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Events Table */}
            <Card>
              <CardHeader>
                <CardTitle>Eventos e Anomalias</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Sensor</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Severidade</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.length > 0 ? (
                      events.map((event) => {
                        const sensor = sensors.find((s) => s.id === event.sensorId);
                        const severityConfig = getSeverityConfig(event.severity);
                        const statusConfig = getStatusConfig(event.status);
                        return (
                          <TableRow key={event.id}>
                            <TableCell className="text-sm">
                              {format(new Date(event.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </TableCell>
                            <TableCell>{sensor?.name || event.sensorId}</TableCell>
                            <TableCell className="capitalize">{event.type}</TableCell>
                            <TableCell>{event.description}</TableCell>
                            <TableCell>
                              <span className={severityConfig.className}>
                                {severityConfig.label}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={statusConfig.className}>
                                {event.status === 'new' ? 'Novo' : event.status === 'acknowledged' ? 'Reconhecido' : 'Resolvido'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          Nenhum evento registrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Specifications Tab */}
          <TabsContent value="specifications" className="m-0 space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Imagem da Ponte</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video overflow-hidden rounded-lg bg-muted">
                    {bridge.image ? (
                      <img src={bridge.image} alt={bridge.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Activity className="h-12 w-12 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Informações Técnicas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">Localização</span>
                      <span className="font-medium">{bridge.location}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">Concessão</span>
                      <span className="font-medium">{bridge.concession}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">Comprimento</span>
                      <span className="font-medium">{bridge.length}m</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">Material</span>
                      <span className="font-medium">{bridge.material}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">Tipo de Viga</span>
                      <span className="font-medium">{bridge.beamType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tipo de Vão</span>
                      <span className="font-medium">{bridge.spanType}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Documents */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Documentos</CardTitle>
                  <CardDescription>Projetos, relatórios e arquivos relacionados</CardDescription>
                </div>
                {canEdit && (
                  <Button variant="outline" size="sm">
                    <FileUp className="mr-2 h-4 w-4" />
                    Upload
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Enviado em {format(new Date(doc.uploadedAt), 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {documents.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      Nenhum documento disponível
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cameras Tab */}
          <TabsContent value="cameras" className="m-0">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {cameras.map((camera) => (
                <Card key={camera.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{camera.name}</CardTitle>
                      <Badge variant="outline" className={camera.status === 'online' ? 'border-success text-success' : 'border-muted text-muted-foreground'}>
                        {camera.status === 'online' ? <Wifi className="mr-1 h-3 w-3" /> : <WifiOff className="mr-1 h-3 w-3" />}
                        {camera.status === 'online' ? 'Online' : 'Offline'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
                      {camera.thumbnail ? (
                        <img src={camera.thumbnail} alt={camera.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Camera className="h-12 w-12 text-muted-foreground/50" />
                        </div>
                      )}
                      {camera.status === 'online' && (
                        <Button size="sm" className="absolute bottom-2 right-2" variant="secondary">
                          <Play className="mr-1 h-3 w-3" />
                          Ao Vivo
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {cameras.length === 0 && (
                <Card className="col-span-full">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Camera className="h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-2 text-muted-foreground">Nenhuma câmera configurada</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Service Dashboard Tab */}
          <TabsContent value="service" className="m-0 space-y-6">
            {/* System Status */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-full',
                    mockSystemStatus.power === 'ok' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                  )}>
                    <Activity className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Energia</p>
                    <p className="text-lg font-semibold capitalize">{mockSystemStatus.power === 'ok' ? 'Normal' : 'Alerta'}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-full',
                    mockSystemStatus.communication === 'ok' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                  )}>
                    <Wifi className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Comunicação</p>
                    <p className="text-lg font-semibold capitalize">{mockSystemStatus.communication === 'ok' ? 'Normal' : 'Alerta'}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Activity className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sensores</p>
                    <p className="text-lg font-semibold">
                      {mockSystemStatus.sensors.online} online / {mockSystemStatus.sensors.offline} offline
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Failures */}
            <Card>
              <CardHeader>
                <CardTitle>Falhas Detectadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockSystemStatus.failures.map((failure) => (
                    <div key={failure.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className={cn('h-5 w-5', getSeverityConfig(failure.severity).className)} />
                        <div>
                          <p className="font-medium">{failure.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(failure.timestamp), { addSuffix: true, locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className={getSeverityConfig(failure.severity).className}>
                        {getSeverityConfig(failure.severity).label}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Ações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Button variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reiniciar Dispositivo
                  </Button>
                  <Button variant="outline">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Abrir Chamado
                  </Button>
                  <Button variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Gerar Relatório
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedules Tab */}
          <TabsContent value="schedules" className="m-0">
            <Card>
              <CardHeader>
                <CardTitle>Programações</CardTitle>
                <CardDescription>Inspeções e manutenções agendadas</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Data Agendada</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schedules.map((schedule) => {
                      const statusConfig = getStatusConfig(schedule.status);
                      return (
                        <TableRow key={schedule.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{schedule.title}</p>
                              {schedule.description && (
                                <p className="text-xs text-muted-foreground">{schedule.description}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="capitalize">
                            {schedule.type === 'inspection' ? 'Inspeção' : 'Manutenção'}
                          </TableCell>
                          <TableCell>
                            {format(new Date(schedule.scheduledDate), 'dd/MM/yyyy', { locale: ptBR })}
                          </TableCell>
                          <TableCell>{schedule.responsibleUser}</TableCell>
                          <TableCell>
                            <Badge className={statusConfig.className}>
                              {statusConfig.label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {schedules.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          Nenhuma programação registrada
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
