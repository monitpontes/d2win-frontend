import type {
  User,
  Company,
  Bridge,
  Sensor,
  BridgeEvent,
  TimeSeries,
  Camera,
  Schedule,
  Document,
  SystemStatus,
  StructuralProblem,
  Intervention,
} from '@/types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'admin@d2win.com',
    name: 'Administrador Sistema',
    role: 'admin',
    companyId: 'company-1',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'user-2',
    email: 'engenheiro@d2win.com',
    name: 'João Silva',
    role: 'gestor',
    companyId: 'company-1',
    status: 'active',
    createdAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'user-3',
    email: 'viewer@d2win.com',
    name: 'Maria Santos',
    role: 'viewer',
    companyId: 'company-1',
    status: 'active',
    createdAt: '2024-02-01T00:00:00Z',
  },
  {
    id: 'user-4',
    email: 'demo@empresa.com',
    name: 'Demo User',
    role: 'viewer',
    companyId: 'company-2',
    status: 'active',
    createdAt: '2024-03-01T00:00:00Z',
  },
];

// Mock Companies
export const mockCompanies: Company[] = [
  {
    id: 'company-1',
    name: 'D2WIN',
    description: 'Empresa de monitoramento estrutural',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'company-2',
    name: 'CCR',
    description: 'Concessionária de rodovias',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'company-3',
    name: 'EcoRodovias',
    description: 'Grupo de infraestrutura',
    createdAt: '2024-02-01T00:00:00Z',
  },
  {
    id: 'company-4',
    name: 'Arteris',
    description: 'Concessionária de rodovias',
    createdAt: '2024-02-15T00:00:00Z',
  },
];

