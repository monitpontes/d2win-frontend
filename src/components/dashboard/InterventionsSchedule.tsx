import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Intervention } from '@/types';
import { getInterventions } from '@/data/mockData';

const getPriorityColor = (priority: Intervention['priority']) => {
  const colors: Record<Intervention['priority'], string> = {
    Urgente: 'bg-destructive text-destructive-foreground',
    Média: 'bg-primary text-primary-foreground',
    Baixa: 'bg-muted text-muted-foreground',
  };
  return colors[priority];
};

const getTypeStyle = (type: Intervention['type']) => {
  const styles: Record<Intervention['type'], string> = {
    Reparo: 'border-destructive',
    Inspeção: 'border-warning',
    Upgrade: 'border-primary',
    Manutenção: 'border-success',
  };
  return styles[type];
};

export function InterventionsSchedule() {
  const navigate = useNavigate();
  const interventions = useMemo(() => getInterventions(), []);

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center gap-2 mb-2">
        <Calendar className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Programação de Intervenções</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        {interventions.length} intervenções agendadas
      </p>

      {/* Interventions List */}
      <div className="space-y-3">
        {interventions.map((intervention) => (
          <div
            key={intervention.id}
            onClick={() => navigate(`/bridge/${intervention.bridgeId}`)}
            className={cn(
              'rounded-lg border-l-4 bg-background p-4 hover:shadow-md cursor-pointer transition-all',
              getTypeStyle(intervention.type)
            )}
          >
            <div className="flex flex-wrap items-start gap-2 mb-2">
              <span className="font-medium">{intervention.bridgeName}</span>
              <Badge className={cn(getPriorityColor(intervention.priority))}>
                {intervention.priority}
              </Badge>
              <Badge variant="outline">{intervention.type}</Badge>
            </div>
            
            <p className="text-sm text-muted-foreground mb-3">
              {intervention.description}
            </p>

            <div className="grid gap-4 sm:grid-cols-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Data Agendada</p>
                <p className="font-medium">{intervention.scheduledDate}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Duração Estimada</p>
                <p className="font-medium">{intervention.estimatedDuration}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Equipe</p>
                <p className="font-medium">{intervention.team}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
