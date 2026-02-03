import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { mockBridges } from '@/data/mockData';
import type { InterventionPriority, InterventionType } from '@/types';
import type { NewIntervention } from '@/hooks/useInterventions';

interface CreateInterventionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: NewIntervention) => void;
  defaultBridgeId?: string;
  editData?: NewIntervention & { id?: string };
}

const priorityOptions: InterventionPriority[] = ['Urgente', 'Média', 'Baixa'];
const typeOptions: InterventionType[] = ['Reparo', 'Inspeção', 'Upgrade', 'Manutenção'];
const teamOptions = [
  'Equipe A - Inspeção',
  'Equipe B - Manutenção',
  'Equipe C - Manutenção',
  'Equipe D - Serviços Gerais',
  'Equipe E - Modernização',
];
const durationOptions = ['1 dias', '2 dias', '3 dias', '5 dias', '7 dias', '10 dias', '14 dias', '30 dias'];

export function CreateInterventionDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  defaultBridgeId,
  editData 
}: CreateInterventionDialogProps) {
  const [bridgeId, setBridgeId] = useState(editData?.bridgeId || defaultBridgeId || '');
  const [priority, setPriority] = useState<InterventionPriority>(editData?.priority || 'Média');
  const [type, setType] = useState<InterventionType>(editData?.type || 'Manutenção');
  const [description, setDescription] = useState(editData?.description || '');
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(
    editData?.scheduledDate ? new Date(editData.scheduledDate) : undefined
  );
  const [estimatedDuration, setEstimatedDuration] = useState(editData?.estimatedDuration || '');
  const [team, setTeam] = useState(editData?.team || '');

  const isEdit = !!editData?.id;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bridgeId || !description || !scheduledDate || !estimatedDuration || !team) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    onSubmit({
      bridgeId,
      priority,
      type,
      description,
      scheduledDate: format(scheduledDate, 'yyyy-MM-dd'),
      estimatedDuration,
      team,
    });

    // Reset form
    if (!isEdit) {
      setBridgeId(defaultBridgeId || '');
      setPriority('Média');
      setType('Manutenção');
      setDescription('');
      setScheduledDate(undefined);
      setEstimatedDuration('');
      setTeam('');
    }
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Intervenção' : 'Nova Intervenção'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Atualize os dados da intervenção.' : 'Preencha os dados para agendar uma nova intervenção.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Bridge Selection */}
          <div className="space-y-2">
            <Label htmlFor="bridge">Ponte *</Label>
            <Select value={bridgeId} onValueChange={setBridgeId} disabled={!!defaultBridgeId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma ponte" />
              </SelectTrigger>
              <SelectContent>
                {mockBridges.map((bridge) => (
                  <SelectItem key={bridge.id} value={bridge.id}>
                    {bridge.name} - {bridge.rodovia}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select value={type} onValueChange={(v: InterventionType) => setType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade *</Label>
              <Select value={priority} onValueChange={(v: InterventionPriority) => setPriority(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva a intervenção..."
              rows={3}
            />
          </div>

          {/* Date and Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Agendada *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !scheduledDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduledDate ? format(scheduledDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={scheduledDate}
                    onSelect={setScheduledDate}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duração Estimada *</Label>
              <Select value={estimatedDuration} onValueChange={setEstimatedDuration}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Team */}
          <div className="space-y-2">
            <Label htmlFor="team">Equipe Responsável *</Label>
            <Select value={team} onValueChange={setTeam}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma equipe" />
              </SelectTrigger>
              <SelectContent>
                {teamOptions.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {isEdit ? 'Salvar Alterações' : 'Criar Intervenção'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