// Mock Bridges
export const mockBridges: Bridge[] = [
  {
    id: 'bridge-1',
    name: 'Ponte A-1',
    companyId: 'company-2',
    location: 'SP-150 - São Paulo - SP',
    concession: 'CCR AutoBAn',
    rodovia: 'SP-150',
    typology: 'Viaduto',
    km: 23.5,
    beamType: 'Viga I',
    spanType: 'Curto',
    material: 'Concreto armado',
    length: 120,
    supportCount: 4,
    structuralStatus: 'critical',
    operationalCriticality: 'medium',
    sensorCount: 5,
    hasActiveAlerts: true,
    lastUpdate: '2026-01-19T07:59:38Z',
    image: 'https://images.unsplash.com/photo-1545296664-39db56ad95bd?w=800',
  },
  {
    id: 'bridge-2',
    name: 'Ponte A-2',
    companyId: 'company-2',
    location: 'São Paulo - SP',
    concession: 'CCR Ponte',
    rodovia: 'BR-101',
    typology: 'Ponte',
    km: 0,
    beamType: 'Viga Caixão',
    spanType: 'Longo',
    material: 'Estrutura mista (aço e concreto)',
    length: 85,
    supportCount: 3,
    structuralStatus: 'normal',
    operationalCriticality: 'high',
    sensorCount: 5,
    hasActiveAlerts: true,
    lastUpdate: '2026-01-19T05:18:55Z',
    image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800',
  },
  {
    id: 'bridge-3',
    name: 'Ponte A-3',
    companyId: 'company-3',
    location: 'São Paulo - SP',
    concession: 'Prefeitura SP',
    rodovia: 'Via Urbana',
    typology: 'Viaduto',
    km: 0,
    beamType: 'Viga Caixão',
    spanType: 'Médio',
    material: 'Concreto protendido',
    length: 95,
    supportCount: 3,
    structuralStatus: 'normal',
    operationalCriticality: 'medium',
    sensorCount: 5,
    hasActiveAlerts: true,
    lastUpdate: '2026-01-18T03:02:15Z',
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800',
  },
  {
    id: 'bridge-4',
    name: 'Ponte A-4',
    companyId: 'company-3',
    location: 'São Paulo - SP',
    concession: 'Prefeitura SP',
    rodovia: 'Av. Jornalista Roberto Marinho',
    typology: 'Ponte',
    km: 0,
    beamType: 'Viga T',
    spanType: 'Especial',
    material: 'Concreto e Aço',
    length: 138,
    supportCount: 4,
    structuralStatus: 'normal',
    operationalCriticality: 'high',
    sensorCount: 16,
    hasActiveAlerts: false,
    lastUpdate: new Date().toISOString(),
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800',
  },
  {
    id: 'bridge-5',
    name: 'Ponte A-5',
    companyId: 'company-4',
    location: 'Campinas - SP',
    concession: 'Arteris Autopista',
    rodovia: 'SP-348',
    typology: 'Viaduto',
    km: 95.2,
    beamType: 'Viga T',
    spanType: 'Médio',
    material: 'Concreto Armado',
    length: 320,
    supportCount: 5,
    structuralStatus: 'normal',
    operationalCriticality: 'low',
    sensorCount: 6,
    hasActiveAlerts: false,
    lastUpdate: new Date().toISOString(),
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
  },
  {
    id: 'bridge-6',
    name: 'Ponte A-6',
    companyId: 'company-4',
    location: 'Rio de Janeiro - RJ',
    concession: 'Arteris Fluminense',
    rodovia: 'BR-101',
    typology: 'Ponte',
    km: 0,
    beamType: 'Viga Caixão',
    spanType: 'Longo',
    material: 'Concreto Protendido',
    length: 1850,
    supportCount: 8,
    structuralStatus: 'alert',
    operationalCriticality: 'medium',
    sensorCount: 24,
    hasActiveAlerts: true,
    lastUpdate: new Date().toISOString(),
    image: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800',
  },
  {
    id: 'bridge-7',
    name: 'Ponte A-7',
    companyId: 'company-2',
    location: 'Rio de Janeiro - RJ',
    concession: 'CCR Via Lagos',
    rodovia: 'RJ-124',
    typology: 'Passarela',
    km: 15.3,
    beamType: 'Viga I',
    spanType: 'Curto',
    material: 'Aço',
    length: 45,
    supportCount: 2,
    structuralStatus: 'normal',
    operationalCriticality: 'low',
    sensorCount: 4,
    hasActiveAlerts: false,
    lastUpdate: new Date().toISOString(),
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
  },
  {
    id: 'bridge-8',
    name: 'Ponte A-8',
    companyId: 'company-3',
    location: 'Belo Horizonte - MG',
    concession: 'Via MG',
    rodovia: 'BR-040',
    typology: 'Passarela',
    km: 42.1,
    beamType: 'Treliça',
    spanType: 'Médio',
    material: 'Aço',
    length: 60,
    supportCount: 2,
    structuralStatus: 'normal',
    operationalCriticality: 'low',
    sensorCount: 3,
    hasActiveAlerts: false,
    lastUpdate: new Date().toISOString(),
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800',
  },
  {
    id: 'bridge-9',
    name: 'Ponte A-9',
    companyId: 'company-4',
    location: 'Curitiba - PR',
    concession: 'Arteris Sul',
    rodovia: 'BR-116',
    typology: 'Viaduto',
    km: 78.5,
    beamType: 'Viga I',
    spanType: 'Curto',
    material: 'Concreto Armado',
    length: 220,
    supportCount: 4,
    structuralStatus: 'alert',
    operationalCriticality: 'medium',
    sensorCount: 8,
    hasActiveAlerts: true,
    lastUpdate: new Date().toISOString(),
    image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800',
  },
  {
    id: 'bridge-10',
    name: 'Ponte A-10',
    companyId: 'company-2',
    location: 'Porto Alegre - RS',
    concession: 'CCR ViaSul',
    rodovia: 'RS-118',
    typology: 'Viaduto',
    km: 33.2,
    beamType: 'Viga Caixão',
    spanType: 'Médio',
    material: 'Concreto Protendido',
    length: 380,
    supportCount: 6,
    structuralStatus: 'normal',
    operationalCriticality: 'high',
    sensorCount: 10,
    hasActiveAlerts: false,
    lastUpdate: new Date().toISOString(),
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800',
  },
];

