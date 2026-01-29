import { useState, useMemo, useCallback } from 'react';
import type { DashboardFilters } from '@/types';
import { structuralStatusLabels } from '@/types';
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Search, SlidersHorizontal, X, RotateCcw } from 'lucide-react';

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
  const [isOpen, setIsOpen] = useState(false);

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

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.structuralStatus !== 'all') count++;
    if (filters.operationalCriticality !== 'all') count++;
    if (filters.concession) count++;
    if (filters.rodovia) count++;
    if (filters.typology) count++;
    if (filters.beamType) count++;
    if (filters.spanType) count++;
    if (filters.material) count++;
    if (filters.hasActiveAlerts !== 'all') count++;
    if (filters.kmRange[0] > 0 || filters.kmRange[1] < 200) count++;
    return count;
  }, [filters]);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      {/* Search */}
      <div className="relative flex-1">
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

      {/* Filters Button */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="relative">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filtros
            {activeFilterCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between text-primary">
              FILTROS OPERACIONAIS
              <Button variant="ghost" size="sm" onClick={handleReset} className="text-destructive hover:text-destructive">
                <X className="h-4 w-4 mr-1" />
                Limpar Filtros
              </Button>
            </SheetTitle>
          </SheetHeader>
          
          <div className="mt-6 grid grid-cols-2 gap-4">
            {/* Concessão */}
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Concessão</Label>
              <Select
                value={filters.concession || 'all'}
                onValueChange={(value) => onFiltersChange({ ...filters, concession: value === 'all' ? '' : value })}
              >
                <SelectTrigger>
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
              <Label className="text-sm text-muted-foreground">Rodovia</Label>
              <Select
                value={filters.rodovia || 'all'}
                onValueChange={(value) => onFiltersChange({ ...filters, rodovia: value === 'all' ? '' : value })}
              >
                <SelectTrigger>
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
              <Label className="text-sm text-muted-foreground">Tipologia</Label>
              <Select
                value={filters.typology || 'all'}
                onValueChange={(value) => onFiltersChange({ ...filters, typology: value === 'all' ? '' : value as DashboardFilters['typology'] })}
              >
                <SelectTrigger>
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
              <Label className="text-sm text-muted-foreground">Material Estrutural</Label>
              <Select
                value={filters.material || 'all'}
                onValueChange={(value) => onFiltersChange({ ...filters, material: value === 'all' ? '' : value })}
              >
                <SelectTrigger>
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

            {/* Status Operacional */}
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Status Operacional</Label>
              <Select
                value={filters.structuralStatus}
                onValueChange={(value) => onFiltersChange({ ...filters, structuralStatus: value as DashboardFilters['structuralStatus'] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="operacional">{structuralStatusLabels.operacional}</SelectItem>
                  <SelectItem value="atencao">{structuralStatusLabels.atencao}</SelectItem>
                  <SelectItem value="restricoes">{structuralStatusLabels.restricoes}</SelectItem>
                  <SelectItem value="critico">{structuralStatusLabels.critico}</SelectItem>
                  <SelectItem value="interdicao">{structuralStatusLabels.interdicao}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Criticidade Operacional */}
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Criticidade Operacional</Label>
              <Select
                value={filters.operationalCriticality}
                onValueChange={(value) => onFiltersChange({ ...filters, operationalCriticality: value as DashboardFilters['operationalCriticality'] })}
              >
                <SelectTrigger>
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
              <Label className="text-sm text-muted-foreground">Alertas Ativos</Label>
              <Select
                value={filters.hasActiveAlerts}
                onValueChange={(value) => onFiltersChange({ ...filters, hasActiveAlerts: value as DashboardFilters['hasActiveAlerts'] })}
              >
                <SelectTrigger>
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
              <Label className="text-sm text-muted-foreground">Tipo de Vão</Label>
              <Select
                value={filters.spanType || 'all'}
                onValueChange={(value) => onFiltersChange({ ...filters, spanType: value === 'all' ? '' : value })}
              >
                <SelectTrigger>
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
              <Label className="text-sm text-muted-foreground">Tipo de Viga</Label>
              <Select
                value={filters.beamType || 'all'}
                onValueChange={(value) => onFiltersChange({ ...filters, beamType: value === 'all' ? '' : value })}
              >
                <SelectTrigger>
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
              <Label className="text-sm text-muted-foreground">Intervalo de Km</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Inicial"
                  value={filters.kmRange[0] || ''}
                  onChange={(e) => onFiltersChange({ ...filters, kmRange: [Number(e.target.value) || 0, filters.kmRange[1]] })}
                  className="text-sm"
                />
                <Input
                  type="number"
                  placeholder="Final"
                  value={filters.kmRange[1] || ''}
                  onChange={(e) => onFiltersChange({ ...filters, kmRange: [filters.kmRange[0], Number(e.target.value) || 200] })}
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Apply Button */}
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Limpar
            </Button>
            <Button onClick={() => setIsOpen(false)}>
              Aplicar Filtros
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}