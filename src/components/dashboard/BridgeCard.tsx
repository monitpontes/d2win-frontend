import { Link } from 'react-router-dom';
import type { Bridge } from '@/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Activity, AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface BridgeCardProps {
  bridge: Bridge;
}

export function BridgeCard({ bridge }: BridgeCardProps) {
  const getStatusConfig = (status: Bridge['structuralStatus']) => {
    const configs = {
      normal: { label: 'Normal', className: 'bg-success text-success-foreground' },
      alert: { label: 'Alerta', className: 'bg-warning text-warning-foreground' },
      critical: { label: 'Crítico', className: 'bg-destructive text-destructive-foreground' },
    };
    return configs[status];
  };

  const getCriticalityConfig = (criticality: Bridge['operationalCriticality']) => {
    const configs = {
      low: { label: 'Baixa', className: 'border-success text-success' },
      medium: { label: 'Média', className: 'border-warning text-warning' },
      high: { label: 'Alta', className: 'border-destructive text-destructive' },
    };
    return configs[criticality];
  };

  const statusConfig = getStatusConfig(bridge.structuralStatus);
  const criticalityConfig = getCriticalityConfig(bridge.operationalCriticality);

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg">
      {/* Image */}
      <div className="relative h-40 overflow-hidden bg-muted">
        {bridge.image ? (
          <img
            src={bridge.image}
            alt={bridge.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Activity className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}
        {/* Status Badge */}
        <Badge className={cn('absolute right-3 top-3', statusConfig.className)}>
          {statusConfig.label}
        </Badge>
        {/* Alert Indicator */}
        {bridge.hasActiveAlerts && (
          <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-destructive px-2 py-1 text-xs text-destructive-foreground">
            <AlertTriangle className="h-3 w-3" />
            Alertas
          </div>
        )}
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-foreground">{bridge.name}</h3>
            <p className="text-sm text-muted-foreground">ID: {bridge.id}</p>
          </div>
          <Badge variant="outline" className={criticalityConfig.className}>
            Criticidade {criticalityConfig.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-3">
        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{bridge.location}</span>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Concessão:</span>
            <p className="font-medium">{bridge.concession}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Sensores:</span>
            <p className="font-medium">{bridge.sensorCount} ativos</p>
          </div>
        </div>

        {/* Last Update */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            Atualizado {formatDistanceToNow(new Date(bridge.lastUpdate), { addSuffix: true, locale: ptBR })}
          </span>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Button asChild variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground">
          <Link to={`/bridge/${bridge.id}`} className="flex items-center gap-2">
            Ver detalhes
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