// Mock Structural Problems
export const mockStructuralProblems: StructuralProblem[] = [
  {
    id: 'problem-1',
    bridgeId: 'bridge-1',
    bridgeName: 'Ponte A-1',
    type: 'Fissura',
    description: 'Fissura longitudinal na viga V3, extensão 2.5m',
    date: '2025-12-15',
    status: 'Em Análise',
  },
  {
    id: 'problem-2',
    bridgeId: 'bridge-2',
    bridgeName: 'Ponte A-2',
    type: 'Corrosão',
    description: 'Corrosão severa em aparelho de apoio A2',
    date: '2025-12-08',
    status: 'Corrigido',
  },
  {
    id: 'problem-3',
    bridgeId: 'bridge-3',
    bridgeName: 'Ponte A-3',
    type: 'Desgaste',
    description: 'Desgaste superficial no tabuleiro, trecho 0+120',
    date: '2025-12-01',
    status: 'Agendado',
  },
  {
    id: 'problem-4',
    bridgeId: 'bridge-4',
    bridgeName: 'Ponte A-4',
    type: 'Trinca',
    description: 'Trinca transversal na laje de aproximação',
    date: '2025-11-28',
    status: 'Pendente',
  },
  {
    id: 'problem-5',
    bridgeId: 'bridge-5',
    bridgeName: 'Ponte A-5',
    type: 'Desplacamento',
    description: 'Desplacamento de concreto no pilar P2',
    date: '2025-11-20',
    status: 'Em Análise',
  },
  {
    id: 'problem-6',
    bridgeId: 'bridge-6',
    bridgeName: 'Ponte A-6',
    type: 'Fissura',
    description: 'Fissura diagonal no encontro E1',
    date: '2025-11-15',
    status: 'Corrigido',
  },
  {
    id: 'problem-7',
    bridgeId: 'bridge-7',
    bridgeName: 'Ponte A-7',
    type: 'Corrosão',
    description: 'Corrosão em armadura exposta na viga V1',
    date: '2025-11-10',
    status: 'Agendado',
  },
  {
    id: 'problem-8',
    bridgeId: 'bridge-1',
    bridgeName: 'Ponte A-1',
    type: 'Desgaste',
    description: 'Desgaste do concreto por abrasão',
    date: '2025-11-05',
    status: 'Pendente',
  },
  {
    id: 'problem-9',
    bridgeId: 'bridge-2',
    bridgeName: 'Ponte A-2',
    type: 'Trinca',
    description: 'Micro trincas no revestimento',
    date: '2025-10-28',
    status: 'Em Análise',
  },
  {
    id: 'problem-10',
    bridgeId: 'bridge-3',
    bridgeName: 'Ponte A-3',
    type: 'Fissura',
    description: 'Fissura por retração no tabuleiro',
    date: '2025-10-20',
    status: 'Corrigido',
  },
  {
    id: 'problem-11',
    bridgeId: 'bridge-4',
    bridgeName: 'Ponte A-4',
    type: 'Corrosão',
    description: 'Oxidação em cabos de protensão',
    date: '2025-10-15',
    status: 'Em Análise',
  },
  {
    id: 'problem-12',
    bridgeId: 'bridge-5',
    bridgeName: 'Ponte A-5',
    type: 'Desgaste',
    description: 'Desgaste na junta de dilatação',
    date: '2025-10-10',
    status: 'Agendado',
  },
];

