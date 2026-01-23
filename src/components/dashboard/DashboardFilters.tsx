import { useMemo, useCallback } from 'react';
import type { DashboardFilters } from '@/types';
import { mockBridges } from '@/data/mockData';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, X } from 'lucide-react';

interface DashboardFiltersProps {
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
}

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

export function DashboardFiltersComponent({ filters, onFiltersChange }: DashboardFiltersProps) {
  // Get unique values for filters
  const filterOptions = useMemo(() => {
    const concessions = [...new Set(mockBridges.map((b) => b.concession))];
    const rodovias = [...new Set(mockBridges.map((b) => b.rodovia))];
    const typologies = [...new Set(mockBridges.map((b) => b.typology))];
    const beamTypes = [...new Set(mockBridges.map((b) => b.beamType))];
    const spanTypes = [...new Set(mockBridges.map((b) => b.spanType))];
    const materials = [...new Set(mockBridges.map((b) => b.material))];
    return { concessions, rodovias, typologies, beamTypes, spanTypes, materials };
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    onFiltersChange({ ...filters, search: value });
  }, [filters, onFiltersChange]);

  const handleReset = useCallback(() => {
    onFiltersChange(defaultFilters);
  }, [onFiltersChange]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.structuralStatus !== 'all' ||
      filters.operationalCriticality !== 'all' ||
      filters.concession !== '' ||
      filters.rodovia !== '' ||
      filters.typology !== '' ||
      filters.beamType !== '' ||
      filters.spanType !== '' ||
      filters.material !== '' ||
      filters.hasActiveAlerts !== 'all' ||
      filters.kmRange[0] > 0 ||
      filters.kmRange[1] < 200
    );
  }, [filters]);

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, ID ou localização..."
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
        {filters.search && (
          <button
            onClick={() => handleSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filtros Operacionais */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-primary">FILTROS OPERACIONAIS</h3>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={handleReset} className="text-destructive hover:text-destructive">
              <X className="h-4 w-4 mr-1" />
              Limpar Filtros
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-10 gap-4">
          {/* Concessão */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Concessão</Label>
            <Select
              value={filters.concession || 'all'}
              onValueChange={(value) => onFiltersChange({ ...filters, concession: value === 'all' ? '' : value })}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {filterOptions.concessions.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Rodovia */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Rodovia</Label>
            <Select
              value={filters.rodovia || 'all'}
              onValueChange={(value) => onFiltersChange({ ...filters, rodovia: value === 'all' ? '' : value })}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {filterOptions.rodovias.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipologia */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Tipologia</Label>
            <Select
              value={filters.typology || 'all'}
              onValueChange={(value) => onFiltersChange({ ...filters, typology: value === 'all' ? '' : value as DashboardFilters['typology'] })}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {filterOptions.typologies.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Material Estrutural */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Material Estrutural</Label>
            <Select
              value={filters.material || 'all'}
              onValueChange={(value) => onFiltersChange({ ...filters, material: value === 'all' ? '' : value })}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {filterOptions.materials.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Estrutural */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Status Estrutural</Label>
            <Select
              value={filters.structuralStatus}
              onValueChange={(value) => onFiltersChange({ ...filters, structuralStatus: value as DashboardFilters['structuralStatus'] })}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="alert">Alerta</SelectItem>
                <SelectItem value="critical">Crítico</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Criticidade Operacional */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Criticidade Operacional</Label>
            <Select
              value={filters.operationalCriticality}
              onValueChange={(value) => onFiltersChange({ ...filters, operationalCriticality: value as DashboardFilters['operationalCriticality'] })}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Alertas Ativos */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Alertas Ativos</Label>
            <Select
              value={filters.hasActiveAlerts}
              onValueChange={(value) => onFiltersChange({ ...filters, hasActiveAlerts: value as DashboardFilters['hasActiveAlerts'] })}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="yes">Sim</SelectItem>
                <SelectItem value="no">Não</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Vão */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Tipo de Vão</Label>
            <Select
              value={filters.spanType || 'all'}
              onValueChange={(value) => onFiltersChange({ ...filters, spanType: value === 'all' ? '' : value })}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {filterOptions.spanTypes.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Viga */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Tipo de Viga</Label>
            <Select
              value={filters.beamType || 'all'}
              onValueChange={(value) => onFiltersChange({ ...filters, beamType: value === 'all' ? '' : value })}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {filterOptions.beamTypes.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Intervalo de Km */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Intervalo de Km</Label>
            <div className="flex gap-1">
              <Input
                type="number"
                placeholder="Inicial"
                value={filters.kmRange[0] || ''}
                onChange={(e) => onFiltersChange({ ...filters, kmRange: [Number(e.target.value) || 0, filters.kmRange[1]] })}
                className="h-9 text-xs"
              />
              <Input
                type="number"
                placeholder="Final"
                value={filters.kmRange[1] || ''}
                onChange={(e) => onFiltersChange({ ...filters, kmRange: [filters.kmRange[0], Number(e.target.value) || 200] })}
                className="h-9 text-xs"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}