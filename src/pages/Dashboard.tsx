import { useState, useMemo, useRef } from 'react';
import type { DashboardFilters } from '@/types';
import { getBridgesByCompany } from '@/data/mockData';
import { CompanySidebar } from '@/components/layout/CompanySidebar';
import { BridgeCard } from '@/components/dashboard/BridgeCard';
import { DashboardFiltersComponent } from '@/components/dashboard/DashboardFilters';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';
import { KPISummaryCards } from '@/components/dashboard/KPISummaryCards';
import { OperationalDashboard } from '@/components/dashboard/OperationalDashboard';
import { InterventionsSchedule } from '@/components/dashboard/InterventionsSchedule';
import { BridgesMap } from '@/components/dashboard/BridgesMap';
import { Activity, AlertTriangle, Building2 } from 'lucide-react';

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
  companyId: 'all',
};

// Debug flag: temporarily disable map to isolate runtime crash source
const ENABLE_BRIDGES_MAP = false;

export default function Dashboard() {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);

  const operationalRef = useRef<HTMLDivElement>(null);
  const interventionsRef = useRef<HTMLDivElement>(null);

  const allBridges = useMemo(() => getBridgesByCompany(selectedCompanyId), [selectedCompanyId]);

  const bridges = useMemo(() => {
    let result = [...allBridges];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (b) =>
          b.name.toLowerCase().includes(searchLower) ||
          b.id.toLowerCase().includes(searchLower) ||
          b.location.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (filters.structuralStatus !== 'all') {
      result = result.filter((b) => b.structuralStatus === filters.structuralStatus);
    }

    // Apply criticality filter
    if (filters.operationalCriticality !== 'all') {
      result = result.filter((b) => b.operationalCriticality === filters.operationalCriticality);
    }

    // Apply concession filter
    if (filters.concession) {
      result = result.filter((b) => b.concession === filters.concession);
    }

    // Apply beam type filter
    if (filters.beamType) {
      result = result.filter((b) => b.beamType === filters.beamType);
    }

    // Apply span type filter
    if (filters.spanType) {
      result = result.filter((b) => b.spanType === filters.spanType);
    }

    // Apply material filter
    if (filters.material) {
      result = result.filter((b) => b.material === filters.material);
    }

    // Apply km range filter
    result = result.filter(
      (b) => b.km >= filters.kmRange[0] && b.km <= filters.kmRange[1]
    );

    // Apply alerts filter
    if (filters.hasActiveAlerts !== 'all') {
      result = result.filter((b) => 
        filters.hasActiveAlerts === 'yes' ? b.hasActiveAlerts : !b.hasActiveAlerts
      );
    }

    // Apply typology filter
    if (filters.typology) {
      result = result.filter((b) => b.typology === filters.typology);
    }

    // Apply rodovia filter
    if (filters.rodovia) {
      result = result.filter((b) => b.rodovia === filters.rodovia);
    }

    return result;
  }, [allBridges, filters]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: allBridges.length,
      normal: allBridges.filter((b) => b.structuralStatus === 'normal').length,
      alert: allBridges.filter((b) => b.structuralStatus === 'alert').length,
      critical: allBridges.filter((b) => b.structuralStatus === 'critical').length,
      withAlerts: allBridges.filter((b) => b.hasActiveAlerts).length,
    };
  }, [allBridges]);

  // Chart click handlers
  const handleFilterByTypology = (typology: string) => {
    setFilters((prev) => ({ ...prev, typology: typology as DashboardFilters['typology'] }));
  };

  const handleFilterBySpanType = (spanType: string) => {
    setFilters((prev) => ({ ...prev, spanType }));
  };

  const handleFilterByBeamType = (beamType: string) => {
    setFilters((prev) => ({ ...prev, beamType }));
  };

  // Navigate to sections
  const handleNavigateToSection = (section: 'operational' | 'interventions') => {
    const ref = section === 'operational' ? operationalRef : interventionsRef;
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex flex-1">
      <CompanySidebar
        selectedCompanyId={selectedCompanyId}
        onSelectCompany={(id) => {
          setSelectedCompanyId(id);
          setFilters({ ...filters, companyId: id });
        }}
      />

      <main className="flex-1 overflow-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Dashboard – Ativos</h1>
          <p className="text-muted-foreground">
            Gerencie e monitore suas pontes e viadutos
          </p>
        </div>

        {/* Stats Cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total de Ativos</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <Activity className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.normal}</p>
                <p className="text-sm text-muted-foreground">Status Normal</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.alert}</p>
                <p className="text-sm text-muted-foreground">Em Alerta</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.critical}</p>
                <p className="text-sm text-muted-foreground">Críticos</p>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Summary Cards - Dashboard Operacional e Intervenções */}
        <div className="mb-6">
          <KPISummaryCards onNavigateToSection={handleNavigateToSection} />
        </div>

        {/* Filters */}
        <div className="mb-6">
          <DashboardFiltersComponent filters={filters} onFiltersChange={setFilters} />
        </div>

        {/* Interactive Map */}
        {ENABLE_BRIDGES_MAP ? (
          <div className="mb-6">
            <BridgesMap bridges={allBridges} filters={filters} onFiltersChange={setFilters} />
          </div>
        ) : null}

        {/* Distribution Charts */}
        <div className="mb-6">
          <DashboardCharts 
            bridges={allBridges}
            onFilterByTypology={handleFilterByTypology}
            onFilterBySpanType={handleFilterBySpanType}
            onFilterByBeamType={handleFilterByBeamType}
          />
        </div>

        {/* Results Info */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {bridges.length} de {stats.total} ativos
          </p>
        </div>

        {/* Bridge Cards Grid */}
        {bridges.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {bridges.map((bridge) => (
              <BridgeCard key={bridge.id} bridge={bridge} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border bg-card p-12 text-center">
            <Building2 className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="text-lg font-medium">Nenhum ativo encontrado</h3>
            <p className="text-sm text-muted-foreground">
              Tente ajustar os filtros para ver mais resultados
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
      </main>
    </div>
  );
}
