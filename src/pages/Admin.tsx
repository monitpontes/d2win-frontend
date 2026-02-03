import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { mockBridges, mockUsers, mockSensors, mockCompanies } from '@/data/mockData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Building2, Users, Settings, Zap, Plus, Pencil, Trash2, Eye, Search, 
  CheckCircle, AlertTriangle, XCircle, Clock, Mail, Shield, UserCheck, UserX
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { BridgeDetailsDialog } from '@/components/admin/BridgeDetailsDialog';
import { DeviceParametersDialog } from '@/components/admin/DeviceParametersDialog';
import { EditUserDialog } from '@/components/admin/EditUserDialog';
import { toast } from 'sonner';
import type { Bridge, Sensor, User } from '@/types';

// Mock system failures data
const mockSystemFailures = [
  { id: 1, bridgeName: 'Ponte Rio Grande', type: 'Energia', sensor: 'TEMP-001', problem: 'Alta temperatura detectada no sensor.', time: '26/10/2023, 07:00:00', status: 'Resolvido' },
  { id: 2, bridgeName: 'Ponte Ayrton Senna', type: 'Comunicação', sensor: 'VIB-005', problem: 'Perda de conexão com o sensor.', time: '20/10/2023, 11:30:00', status: 'Pendente' },
  { id: 3, bridgeName: 'Ponte Rio Grande', type: 'Sensor', sensor: 'ACEL-002', problem: 'Leitura de aceleração inconsistente.', time: '15/10/2023, 05:15:00', status: 'Em andamento' },
  { id: 4, bridgeName: 'Ponte Bandeirantes', type: 'Energia', sensor: 'TEMP-003', problem: 'Consumo de energia anormalmente alto.', time: '01/10/2023, 15:00:00', status: 'Pendente' },
];

