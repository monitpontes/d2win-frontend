import { useState, useMemo, useCallback } from 'react';
import type { DashboardFilters } from '@/types';
import { mockBridges, mockCompanies } from '@/data/mockData';
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
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
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
  beamType: '',
  spanType: '',
  material: '',
  kmRange: [0, 200],
  hasActiveAlerts: null,
  companyId: 'all',
};

export function DashboardFiltersComponent({ filters, onFiltersChange }: DashboardFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Get unique values for filters
  const filterOptions = useMemo(() => {
    const concessions = [...new Set(mockBridges.map((b) => b.concession))];
    const beamTypes = [...new Set(mockBridges.map((b) => b.beamType))];
    const spanTypes = [...new Set(mockBridges.map((b) => b.spanType))];
    const materials = [...new Set(mockBridges.map((b) => b.material))];
    return { concessions, beamTypes, spanTypes, materials };
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
    if (filters.beamType) count++;
    if (filters.spanType) count++;
    if (filters.material) count++;
    if (filters.hasActiveAlerts !== null) count++;
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

      {/* Quick Filters */}
      <div className="flex gap-2">
        <Select
          value={filters.structuralStatus}
          onValueChange={(value) => onFiltersChange({ ...filters, structuralStatus: value as DashboardFilters['structuralStatus'] })}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="alert">Alerta</SelectItem>
            <SelectItem value="critical">Crítico</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.operationalCriticality}
          onValueChange={(value) => onFiltersChange({ ...filters, operationalCriticality: value as DashboardFilters['operationalCriticality'] })}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Criticidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="low">Baixa</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
          </SelectContent>
        </Select>

        {/* Advanced Filters */}
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
          <SheetContent className="w-[400px] sm:w-[540px]">
            <SheetHeader>
              <SheetTitle className="flex items-center justify-between">
                Filtros Avançados
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              {/* Concession */}
              <div className="space-y-2">
                <Label>Concessão</Label>
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

              {/* Beam Type */}
              <div className="space-y-2">
                <Label>Tipo de Viga</Label>
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

              {/* Span Type */}
              <div className="space-y-2">
                <Label>Tipo de Vão</Label>
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

              {/* Material */}
              <div className="space-y-2">
                <Label>Material</Label>
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

              {/* KM Range */}
              <div className="space-y-4">
                <Label>Intervalo de KM: {filters.kmRange[0]} - {filters.kmRange[1]}</Label>
                <Slider
                  value={filters.kmRange}
                  onValueChange={(value) => onFiltersChange({ ...filters, kmRange: value as [number, number] })}
                  min={0}
                  max={200}
                  step={5}
                />
              </div>

              {/* Has Active Alerts */}
              <div className="flex items-center justify-between">
                <Label htmlFor="hasAlerts">Apenas com alertas ativos</Label>
                <Switch
                  id="hasAlerts"
                  checked={filters.hasActiveAlerts === true}
                  onCheckedChange={(checked) => onFiltersChange({ ...filters, hasActiveAlerts: checked ? true : null })}
                />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
