import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { mockBridges, mockUsers, mockSensors, mockEvents, mockCompanies, mockSystemStatus } from '@/data/mockData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { BarChart3, Users, Activity, AlertTriangle, Settings, FileDown, Plus, Pencil, Trash2, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Admin() {
  const { hasRole } = useAuth();
  const [selectedTab, setSelectedTab] = useState('overview');

  const isAdmin = hasRole('admin');

  // Stats
  const stats = {
    bridges: mockBridges.length,
    alertsActive: mockEvents.filter((e) => e.status !== 'resolved').length,
    sensorsOnline: mockSystemStatus.sensors.online,
    sensorsOffline: mockSystemStatus.sensors.offline,
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Administrador',
      gestor: 'Engenheiro',
      viewer: 'Visualizador',
    };
    return labels[role] || role;
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      active: { label: 'Ativo', className: 'bg-success text-success-foreground' },
      inactive: { label: 'Inativo', className: 'bg-muted text-muted-foreground' },
      online: { label: 'Online', className: 'bg-success text-success-foreground' },
      offline: { label: 'Offline', className: 'bg-muted text-muted-foreground' },
      maintenance: { label: 'Manutenção', className: 'bg-warning text-warning-foreground' },
    };
    const config = configs[status] || { label: status, className: 'bg-muted' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Administração</h1>
        <p className="text-muted-foreground">Gerencie usuários, dispositivos e configurações do sistema</p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">
            <BarChart3 className="mr-2 h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="mr-2 h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="devices">
            <Settings className="mr-2 h-4 w-4" />
            Dispositivos
          </TabsTrigger>
          <TabsTrigger value="export">
            <FileDown className="mr-2 h-4 w-4" />
            Exportação
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.bridges}</p>
                  <p className="text-sm text-muted-foreground">Pontes Monitoradas</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.alertsActive}</p>
                  <p className="text-sm text-muted-foreground">Alertas Ativos</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.sensorsOnline}</p>
                  <p className="text-sm text-muted-foreground">Sensores Online</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.sensorsOffline}</p>
                  <p className="text-sm text-muted-foreground">Sensores Offline</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Failures */}
          <Card>
            <CardHeader>
              <CardTitle>Falhas do Sistema</CardTitle>
              <CardDescription>Últimas falhas detectadas no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockSystemStatus.failures.map((failure) => (
                  <div key={failure.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className={cn(
                        'h-5 w-5',
                        failure.severity === 'high' || failure.severity === 'critical' ? 'text-destructive' : 'text-warning'
                      )} />
                      <div>
                        <p className="font-medium">{failure.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(failure.timestamp).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={failure.severity === 'high' ? 'text-destructive' : 'text-warning'}>
                      {failure.severity === 'high' ? 'Alta' : failure.severity === 'medium' ? 'Média' : 'Baixa'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Usuários</CardTitle>
                <CardDescription>Gerenciamento de usuários do sistema</CardDescription>
              </div>
              {isAdmin && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Novo Usuário
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Novo Usuário</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome</Label>
                        <Input id="name" placeholder="Nome completo" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input id="email" type="email" placeholder="email@empresa.com" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Perfil</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um perfil" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">Visualizador</SelectItem>
                            <SelectItem value="gestor">Engenheiro</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company">Empresa</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma empresa" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockCompanies.map((company) => (
                              <SelectItem key={company.id} value={company.id}>
                                {company.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button className="w-full">Salvar</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockUsers.map((user) => {
                    const company = mockCompanies.find((c) => c.id === user.companyId);
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{getRoleLabel(user.role)}</TableCell>
                        <TableCell>{company?.name || '-'}</TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {isAdmin && (
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Devices Tab */}
        <TabsContent value="devices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dispositivos e Sensores</CardTitle>
              <CardDescription>Configuração de sensores e parâmetros</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Ponte</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Intervalo (ms)</TableHead>
                    <TableHead>Limite Alerta</TableHead>
                    <TableHead>Limite Crítico</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockSensors.map((sensor) => {
                    const bridge = mockBridges.find((b) => b.id === sensor.bridgeId);
                    return (
                      <TableRow key={sensor.id}>
                        <TableCell className="font-medium">{sensor.name}</TableCell>
                        <TableCell>{bridge?.name || '-'}</TableCell>
                        <TableCell className="capitalize">
                          {sensor.type === 'acceleration' ? 'Aceleração' : sensor.type === 'frequency' ? 'Frequência' : 'Caixa Comando'}
                        </TableCell>
                        <TableCell>{getStatusBadge(sensor.status)}</TableCell>
                        <TableCell>{sensor.acquisitionInterval}</TableCell>
                        <TableCell>{sensor.alertThreshold} {sensor.lastReading.unit}</TableCell>
                        <TableCell>{sensor.criticalThreshold} {sensor.lastReading.unit}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Exportação de Dados</CardTitle>
              <CardDescription>Exporte dados do sistema em diferentes formatos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">Dados de Sensores</h3>
                        <p className="text-sm text-muted-foreground">Exportar leituras dos sensores</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          CSV
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          JSON
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">Eventos e Alertas</h3>
                        <p className="text-sm text-muted-foreground">Exportar histórico de eventos</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          CSV
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          JSON
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Gerar Relatório</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Ponte</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma ponte" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          {mockBridges.map((bridge) => (
                            <SelectItem key={bridge.id} value={bridge.id}>
                              {bridge.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Período</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o período" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7d">Últimos 7 dias</SelectItem>
                          <SelectItem value="30d">Últimos 30 dias</SelectItem>
                          <SelectItem value="90d">Últimos 90 dias</SelectItem>
                          <SelectItem value="custom">Personalizado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Formato</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o formato" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="excel">Excel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button>
                    <FileDown className="mr-2 h-4 w-4" />
                    Gerar Relatório
                  </Button>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
