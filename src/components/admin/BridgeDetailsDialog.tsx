import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Bridge } from '@/types';
import { mockUsers } from '@/data/mockData';

interface BridgeDetailsDialogProps {
  bridge: Bridge | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BridgeDetailsDialog({ bridge, open, onOpenChange }: BridgeDetailsDialogProps) {
  const [limits, setLimits] = useState({
    freqNormalToAlert: 3.7,
    freqAlertToCritical: 7,
    accelNormalToAlert: 0.5,
    accelAlertToCritical: 1,
  });

  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({
    'user-1': true,
    'user-2': true,
    'user-3': true,
  });

  if (!bridge) return null;

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      operacional: { label: 'Normal', className: 'bg-success text-success-foreground' },
      atencao: { label: 'Alerta', className: 'bg-warning text-warning-foreground' },
      restricoes: { label: 'Alerta', className: 'bg-warning text-warning-foreground' },
      critico: { label: 'Crítica', className: 'bg-destructive text-destructive-foreground' },
      interdicao: { label: 'Crítica', className: 'bg-destructive text-destructive-foreground' },
    };
    const config = configs[status] || { label: status, className: 'bg-muted' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const handleSaveLimits = () => {
    toast.success('Limites salvos com sucesso!');
  };

  const toggleUserPermission = (userId: string) => {
    setUserPermissions(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const companyUsers = mockUsers.filter(u => u.companyId === bridge.companyId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Ponte - {bridge.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Data de Instalação</p>
              <p className="font-medium">{bridge.constructionYear || '15/03/2023'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Quantidade de Sensores</p>
              <p className="font-medium">{bridge.sensorCount} sensores</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status Atual</p>
              <div className="mt-1">{getStatusBadge(bridge.structuralStatus)}</div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Última Atualização</p>
              <p className="font-medium">{bridge.lastUpdate}</p>
            </div>
          </div>

          {/* Limits Configuration */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-4">Configuração de Limites</h4>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <p className="text-sm font-medium">Limites de Frequência</p>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Normal → Alerta (Hz)</Label>
                    <Input 
                      type="number" 
                      step="0.1"
                      value={limits.freqNormalToAlert}
                      onChange={(e) => setLimits(prev => ({ ...prev, freqNormalToAlert: parseFloat(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Alerta → Crítico (Hz)</Label>
                    <Input 
                      type="number" 
                      step="0.1"
                      value={limits.freqAlertToCritical}
                      onChange={(e) => setLimits(prev => ({ ...prev, freqAlertToCritical: parseFloat(e.target.value) }))}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium">Limites de Aceleração</p>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Normal → Alerta (g)</Label>
                    <Input 
                      type="number" 
                      step="0.1"
                      value={limits.accelNormalToAlert}
                      onChange={(e) => setLimits(prev => ({ ...prev, accelNormalToAlert: parseFloat(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Alerta → Crítico (g)</Label>
                    <Input 
                      type="number" 
                      step="0.1"
                      value={limits.accelAlertToCritical}
                      onChange={(e) => setLimits(prev => ({ ...prev, accelAlertToCritical: parseFloat(e.target.value) }))}
                    />
                  </div>
                </div>
              </div>
            </div>
            <Button className="mt-4" onClick={handleSaveLimits}>
              Salvar Limites
            </Button>
          </div>

          {/* Status Indicators */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Indicadores de Status</h4>
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium mb-1">Frequência</p>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-success"></span>
                    Normal (≤ {limits.freqNormalToAlert} Hz)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-warning"></span>
                    Alerta ({limits.freqNormalToAlert}-{limits.freqAlertToCritical} Hz)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-destructive"></span>
                    Crítico ({'>'} {limits.freqAlertToCritical} Hz)
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Aceleração</p>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-success"></span>
                    Normal (≤ {limits.accelNormalToAlert} g)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-warning"></span>
                    Alerta ({limits.accelNormalToAlert}-{limits.accelAlertToCritical} g)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-destructive"></span>
                    Crítico ({'>'} {limits.accelAlertToCritical} g)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Access Permissions */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Permissões de Acesso</h4>
            <div className="space-y-3">
              {companyUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className={cn(
                        user.role === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      )}>
                        {user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      {user.role === 'admin' ? 'admin' : 'gestor'}
                    </Badge>
                    <Switch 
                      checked={userPermissions[user.id] ?? true}
                      onCheckedChange={() => toggleUserPermission(user.id)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
