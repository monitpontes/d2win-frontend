import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import type { Sensor } from '@/types';

interface DeviceParametersDialogProps {
  device: Sensor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeviceParametersDialog({ device, open, onOpenChange }: DeviceParametersDialogProps) {
  const [params, setParams] = useState({
    acquisitionInterval: '60',
    samples: '4096',
    samplingFreq: '2000',
    activityThreshold: '0.9',
    operationMode: 'acel',
    executionMode: 'debug',
    testMode: 'completo',
    firmwareVersion: '3.4.0_autoregister',
  });
  const [autoRestart, setAutoRestart] = useState(false);
  const [firmwareFile, setFirmwareFile] = useState<File | null>(null);

  if (!device) return null;

  const handleSaveParams = () => {
    toast.success('Parâmetros salvos com sucesso!');
    onOpenChange(false);
  };

  const handleStartOTA = () => {
    if (firmwareFile) {
      toast.info('Iniciando atualização OTA...');
    } else {
      toast.error('Selecione um arquivo de firmware primeiro');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Parâmetros - {device.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* OTA Update Section */}
          <div className="space-y-3">
            <h4 className="font-semibold">Atualização OTA</h4>
            <p className="text-sm text-muted-foreground">Arquivo de Firmware (.bin)</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Escolher arquivo</span>
                <Input 
                  type="file" 
                  accept=".bin"
                  className="flex-1"
                  onChange={(e) => setFirmwareFile(e.target.files?.[0] || null)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {firmwareFile ? firmwareFile.name : 'Nenhum arquivo escolhido'}
              </p>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="auto-restart" 
                  checked={autoRestart}
                  onCheckedChange={(checked) => setAutoRestart(checked === true)}
                />
                <Label htmlFor="auto-restart" className="text-sm">
                  Reiniciar automaticamente após upload
                </Label>
              </div>
              <Button variant="outline" className="w-full" onClick={handleStartOTA}>
                <Download className="h-4 w-4 mr-2" />
                Iniciar Atualização OTA
              </Button>
            </div>
          </div>

          {/* Device Parameters */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Device Number</Label>
              <Input value={device.name} disabled />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Intervalo Aquisição</Label>
              <Select 
                value={params.acquisitionInterval} 
                onValueChange={(v) => setParams(p => ({ ...p, acquisitionInterval: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30</SelectItem>
                  <SelectItem value="60">60</SelectItem>
                  <SelectItem value="120">120</SelectItem>
                  <SelectItem value="300">300</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Amostras</Label>
              <Select 
                value={params.samples} 
                onValueChange={(v) => setParams(p => ({ ...p, samples: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1024">1024</SelectItem>
                  <SelectItem value="2048">2048</SelectItem>
                  <SelectItem value="4096">4096</SelectItem>
                  <SelectItem value="8192">8192</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Freq Amostragem</Label>
              <Select 
                value={params.samplingFreq} 
                onValueChange={(v) => setParams(p => ({ ...p, samplingFreq: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1000">1000</SelectItem>
                  <SelectItem value="2000">2000</SelectItem>
                  <SelectItem value="4000">4000</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Activity Threshold</Label>
              <Select 
                value={params.activityThreshold} 
                onValueChange={(v) => setParams(p => ({ ...p, activityThreshold: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">0.5</SelectItem>
                  <SelectItem value="0.7">0.7</SelectItem>
                  <SelectItem value="0.9">0.9</SelectItem>
                  <SelectItem value="1.0">1.0</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Modo Operação</Label>
              <Select 
                value={params.operationMode} 
                onValueChange={(v) => setParams(p => ({ ...p, operationMode: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acel">acel</SelectItem>
                  <SelectItem value="freq">freq</SelectItem>
                  <SelectItem value="both">both</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Modo Execução</Label>
              <Select 
                value={params.executionMode} 
                onValueChange={(v) => setParams(p => ({ ...p, executionMode: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="debug">debug</SelectItem>
                  <SelectItem value="production">production</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Modo Teste</Label>
              <Select 
                value={params.testMode} 
                onValueChange={(v) => setParams(p => ({ ...p, testMode: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completo">completo</SelectItem>
                  <SelectItem value="parcial">parcial</SelectItem>
                  <SelectItem value="off">off</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Firmware Version</Label>
            <Input value={params.firmwareVersion} disabled />
          </div>

          <Button className="w-full" onClick={handleSaveParams}>
            Salvar Parâmetros
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
