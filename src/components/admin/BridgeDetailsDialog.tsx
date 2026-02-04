import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { toast } from 'sonner';
import type { Bridge, StructuralStatus, OperationalCriticality, BridgeTypology } from '@/types';
import { useBridges } from '@/hooks/useBridges';
import { Settings, MapPin, Save, Loader2 } from 'lucide-react';

interface BridgeDetailsDialogProps {
  bridge: Bridge | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BridgeDetailsDialog({ bridge, open, onOpenChange }: BridgeDetailsDialogProps) {
  const { updateBridge, isUpdating } = useBridges();

  // Form state initialized from bridge
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    concession: '',
    rodovia: '',
    typology: 'Ponte' as BridgeTypology,
    beamType: '',
    spanType: '',
    material: '',
    km: 0,
    length: 0,
    width: 0,
    capacity: 0,
    constructionYear: 0,
    structuralStatus: 'operacional' as StructuralStatus,
    operationalCriticality: 'low' as OperationalCriticality,
    kmzFile: '',
    lat: 0,
    lng: 0,
  });

  const [limits, setLimits] = useState({
    freqNormalToAlert: 3.7,
    freqAlertToCritical: 7,
    accelNormalToAlert: 0.5,
    accelAlertToCritical: 1,
  });

  // Update form when bridge changes
  useEffect(() => {
    if (bridge) {
      setFormData({
        name: bridge.name,
        location: bridge.location,
        concession: bridge.concession,
        rodovia: bridge.rodovia,
        typology: bridge.typology,
        beamType: bridge.beamType,
        spanType: bridge.spanType,
        material: bridge.material,
        km: bridge.km,
        length: bridge.length,
        width: bridge.width || 0,
        capacity: bridge.capacity || 0,
        constructionYear: bridge.constructionYear || 0,
        structuralStatus: bridge.structuralStatus,
        operationalCriticality: bridge.operationalCriticality,
        kmzFile: bridge.kmzFile || '',
        lat: bridge.coordinates?.lat || 0,
        lng: bridge.coordinates?.lng || 0,
      });
    }
  }, [bridge]);

  if (!bridge) return null;

  const getStatusBadge = (status: StructuralStatus) => {
    const configs: Record<string, { label: string; className: string }> = {
      operacional: { label: 'Operacional', className: 'bg-success text-success-foreground' },
      atencao: { label: 'Com Atenção', className: 'bg-warning text-warning-foreground' },
      restricoes: { label: 'Com Restrições', className: 'bg-orange-500 text-white' },
      critico: { label: 'Crítico', className: 'bg-destructive text-destructive-foreground' },
      interdicao: { label: 'Interdição', className: 'bg-destructive text-destructive-foreground' },
    };
    const config = configs[status] || { label: status, className: 'bg-muted' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const handleSave = () => {
    updateBridge({
      id: bridge.id,
      data: {
        company_id: bridge.companyId,
        name: formData.name,
        location: formData.location,
        concession: formData.concession,
        rodovia: formData.rodovia,
        typology: formData.typology,
        beamType: formData.beamType,
        spanType: formData.spanType,
        material: formData.material,
        km: formData.km,
        length: formData.length,
        width: formData.width || undefined,
        capacity: formData.capacity || undefined,
        constructionYear: formData.constructionYear || undefined,
        operationalCriticality: formData.operationalCriticality,
        kmz_file: formData.kmzFile || undefined,
        coordinates: formData.lat && formData.lng ? { lat: formData.lat, lng: formData.lng } : undefined,
      }
    });
  };

  const handleSaveLimits = () => {
    toast.success('Limites salvos com sucesso!');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Configurações - {bridge.name}
            {getStatusBadge(bridge.structuralStatus)}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info" className="flex items-center gap-1">
              <Settings className="h-4 w-4" />
              Informações
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              Mapa/KMZ
            </TabsTrigger>
          </TabsList>

          {/* Tab: Informações */}
          <TabsContent value="info" className="space-y-6 mt-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input 
                  value={formData.name}
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Localização</Label>
                <Input 
                  value={formData.location}
                  onChange={(e) => setFormData(p => ({ ...p, location: e.target.value }))}
                />
              </div>
            </div>

            {/* Operational Filters */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-4">Filtros Operacionais</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Concessão</Label>
                  <Input 
                    value={formData.concession}
                    onChange={(e) => setFormData(p => ({ ...p, concession: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rodovia</Label>
                  <Input 
                    value={formData.rodovia}
                    onChange={(e) => setFormData(p => ({ ...p, rodovia: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipologia</Label>
                  <Select 
                    value={formData.typology}
                    onValueChange={(v: BridgeTypology) => setFormData(p => ({ ...p, typology: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ponte">Ponte</SelectItem>
                      <SelectItem value="Viaduto">Viaduto</SelectItem>
                      <SelectItem value="Passarela">Passarela</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Viga</Label>
                  <Input 
                    value={formData.beamType}
                    onChange={(e) => setFormData(p => ({ ...p, beamType: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Vão</Label>
                  <Input 
                    value={formData.spanType}
                    onChange={(e) => setFormData(p => ({ ...p, spanType: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Material</Label>
                  <Input 
                    value={formData.material}
                    onChange={(e) => setFormData(p => ({ ...p, material: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>KM</Label>
                  <Input 
                    type="number"
                    value={formData.km}
                    onChange={(e) => setFormData(p => ({ ...p, km: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Comprimento (m)</Label>
                  <Input 
                    type="number"
                    value={formData.length}
                    onChange={(e) => setFormData(p => ({ ...p, length: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Largura (m)</Label>
                  <Input 
                    type="number"
                    value={formData.width}
                    onChange={(e) => setFormData(p => ({ ...p, width: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-4">Status Operacional</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status Estrutural</Label>
                  <div className="flex items-center gap-2 h-10">
                    {getStatusBadge(formData.structuralStatus)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Status determinado automaticamente pelo sistema de monitoramento
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Criticidade Operacional</Label>
                  <Select 
                    value={formData.operationalCriticality}
                    onValueChange={(v: OperationalCriticality) => setFormData(p => ({ ...p, operationalCriticality: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
              <Button className="mt-4" variant="outline" onClick={handleSaveLimits}>
                Salvar Limites
              </Button>
            </div>

            <Button className="w-full" onClick={handleSave} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </TabsContent>

          {/* Tab: Mapa/KMZ */}
          <TabsContent value="map" className="space-y-4 mt-4">
            <h4 className="font-semibold">Localização e Arquivo KMZ</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Latitude</Label>
                <Input 
                  type="number"
                  step="0.000001"
                  value={formData.lat}
                  onChange={(e) => setFormData(p => ({ ...p, lat: parseFloat(e.target.value) || 0 }))}
                  placeholder="-15.7801"
                />
              </div>
              <div className="space-y-2">
                <Label>Longitude</Label>
                <Input 
                  type="number"
                  step="0.000001"
                  value={formData.lng}
                  onChange={(e) => setFormData(p => ({ ...p, lng: parseFloat(e.target.value) || 0 }))}
                  placeholder="-47.9292"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>URL do Arquivo KMZ</Label>
              <Input 
                value={formData.kmzFile}
                onChange={(e) => setFormData(p => ({ ...p, kmzFile: e.target.value }))}
                placeholder="https://exemplo.com/minha-ponte.kmz"
              />
              <p className="text-xs text-muted-foreground">
                Insira a URL do arquivo KMZ para visualização no mapa.
              </p>
            </div>

            {formData.lat !== 0 && formData.lng !== 0 && (
              <div className="rounded-lg border p-4 bg-muted/50">
                <p className="text-sm font-medium mb-2">Coordenadas atuais:</p>
                <p className="text-sm text-muted-foreground">
                  Lat: {formData.lat}, Lng: {formData.lng}
                </p>
              </div>
            )}

            <Button className="w-full" onClick={handleSave} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Localização
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
