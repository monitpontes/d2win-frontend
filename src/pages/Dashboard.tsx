import { useState, useMemo, useRef } from 'react';
import type { DashboardFilters, StructuralStatus } from '@/types';
import { structuralStatusLabels } from '@/types';
import { useBridges } from '@/hooks/useBridges';
import { CompanySidebar } from '@/components/layout/CompanySidebar';
import { BridgeCard } from '@/components/dashboard/BridgeCard';
import { DashboardFiltersComponent } from '@/components/dashboard/DashboardFilters';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';
import { KPISummaryCards } from '@/components/dashboard/KPISummaryCards';
import { OperationalDashboard } from '@/components/dashboard/OperationalDashboard';
import { InterventionsSchedule } from '@/components/dashboard/InterventionsSchedule';
import { BridgesMap } from '@/components/dashboard/BridgesMap';
import { Activity, AlertTriangle, Building2, Ban, ShieldAlert, CheckCircle, Loader2 } from 'lucide-react';

const defaultFilters: DashboardFilters = {
  search: '',
  structuralStatus: 'all',
  operationalCriticality: 'all',
  concession: '',
  rodovia: '',
  typology: '',
  beamType: '',
  spanType: '',
  material: '',
  kmRange: [0, 200],
  hasActiveAlerts: 'all',
  companyId: 'all'
};