// Mock Interventions
export const mockInterventions: Intervention[] = [
  {
    id: 'intervention-1',
    bridgeId: 'bridge-2',
    bridgeName: 'Ponte A-2',
    priority: 'Urgente',
    type: 'Reparo',
    description: 'Reparo estrutural urgente em apoios',
    scheduledDate: '2025-09-04',
    estimatedDuration: '10 dias',
    team: 'Equipe B - Manutenção',
  },
  {
    id: 'intervention-2',
    bridgeId: 'bridge-1',
    bridgeName: 'Ponte A-1',
    priority: 'Média',
    type: 'Inspeção',
    description: 'Inspeção semestral de rotina',
    scheduledDate: '2025-09-14',
    estimatedDuration: '1 dias',
    team: 'Equipe A - Inspeção',
  },
  {
    id: 'intervention-3',
    bridgeId: 'bridge-7',
    bridgeName: 'Ponte A-7',
    priority: 'Urgente',
    type: 'Inspeção',
    description: 'Inspeção emergencial devido a alertas de sensores',
    scheduledDate: '2025-09-17',
    estimatedDuration: '1 dias',
    team: 'Equipe A - Inspeção',
  },
  {
    id: 'intervention-4',
    bridgeId: 'bridge-4',
    bridgeName: 'Ponte A-4',
    priority: 'Média',
    type: 'Upgrade',
    description: 'Instalação de novos sensores de vibração',
    scheduledDate: '2025-09-21',
    estimatedDuration: '7 dias',
    team: 'Equipe E - Modernização',
  },
  {
    id: 'intervention-5',
    bridgeId: 'bridge-3',
    bridgeName: 'Ponte A-3',
    priority: 'Baixa',
    type: 'Manutenção',
    description: 'Manutenção preventiva de juntas',
    scheduledDate: '2025-09-28',
    estimatedDuration: '3 dias',
    team: 'Equipe C - Manutenção',
  },
  {
    id: 'intervention-6',
    bridgeId: 'bridge-5',
    bridgeName: 'Ponte A-5',
    priority: 'Média',
    type: 'Reparo',
    description: 'Reparo de revestimento danificado',
    scheduledDate: '2025-10-02',
    estimatedDuration: '5 dias',
    team: 'Equipe B - Manutenção',
  },
  {
    id: 'intervention-7',
    bridgeId: 'bridge-6',
    bridgeName: 'Ponte A-6',
    priority: 'Urgente',
    type: 'Inspeção',
    description: 'Inspeção de emergência após evento sísmico',
    scheduledDate: '2025-10-05',
    estimatedDuration: '2 dias',
    team: 'Equipe A - Inspeção',
  },
  {
    id: 'intervention-8',
    bridgeId: 'bridge-8',
    bridgeName: 'Ponte A-8',
    priority: 'Baixa',
    type: 'Upgrade',
    description: 'Atualização do sistema de monitoramento',
    scheduledDate: '2025-10-10',
    estimatedDuration: '4 dias',
    team: 'Equipe E - Modernização',
  },
  {
    id: 'intervention-9',
    bridgeId: 'bridge-9',
    bridgeName: 'Ponte A-9',
    priority: 'Média',
    type: 'Manutenção',
    description: 'Limpeza e manutenção de drenagem',
    scheduledDate: '2025-10-15',
    estimatedDuration: '2 dias',
    team: 'Equipe D - Serviços Gerais',
  },
];

// Mock Sensors
export const mockSensors: Sensor[] = [
  // Bridge 1 sensors
  {
    id: 'sensor-1-1',
    bridgeId: 'bridge-1',
    type: 'acceleration',
    name: 'Acelerômetro A1',
    status: 'online',
    position: { x: 0, y: 0, z: 0 },
    lastReading: { value: 0.02, unit: 'g', timestamp: new Date().toISOString() },
    acquisitionInterval: 100,
    alertThreshold: 0.5,
    criticalThreshold: 1.0,
  },
  {
    id: 'sensor-1-2',
    bridgeId: 'bridge-1',
    type: 'frequency',
    name: 'Frequencímetro F1',
    status: 'online',
    position: { x: 100, y: 0, z: 0 },
    lastReading: { value: 2.4, unit: 'Hz', timestamp: new Date().toISOString() },
    acquisitionInterval: 1000,
    alertThreshold: 3.0,
    criticalThreshold: 4.0,
  },
  {
    id: 'sensor-1-3',
    bridgeId: 'bridge-1',
    type: 'command_box',
    name: 'Caixa Comando C1',
    status: 'online',
    position: { x: 200, y: 0, z: 0 },
    lastReading: { value: 24, unit: 'V', timestamp: new Date().toISOString() },
    acquisitionInterval: 60000,
    alertThreshold: 22,
    criticalThreshold: 20,
  },
  // Bridge 2 sensors
  {
    id: 'sensor-2-1',
    bridgeId: 'bridge-2',
    type: 'acceleration',
    name: 'Acelerômetro A1',
    status: 'online',
    position: { x: 0, y: 0, z: 0 },
    lastReading: { value: 0.08, unit: 'g', timestamp: new Date().toISOString() },
    acquisitionInterval: 100,
    alertThreshold: 0.5,
    criticalThreshold: 1.0,
  },
  {
    id: 'sensor-2-2',
    bridgeId: 'bridge-2',
    type: 'frequency',
    name: 'Frequencímetro F1',
    status: 'offline',
    position: { x: 100, y: 0, z: 0 },
    lastReading: { value: 3.1, unit: 'Hz', timestamp: new Date().toISOString() },
    acquisitionInterval: 1000,
    alertThreshold: 3.0,
    criticalThreshold: 4.0,
  },
  // Bridge 3 sensors
  {
    id: 'sensor-3-1',
    bridgeId: 'bridge-3',
    type: 'acceleration',
    name: 'Acelerômetro A1',
    status: 'online',
    position: { x: 0, y: 0, z: 0 },
    lastReading: { value: 0.15, unit: 'g', timestamp: new Date().toISOString() },
    acquisitionInterval: 100,
    alertThreshold: 0.5,
    criticalThreshold: 1.0,
  },
];

