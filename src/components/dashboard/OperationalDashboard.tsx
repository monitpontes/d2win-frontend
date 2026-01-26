import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Wrench, Ban, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { StructuralProblem } from '@/types';
import { getStructuralProblems } from '@/data/mockData';

const getTypeColor = (type: StructuralProblem['type']) => {
  const colors: Record<StructuralProblem['type'], string> = {
    Fissura: 'bg-destructive/10 text-destructive border-destructive',
    Corrosão: 'bg-warning/10 text-warning border-warning',
    Desgaste: 'bg-amber-500/10 text-amber-600 border-amber-500',
    Trinca: 'bg-orange-500/10 text-orange-600 border-orange-500',
    Desplacamento: 'bg-rose-500/10 text-rose-600 border-rose-500',
  };
  return colors[type];
};

const getStatusColor = (status: StructuralProblem['status']) => {
  const colors: Record<StructuralProblem['status'], string> = {
    'Em Análise': 'bg-warning/10 text-warning',
    'Corrigido': 'bg-success/10 text-success',
    'Agendado': 'bg-primary/10 text-primary',
    'Pendente': 'bg-muted text-muted-foreground',
  };
  return colors[status];
};

export function OperationalDashboard() {
  const navigate = useNavigate();
  const problems = useMemo(() => getStructuralProblems(), []);

  const stats = useMemo(() => ({
    totalProblems: problems.length,
    pendingMaintenance: problems.filter(p => p.status === 'Pendente' || p.status === 'Agendado').length,
    partialRestrictions: 2,
    inspectionsCompleted: 45,
  }), [problems]);

  // Show only last 90 days problems (or all for demo)
  const recentProblems = problems.slice(0, 6);

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="h-5 w-5 text-warning" />
        <h2 className="text-lg font-semibold">Dashboard Operacional</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Histórico de problemas estruturais e status dos elementos das pontes
      </p>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="rounded-lg border bg-background p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Problemas Detectados</p>
              <p className="text-2xl font-bold mt-1">{stats.totalProblems}</p>
              <p className="text-xs text-muted-foreground">Últimos 90 dias</p>
            </div>
            <AlertTriangle className="h-5 w-5 text-warning" />
          </div>
        </div>

        <div className="rounded-lg border bg-background p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Manutenções Pendentes</p>
              <p className="text-2xl font-bold mt-1">{stats.pendingMaintenance}</p>
              <p className="text-xs text-muted-foreground">Requer atenção</p>
            </div>
            <Wrench className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        <div className="rounded-lg border bg-background p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Interdições Parciais</p>
              <p className="text-2xl font-bold mt-1">{stats.partialRestrictions}</p>
              <p className="text-xs text-muted-foreground">Faixas bloqueadas</p>
            </div>
            <Ban className="h-5 w-5 text-destructive" />
          </div>
        </div>

        <div className="rounded-lg border bg-background p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Inspeções Realizadas</p>
              <p className="text-2xl font-bold mt-1">{stats.inspectionsCompleted}</p>
              <p className="text-xs text-muted-foreground">Últimos 180 dias</p>
            </div>
            <CheckCircle className="h-5 w-5 text-success" />
          </div>
        </div>
      </div>

      {/* Problems Table */}
      <div>
        <h3 className="text-sm font-medium mb-3">Registro de Problemas Estruturais (Últimos 90 dias)</h3>
        <div className="space-y-3">
          {recentProblems.map((problem) => (
            <div
              key={problem.id}
              onClick={() => navigate(`/bridge/${problem.bridgeId}`)}
              className="rounded-lg border bg-background p-4 hover:border-primary/50 cursor-pointer transition-colors"
            >
              <div className="grid gap-4 sm:grid-cols-5">
                <div>
                  <p className="text-xs text-muted-foreground">Ponte</p>
                  <p className="font-medium">{problem.bridgeName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tipo</p>
                  <Badge variant="outline" className={cn('mt-1', getTypeColor(problem.type))}>
                    {problem.type}
                  </Badge>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Descrição</p>
                  <p className="text-sm">{problem.description}</p>
                </div>
                <div className="flex items-center justify-between sm:flex-col sm:items-end">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Data</p>
                    <p className="text-sm">{problem.date}</p>
                  </div>
                  <Badge className={cn('mt-1', getStatusColor(problem.status))}>
                    {problem.status}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