export default function Dashboard() {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);
  const [selectedBridgeId, setSelectedBridgeId] = useState<string | null>(null);
  const operationalRef = useRef<HTMLDivElement>(null);
  const interventionsRef = useRef<HTMLDivElement>(null);

  const { bridges: allBridges, isLoading } = useBridges(selectedCompanyId);

  // Handle bridge click from map - filter by bridge name
  const handleBridgeClickOnMap = (bridgeId: string) => {
    const bridge = allBridges.find(b => b.id === bridgeId);
    if (bridge) {
      setSelectedBridgeId(bridgeId);
      setFilters(prev => ({
        ...prev,
        search: bridge.name
      }));
    }
  };

  // Clear filter when clicking same bridge again
  const clearBridgeFilter = () => {
    setSelectedBridgeId(null);
    setFilters(prev => ({
      ...prev,
      search: ''
    }));
  };

  const bridges = useMemo(() => {
    let result = [...allBridges];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(b => b.name.toLowerCase().includes(searchLower) || b.id.toLowerCase().includes(searchLower) || b.location.toLowerCase().includes(searchLower));
    }

    // Apply status filter
    if (filters.structuralStatus !== 'all') {
      result = result.filter(b => b.structuralStatus === filters.structuralStatus);
    }

    // Apply criticality filter
    if (filters.operationalCriticality !== 'all') {
      result = result.filter(b => b.operationalCriticality === filters.operationalCriticality);
    }

    // Apply concession filter
    if (filters.concession) {
      result = result.filter(b => b.concession === filters.concession);
    }

    // Apply beam type filter
    if (filters.beamType) {
      result = result.filter(b => b.beamType === filters.beamType);
    }

    // Apply span type filter
    if (filters.spanType) {
      result = result.filter(b => b.spanType === filters.spanType);
    }

    // Apply material filter
    if (filters.material) {
      result = result.filter(b => b.material === filters.material);
    }

    // Apply km range filter
    result = result.filter(b => b.km >= filters.kmRange[0] && b.km <= filters.kmRange[1]);

    // Apply alerts filter
    if (filters.hasActiveAlerts !== 'all') {
      result = result.filter(b => filters.hasActiveAlerts === 'yes' ? b.hasActiveAlerts : !b.hasActiveAlerts);
    }

    // Apply typology filter
    if (filters.typology) {
      result = result.filter(b => b.typology === filters.typology);
    }

    // Apply rodovia filter
    if (filters.rodovia) {
      result = result.filter(b => b.rodovia === filters.rodovia);
    }
    return result;
  }, [allBridges, filters]);

  // Stats - using new status types
  const stats = useMemo(() => {
    return {
      total: allBridges.length,
      operacional: allBridges.filter(b => b.structuralStatus === 'operacional').length,
      atencao: allBridges.filter(b => b.structuralStatus === 'atencao').length,
      restricoes: allBridges.filter(b => b.structuralStatus === 'restricoes').length,
      critico: allBridges.filter(b => b.structuralStatus === 'critico').length,
      interdicao: allBridges.filter(b => b.structuralStatus === 'interdicao').length,
      withAlerts: allBridges.filter(b => b.hasActiveAlerts).length
    };
  }, [allBridges]);

  // Chart click handlers
  const handleFilterByTypology = (typology: string) => {
    setFilters(prev => ({
      ...prev,
      typology: typology as DashboardFilters['typology']
    }));
  };
  const handleFilterBySpanType = (spanType: string) => {
    setFilters(prev => ({
      ...prev,
      spanType
    }));
  };
  const handleFilterByBeamType = (beamType: string) => {
    setFilters(prev => ({
      ...prev,
      beamType
    }));
  };

  // Navigate to sections
  const handleNavigateToSection = (section: 'operational' | 'interventions') => {
    const ref = section === 'operational' ? operationalRef : interventionsRef;
    ref.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  return (
    <div className="flex flex-1">
      <CompanySidebar selectedCompanyId={selectedCompanyId} onSelectCompany={id => {
        setSelectedCompanyId(id);
        setFilters({
          ...filters,
          companyId: id
        });
      }} />

      <main className="flex-1 overflow-auto p-4">
        {/* Header compacto */}
        <div className="mb-4">
          <h1 className="text-xl font-bold text-foreground">Dashboard – Ativos</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie e monitore suas pontes e viadutos
          </p>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
        ) : (
          <>
            {/* Stats Cards Row */}
            <div className="mb-4 grid gap-3 grid-cols-3 lg:grid-cols-6">
              <div className="rounded-lg border bg-card p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{stats.total}</p>
                    <p className="text-sm text-muted-foreground">Total</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border bg-card p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                    <CheckCircle className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{stats.operacional}</p>
                    <p className="text-sm text-muted-foreground">Operacional</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border bg-card p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                    <Activity className="h-6 w-6 text-warning" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{stats.atencao}</p>
                    <p className="text-sm text-muted-foreground">C/ Atenção</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border bg-card p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10">
                    <AlertTriangle className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{stats.restricoes}</p>
                    <p className="text-sm text-muted-foreground">C/ Restrições</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border bg-card p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
                    <ShieldAlert className="h-6 w-6 text-destructive" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{stats.critico}</p>
                    <p className="text-sm text-muted-foreground">Crítico</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border bg-card p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
                    <Ban className="h-6 w-6 text-destructive" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{stats.interdicao}</p>
                    <p className="text-sm text-muted-foreground">Interdição</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Map + KPI Buttons side by side */}
            <div className="mb-4 grid gap-3 grid-cols-1 lg:grid-cols-4">
              <div className="lg:col-span-3">
                <BridgesMap 
                  compact 
                  bridges={allBridges}
                  onBridgeClick={handleBridgeClickOnMap}
                />
              </div>
              <div className="lg:col-span-1">
                <KPISummaryCards onNavigateToSection={handleNavigateToSection} />
              </div>
            </div>

            {/* Distribution Charts */}
            <div className="mb-4">
              <DashboardCharts bridges={allBridges} onFilterByTypology={handleFilterByTypology} onFilterBySpanType={handleFilterBySpanType} onFilterByBeamType={handleFilterByBeamType} />
            </div>

            {/* Filters - após os gráficos */}
            <div className="mb-4">
              <DashboardFiltersComponent filters={filters} onFiltersChange={setFilters} />
            </div>

            {/* Results Info */}
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Mostrando {bridges.length} de {stats.total} ativos
              </p>
            </div>

            {/* Bridge Cards Grid */}
            {bridges.length > 0 ? (
              <div className="grid gap-6 lg:grid-cols-2">
                {bridges.map(bridge => <BridgeCard key={bridge.id} bridge={bridge} />)}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border bg-card p-12 text-center">
                <Building2 className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <h3 className="text-lg font-medium">Nenhum ativo encontrado</h3>
                <p className="text-sm text-muted-foreground">
                  {allBridges.length === 0 
                    ? 'Nenhum dado disponível. Verifique a conexão com a API.'
                    : 'Tente ajustar os filtros para ver mais resultados'}
                </p>
              </div>
            )}

            {/* Operational Dashboard Section */}
            <div ref={operationalRef} className="mt-10 pt-6 border-t">
              <OperationalDashboard />
            </div>

            {/* Interventions Schedule Section */}
            <div ref={interventionsRef} className="mt-8">
              <InterventionsSchedule />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