// Generate time series data
const generateTimeSeries = (sensorId: string, dataType: 'frequency' | 'acceleration', hours: number = 24): TimeSeries => {
  const data: TimeSeries['data'] = [];
  const now = new Date();
  const axes: Array<'x' | 'y' | 'z'> = ['x', 'y', 'z'];
  
  for (let i = hours * 60; i >= 0; i -= 5) {
    const timestamp = new Date(now.getTime() - i * 60 * 1000).toISOString();
    axes.forEach(axis => {
      const baseValue = dataType === 'frequency' ? 2.5 : 0.05;
      const noise = (Math.random() - 0.5) * (dataType === 'frequency' ? 0.5 : 0.02);
      data.push({
        timestamp,
        value: baseValue + noise,
        axis,
      });
    });
  }
  
  return { sensorId, dataType, data };
};

export const mockTimeSeries: TimeSeries[] = [
  generateTimeSeries('sensor-1-1', 'acceleration'),
  generateTimeSeries('sensor-1-2', 'frequency'),
  generateTimeSeries('sensor-2-1', 'acceleration'),
  generateTimeSeries('sensor-2-2', 'frequency'),
  generateTimeSeries('sensor-3-1', 'acceleration'),
];

// Mock Events
export const mockEvents: BridgeEvent[] = [
  {
    id: 'event-1',
    bridgeId: 'bridge-2',
    sensorId: 'sensor-2-1',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    type: 'alert',
    description: 'Vibração acima do limite de alerta detectada',
    severity: 'medium',
    status: 'new',
  },
  {
    id: 'event-2',
    bridgeId: 'bridge-3',
    sensorId: 'sensor-3-1',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    type: 'anomaly',
    description: 'Padrão de frequência anormal detectado',
    severity: 'high',
    status: 'acknowledged',
  },
  {
    id: 'event-3',
    bridgeId: 'bridge-1',
    sensorId: 'sensor-1-1',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    type: 'maintenance',
    description: 'Manutenção preventiva realizada',
    severity: 'low',
    status: 'resolved',
  },
  {
    id: 'event-4',
    bridgeId: 'bridge-6',
    sensorId: 'sensor-2-1',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    type: 'alert',
    description: 'Temperatura do sensor elevada',
    severity: 'medium',
    status: 'new',
  },
];

// Mock Cameras
export const mockCameras: Camera[] = [
  {
    id: 'camera-1',
    bridgeId: 'bridge-1',
    name: 'Câmera Principal',
    status: 'online',
    thumbnail: 'https://images.unsplash.com/photo-1545296664-39db56ad95bd?w=400',
  },
  {
    id: 'camera-2',
    bridgeId: 'bridge-1',
    name: 'Câmera Lateral Esquerda',
    status: 'online',
    thumbnail: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400',
  },
  {
    id: 'camera-3',
    bridgeId: 'bridge-2',
    name: 'Câmera Central',
    status: 'offline',
    thumbnail: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400',
  },
];