export default function Admin() {
  const { hasRole } = useAuth();
  const [selectedTab, setSelectedTab] = useState('bridges');
  const [selectedCompanyId, setSelectedCompanyId] = useState('company-2');
  const [searchBridge, setSearchBridge] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  
  // Dialog states
  const [selectedBridge, setSelectedBridge] = useState<Bridge | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Sensor | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isNewUserOpen, setIsNewUserOpen] = useState(false);
  const [isNewBridgeOpen, setIsNewBridgeOpen] = useState(false);
  const [isNewDeviceOpen, setIsNewDeviceOpen] = useState(false);

  const isAdmin = hasRole('admin');
  const selectedCompany = mockCompanies.find(c => c.id === selectedCompanyId);

  // Filter data by selected company
  const companyBridges = useMemo(() => {
    return mockBridges.filter(b => b.companyId === selectedCompanyId);
  }, [selectedCompanyId]);

  const companyUsers = useMemo(() => {
    let users = mockUsers.filter(u => u.companyId === selectedCompanyId);
    
    if (searchUser) {
      users = users.filter(u => 
        u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
        u.email.toLowerCase().includes(searchUser.toLowerCase())
      );
    }
    
    if (roleFilter !== 'all') {
      users = users.filter(u => u.role === roleFilter);
    }
    
    return users;
  }, [selectedCompanyId, searchUser, roleFilter]);

  const companyDevices = useMemo(() => {
    const bridgeIds = companyBridges.map(b => b.id);
    return mockSensors.filter(s => bridgeIds.includes(s.bridgeId));
  }, [companyBridges]);

  // Filter bridges by search and status
  const filteredBridges = useMemo(() => {
    return companyBridges.filter(b => {
      const matchesSearch = b.name.toLowerCase().includes(searchBridge.toLowerCase());
      const matchesStatus = statusFilter === 'all' || b.structuralStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [companyBridges, searchBridge, statusFilter]);

  // User stats
  const userStats = useMemo(() => {
    const allUsers = mockUsers.filter(u => u.companyId === selectedCompanyId);
    return {
      total: allUsers.length,
      active: allUsers.filter(u => u.status === 'active').length,
      inactive: allUsers.filter(u => u.status === 'inactive').length,
      admins: allUsers.filter(u => u.role === 'admin').length,
      gestores: allUsers.filter(u => u.role === 'gestor').length,
      viewers: allUsers.filter(u => u.role === 'viewer').length,
    };
  }, [selectedCompanyId]);

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      operacional: { label: 'Normal', className: 'bg-success text-success-foreground' },
      atencao: { label: 'Alerta', className: 'bg-warning text-warning-foreground' },
      restricoes: { label: 'Alerta', className: 'bg-warning text-warning-foreground' },
      critico: { label: 'Crítica', className: 'bg-destructive text-destructive-foreground' },
      interdicao: { label: 'Crítica', className: 'bg-destructive text-destructive-foreground' },
      active: { label: 'Ativo', className: 'bg-success text-success-foreground' },
      inactive: { label: 'Inativo', className: 'bg-muted text-muted-foreground' },
      online: { label: 'Normal', className: 'bg-success text-success-foreground' },
      offline: { label: 'Offline', className: 'bg-muted text-muted-foreground' },
      maintenance: { label: 'Alerta', className: 'bg-warning text-warning-foreground' },
    };
    const config = configs[status] || { label: status, className: 'bg-muted' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getFailureStatusBadge = (status: string) => {
    const configs: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      'Resolvido': { label: 'Resolvido', className: 'text-success', icon: <CheckCircle className="h-4 w-4" /> },
      'Pendente': { label: 'Pendente', className: 'text-warning', icon: <AlertTriangle className="h-4 w-4" /> },
      'Em andamento': { label: 'Em andamento', className: 'text-primary', icon: <Zap className="h-4 w-4" /> },
    };
    const config = configs[status] || { label: status, className: '', icon: null };
    return (
      <span className={cn("flex items-center gap-1 text-sm", config.className)}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'Energia': 'bg-warning/10 text-warning border-warning',
      'Comunicação': 'bg-primary/10 text-primary border-primary',
      'Sensor': 'bg-muted',
    };
    return colors[type] || 'bg-muted';
  };

  const getRoleBadge = (role: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      admin: { label: 'Admin', className: 'bg-primary/10 text-primary' },
      gestor: { label: 'Gestor', className: 'bg-muted' },
      viewer: { label: 'Viewer', className: 'bg-muted' },
    };
    const config = configs[role] || { label: role, className: 'bg-muted' };
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
  };

  // System performance stats
  const systemStats = {
    energy: { percentage: 98.5, failures: 2 },
    communication: { percentage: 96.8, failures: 5 },
    sensors: { percentage: 97.2, failures: 4 },
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <AdminSidebar 
        selectedCompanyId={selectedCompanyId} 
        onSelectCompany={setSelectedCompanyId} 
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b bg-card px-6 py-4 shrink-0">
          <h1 className="text-2xl font-bold">Painel Administrativo</h1>
          <p className="text-muted-foreground">Gerenciando: <span className="text-primary font-medium">{selectedCompany?.name}</span></p>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b bg-card shrink-0">
            <TabsList className="h-12 w-full justify-center gap-8 rounded-none bg-transparent p-0">
              <TabsTrigger 
                value="bridges" 
                className="relative h-14 flex-1 rounded-none border-b-2 border-transparent font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                <Building2 className="h-4 w-4 mr-2" />
                Pontes
              </TabsTrigger>
              <TabsTrigger 
                value="users" 
                className="relative h-14 flex-1 rounded-none border-b-2 border-transparent font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                <Users className="h-4 w-4 mr-2" />
                Usuários
              </TabsTrigger>
              <TabsTrigger 
                value="devices" 
                className="relative h-14 flex-1 rounded-none border-b-2 border-transparent font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                <Settings className="h-4 w-4 mr-2" />
                Dispositivos
              </TabsTrigger>
              <TabsTrigger 
                value="system" 
                className="relative h-14 flex-1 rounded-none border-b-2 border-transparent font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                <Zap className="h-4 w-4 mr-2" />
                Sistema
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-auto p-6">
            {/* Bridges Tab */}
            <TabsContent value="bridges" className="m-0 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Gerenciamento de Pontes - {selectedCompany?.name}</h2>
                <Button onClick={() => setIsNewBridgeOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Ponte
                </Button>
              </div>

              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Pontes - {selectedCompany?.name}</CardTitle>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="Buscar ponte..."
                          className="pl-9 w-48"
                          value={searchBridge}
                          onChange={(e) => setSearchBridge(e.target.value)}
                        />
                      </div>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-28">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="operacional">Normal</SelectItem>
                          <SelectItem value="atencao">Alerta</SelectItem>
                          <SelectItem value="critico">Crítico</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredBridges.map((bridge) => (
                      <Card key={bridge.id} className="relative overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold">{bridge.name}</h3>
                              <p className="text-xs text-muted-foreground">{bridge.id.replace('bridge-', 'A-P')}</p>
                            </div>
                            {getStatusBadge(bridge.structuralStatus)}
                          </div>
                          <div className="space-y-1 text-sm mb-4">
                            <p><span className="font-medium">Local:</span> {bridge.location}</p>
                            <p><span className="font-medium">Sensores:</span> {bridge.sensorCount}</p>
                            <p><span className="font-medium">Atualizado:</span> {bridge.lastUpdate}</p>
                          </div>
                          <Button 
                            className="w-full"
                            onClick={() => setSelectedBridge(bridge)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="m-0 space-y-4">
              {/* Stats Cards */}
              <div className="grid gap-3 grid-cols-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total de Usuários</p>
                        <p className="text-2xl font-bold">{userStats.total}</p>
                      </div>
                      <Users className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Ativos</p>
                        <p className="text-2xl font-bold text-success">{userStats.active}</p>
                      </div>
                      <UserCheck className="h-8 w-8 text-success/50" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Inativos</p>
                        <p className="text-2xl font-bold text-muted-foreground">{userStats.inactive}</p>
                      </div>
                      <UserX className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Por Perfil</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="bg-primary/10 text-primary text-xs">
                            {userStats.admins} Admin
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {userStats.gestores} Gestor
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {userStats.viewers} Viewer
                          </Badge>
                        </div>
                      </div>
                      <Shield className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Users Table */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Usuários - {selectedCompany?.name}</CardTitle>
                      <CardDescription>Gerencie os usuários e permissões de acesso</CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="Buscar usuário..."
                          className="pl-9 w-56"
                          value={searchUser}
                          onChange={(e) => setSearchUser(e.target.value)}
                        />
                      </div>
                      <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-36">
                          <SelectValue placeholder="Filtrar perfil" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os perfis</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="gestor">Gestor</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                      {isAdmin && (
                        <Button onClick={() => setIsNewUserOpen(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Novo Usuário
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {companyUsers.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum usuário encontrado</p>
                      <p className="text-sm">Tente ajustar os filtros de busca</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[280px]">Usuário</TableHead>
                          <TableHead>Perfil</TableHead>
                          <TableHead>Último Acesso</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {companyUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                  <AvatarImage src={user.avatar} />
                                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                    {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{user.name}</p>
                                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {user.email}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{getRoleBadge(user.role)}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(user.createdAt).toLocaleString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </TableCell>
                            <TableCell>{getStatusBadge(user.status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 px-3"
                                  onClick={() => setSelectedUser(user)}
                                >
                                  <Pencil className="h-4 w-4 mr-1" />
                                  Editar
                                </Button>
                                {isAdmin && (
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => toast.error('Funcionalidade de exclusão em breve')}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Devices Tab */}
            <TabsContent value="devices" className="m-0 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Dispositivos & Parâmetros - {selectedCompany?.name}</h2>
                <Button onClick={() => setIsNewDeviceOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Dispositivo
                </Button>
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID do Dispositivo</TableHead>
                        <TableHead>Ponte</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Última Comunicação</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companyDevices.map((device) => {
                        const bridge = mockBridges.find(b => b.id === device.bridgeId);
                        return (
                          <TableRow key={device.id}>
                            <TableCell className="font-medium text-primary">{device.name}</TableCell>
                            <TableCell className="text-primary">{bridge?.id.replace('bridge-', 'A-P')}</TableCell>
                            <TableCell>{device.type === 'frequency' ? 'Frequencia' : 'Aceleracao'}</TableCell>
                            <TableCell>{getStatusBadge(device.status)}</TableCell>
                            <TableCell>{new Date(device.lastReading.timestamp).toLocaleString('pt-BR')}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={() => setSelectedDevice(device)}
                                >
                                  <Settings className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Eye className="h-4 w-4" />
                                </Button>
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

            {/* System Tab */}
            <TabsContent value="system" className="m-0 space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    <div>
                      <CardTitle>Desempenho do Sistema de Sensores</CardTitle>
                      <CardDescription>Resumo operacional dos últimos 30 dias</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border-l-4 border-l-success">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Energia</p>
                            <p className="text-3xl font-bold text-primary">{systemStats.energy.percentage}%</p>
                            <p className="text-xs text-primary">{systemStats.energy.failures} falhas registradas</p>
                          </div>
                          <CheckCircle className="h-5 w-5 text-success" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-success">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Comunicação</p>
                            <p className="text-3xl font-bold text-primary">{systemStats.communication.percentage}%</p>
                            <p className="text-xs text-primary">{systemStats.communication.failures} falhas registradas</p>
                          </div>
                          <CheckCircle className="h-5 w-5 text-success" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-success">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Sensores</p>
                            <p className="text-3xl font-bold text-primary">{systemStats.sensors.percentage}%</p>
                            <p className="text-xs text-primary">{systemStats.sensors.failures} falhas registradas</p>
                          </div>
                          <CheckCircle className="h-5 w-5 text-success" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Registro de Falhas do Sistema (Últimos 30 dias)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockSystemFailures.map((failure) => (
                      <div key={failure.id} className="rounded-lg border p-4">
                        <div className="grid gap-4 md:grid-cols-6 items-center">
                          <div>
                            <p className="text-xs text-muted-foreground">Ponte</p>
                            <p className="font-medium">{failure.bridgeName}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Tipo</p>
                            <Badge variant="outline" className={getTypeColor(failure.type)}>
                              {failure.type}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Sensor</p>
                            <p className="font-mono text-sm">{failure.sensor}</p>
                          </div>
                          <div className="md:col-span-2">
                            <p className="text-xs text-muted-foreground">Problema</p>
                            <p className="text-sm">{failure.problem}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <p className="text-xs text-muted-foreground">{failure.time}</p>
                            {getFailureStatusBadge(failure.status)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Dialogs */}
      <BridgeDetailsDialog
        bridge={selectedBridge}
        open={!!selectedBridge}
        onOpenChange={(open) => !open && setSelectedBridge(null)}
      />

      <DeviceParametersDialog
        device={selectedDevice}
        open={!!selectedDevice}
        onOpenChange={(open) => !open && setSelectedDevice(null)}
      />

      {/* Edit User Dialog */}
      <EditUserDialog
        user={selectedUser}
        open={!!selectedUser}
        onOpenChange={(open) => !open && setSelectedUser(null)}
        onSave={(updatedUser) => {
          console.log('User updated:', updatedUser);
        }}
      />

      {/* New User Dialog */}
      <Dialog open={isNewUserOpen} onOpenChange={setIsNewUserOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-name">Nome</Label>
              <Input id="new-name" placeholder="Nome completo" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-email">E-mail</Label>
              <Input id="new-email" type="email" placeholder="email@empresa.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Senha</Label>
              <Input id="new-password" type="password" placeholder="Senha inicial" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-role">Perfil</Label>
              <Select>
                <SelectTrigger id="new-role">
                  <SelectValue placeholder="Selecione um perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Visualizador</SelectItem>
                  <SelectItem value="gestor">Gestor</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewUserOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => { 
              toast.success('Usuário criado com sucesso!'); 
              setIsNewUserOpen(false); 
            }}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Bridge Dialog */}
      <Dialog open={isNewBridgeOpen} onOpenChange={setIsNewBridgeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Ponte</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input placeholder="Nome da ponte" />
            </div>
            <div className="space-y-2">
              <Label>Localização</Label>
              <Input placeholder="Localização" />
            </div>
            <div className="space-y-2">
              <Label>Rodovia</Label>
              <Input placeholder="Ex: SP-150" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewBridgeOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => { 
              toast.success('Ponte criada com sucesso!'); 
              setIsNewBridgeOpen(false); 
            }}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Device Dialog */}
      <Dialog open={isNewDeviceOpen} onOpenChange={setIsNewDeviceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Dispositivo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>ID do Dispositivo</Label>
              <Input placeholder="Ex: A-P1-S1" />
            </div>
            <div className="space-y-2">
              <Label>Ponte</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma ponte" />
                </SelectTrigger>
                <SelectContent>
                  {companyBridges.map((bridge) => (
                    <SelectItem key={bridge.id} value={bridge.id}>
                      {bridge.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="frequency">Frequência</SelectItem>
                  <SelectItem value="acceleration">Aceleração</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewDeviceOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => { 
              toast.success('Dispositivo criado com sucesso!'); 
              setIsNewDeviceOpen(false); 
            }}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
