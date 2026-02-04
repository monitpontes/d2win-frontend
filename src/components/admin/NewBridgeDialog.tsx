import { useState } from 'react';
import { Loader2, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { bridgesService, devicesService } from '@/lib/api';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { BridgeTypology } from '@/types';

interface NewBridgeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  onSuccess?: () => void;
}

interface NewBridgeForm {
  name: string;
  location: string;
  rodovia: string;
  typology: BridgeTypology;
  frequencySensorCount: number;
  accelerationSensorCount: number;
}

const initialForm: NewBridgeForm = {
  name: '',
  location: '',
  rodovia: '',
  typology: 'Ponte',
  frequencySensorCount: 2,
  accelerationSensorCount: 2,
};

export function NewBridgeDialog({ open, onOpenChange, companyId, onSuccess }: NewBridgeDialogProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<NewBridgeForm>(initialForm);
  const [isCreating, setIsCreating] = useState(false);

  const totalSensors = form.frequencySensorCount + form.accelerationSensorCount;

  const updateField = <K extends keyof NewBridgeForm>(field: K, value: NewBridgeForm[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const adjustSensorCount = (type: 'frequency' | 'acceleration', delta: number) => {
    const field = type === 'frequency' ? 'frequencySensorCount' : 'accelerationSensorCount';
    const currentValue = form[field];
    const newValue = Math.max(0, Math.min(10, currentValue + delta));
    updateField(field, newValue);
  };

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error('Nome da ponte é obrigatório');
      return;
    }

    if (!companyId) {
      toast.error('Selecione uma empresa primeiro');
      return;
    }

    setIsCreating(true);

    try {
      // 1. Criar a ponte
      const bridge = await bridgesService.createBridge({
        name: form.name,
        company_id: companyId,
        location: form.location,
        rodovia: form.rodovia,
        typology: form.typology,
      });

      // 2. Criar sensores de frequência
      const sensorPromises: Promise<any>[] = [];

      for (let i = 1; i <= form.frequencySensorCount; i++) {
        sensorPromises.push(
          devicesService.createDevice({
            bridge_id: bridge.id,
            company_id: companyId,
            type: 'frequency',
            name: `FREQ-${bridge.id.slice(-4)}-${i}`,
            status: 'offline',
          })
        );
      }

      // 3. Criar sensores de aceleração
      for (let i = 1; i <= form.accelerationSensorCount; i++) {
        sensorPromises.push(
          devicesService.createDevice({
            bridge_id: bridge.id,
            company_id: companyId,
            type: 'acceleration',
            name: `ACCEL-${bridge.id.slice(-4)}-${i}`,
            status: 'offline',
          })
        );
      }

      // Executar criação de sensores em paralelo
      await Promise.all(sensorPromises);

      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: ['bridges'] });
      queryClient.invalidateQueries({ queryKey: ['devices'] });

      toast.success(`Ponte "${form.name}" e ${totalSensors} sensores criados com sucesso!`);
      
      // Reset form
      setForm(initialForm);
      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao criar ponte:', error);
      toast.error(error.response?.data?.message || 'Erro ao criar ponte');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setForm(initialForm);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Ponte</DialogTitle>
          <DialogDescription>
            Crie uma nova ponte com sensores configurados automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Dados básicos */}
          <div className="space-y-2">
            <Label htmlFor="bridge-name">Nome *</Label>
            <Input
              id="bridge-name"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Nome da ponte"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="bridge-location">Localização</Label>
              <Input
                id="bridge-location"
                value={form.location}
                onChange={(e) => updateField('location', e.target.value)}
                placeholder="Localização"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bridge-rodovia">Rodovia</Label>
              <Input
                id="bridge-rodovia"
                value={form.rodovia}
                onChange={(e) => updateField('rodovia', e.target.value)}
                placeholder="Ex: SP-150"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bridge-typology">Tipologia</Label>
            <Select
              value={form.typology}
              onValueChange={(value) => updateField('typology', value as BridgeTypology)}
            >
              <SelectTrigger id="bridge-typology">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ponte">Ponte</SelectItem>
                <SelectItem value="Viaduto">Viaduto</SelectItem>
                <SelectItem value="Passarela">Passarela</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Configuração de sensores */}
          <Card className="border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Quantidade de Sensores</CardTitle>
              <CardDescription className="text-xs">
                Os dispositivos serão criados automaticamente no banco de dados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Frequência */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Frequência</p>
                  <p className="text-xs text-muted-foreground">Sensores de vibração</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => adjustSensorCount('frequency', -1)}
                    disabled={form.frequencySensorCount <= 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-medium">{form.frequencySensorCount}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => adjustSensorCount('frequency', 1)}
                    disabled={form.frequencySensorCount >= 10}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Aceleração */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Aceleração</p>
                  <p className="text-xs text-muted-foreground">Acelerômetros</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => adjustSensorCount('acceleration', -1)}
                    disabled={form.accelerationSensorCount <= 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-medium">{form.accelerationSensorCount}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => adjustSensorCount('acceleration', 1)}
                    disabled={form.accelerationSensorCount >= 10}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Total */}
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground text-center">
                  <span className="font-medium text-foreground">{totalSensors}</span> dispositivos serão criados automaticamente
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isCreating}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={isCreating || !form.name.trim()}>
            {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isCreating ? 'Criando...' : 'Criar Ponte e Sensores'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