// Mock Schedules
export const mockSchedules: Schedule[] = [
  {
    id: 'schedule-1',
    bridgeId: 'bridge-1',
    type: 'inspection',
    title: 'Inspeção Visual Trimestral',
    description: 'Verificação visual de todos os elementos estruturais',
    status: 'planned',
    scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    responsibleUser: 'João Silva',
  },
  {
    id: 'schedule-2',
    bridgeId: 'bridge-2',
    type: 'maintenance',
    title: 'Manutenção de Sensores',
    description: 'Substituição de baterias e calibração',
    status: 'in_progress',
    scheduledDate: new Date().toISOString(),
    responsibleUser: 'Carlos Mendes',
  },
  {
    id: 'schedule-3',
    bridgeId: 'bridge-1',
    type: 'inspection',
    title: 'Inspeção Estrutural Anual',
    description: 'Avaliação completa da estrutura',
    status: 'completed',
    scheduledDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    completedDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    responsibleUser: 'Ana Costa',
  },
];

// Mock Documents
export const mockDocuments: Document[] = [
  {
    id: 'doc-1',
    bridgeId: 'bridge-1',
    name: 'Projeto Estrutural Original',
    type: 'project',
    url: '/documents/projeto-estrutural.pdf',
    uploadedBy: 'admin@d2win.com',
    uploadedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'doc-2',
    bridgeId: 'bridge-1',
    name: 'Relatório de Inspeção 2024',
    type: 'report',
    url: '/documents/relatorio-inspecao.pdf',
    uploadedBy: 'engenheiro@d2win.com',
    uploadedAt: '2024-03-01T00:00:00Z',
  },
  {
    id: 'doc-3',
    bridgeId: 'bridge-2',
    name: 'Vídeo Drone - Vista Aérea',
    type: 'video',
    url: '/documents/video-drone.mp4',
    uploadedBy: 'engenheiro@d2win.com',
    uploadedAt: '2024-02-20T00:00:00Z',
  },
];

// Mock System Status
export const mockSystemStatus: SystemStatus = {
  power: 'ok',
  communication: 'ok',
  sensors: {
    online: 45,
    offline: 3,
    maintenance: 2,
  },
  failures: [
    {
      id: 'failure-1',
      description: 'Sensor 2-2 offline há 2 horas',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      severity: 'medium',
    },
    {
      id: 'failure-2',
      description: 'Latência alta na comunicação com Bridge-3',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      severity: 'low',
    },
  ],
};

// Helper functions
export const getUserByEmail = (email: string): User | undefined => {
  return mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
};

export const getBridgesByCompany = (companyId: string): Bridge[] => {
  if (companyId === 'all') return mockBridges;
  return mockBridges.filter(b => b.companyId === companyId);
};

export const getSensorsByBridge = (bridgeId: string): Sensor[] => {
  return mockSensors.filter(s => s.bridgeId === bridgeId);
};

export const getEventsByBridge = (bridgeId: string): BridgeEvent[] => {
  return mockEvents.filter(e => e.bridgeId === bridgeId);
};

export const getCamerasByBridge = (bridgeId: string): Camera[] => {
  return mockCameras.filter(c => c.bridgeId === bridgeId);
};

export const getSchedulesByBridge = (bridgeId: string): Schedule[] => {
  return mockSchedules.filter(s => s.bridgeId === bridgeId);
};

export const getDocumentsByBridge = (bridgeId: string): Document[] => {
  return mockDocuments.filter(d => d.bridgeId === bridgeId);
};

export const getTimeSeriesBySensor = (sensorId: string): TimeSeries | undefined => {
  return mockTimeSeries.find(ts => ts.sensorId === sensorId);
};

export const getStructuralProblems = (): StructuralProblem[] => {
  return mockStructuralProblems;
};

export const getInterventions = (): Intervention[] => {
  return mockInterventions;
};
