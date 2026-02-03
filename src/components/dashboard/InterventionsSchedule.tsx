import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Plus, Download, Trash2, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Intervention } from '@/types';
import { useInterventions, type NewIntervention } from '@/hooks/useInterventions';
import { CreateInterventionDialog } from '@/components/interventions/CreateInterventionDialog';
import { exportInterventions } from '@/lib/exportUtils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

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
  const { interventions, addIntervention, updateIntervention, deleteIntervention } = useInterventions();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingIntervention, setEditingIntervention] = useState<(NewIntervention & { id: string }) | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreate = (data: NewIntervention) => {
    addIntervention(data);
    toast.success('Intervenção criada com sucesso!');
  };

  const handleEdit = (intervention: Intervention) => {
    setEditingIntervention({
      id: intervention.id,
      bridgeId: intervention.bridgeId,
      priority: intervention.priority,
      type: intervention.type,
      description: intervention.description,
      scheduledDate: intervention.scheduledDate,
      estimatedDuration: intervention.estimatedDuration,
      team: intervention.team,
    });
  };

  const handleUpdate = (data: NewIntervention) => {
    if (editingIntervention?.id) {
      updateIntervention(editingIntervention.id, data);
      setEditingIntervention(null);
      toast.success('Intervenção atualizada com sucesso!');
    }
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteIntervention(deleteId);
      setDeleteId(null);
      toast.success('Intervenção excluída com sucesso!');
    }
  };

  const handleExport = () => {
    exportInterventions(interventions);
    toast.success('Exportação iniciada!');
  };

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Programação de Intervenções</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            CSV
          </Button>
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Nova
          </Button>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        {interventions.length} intervenções agendadas
      </p>

      {/* Interventions List */}
      <div className="space-y-3">
        {interventions.map((intervention) => (
          <div
            key={intervention.id}
            className={cn(
              'rounded-lg border-l-4 bg-background p-4 hover:shadow-md transition-all group',
              getTypeStyle(intervention.type)
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
              <div className="flex flex-wrap items-center gap-2">
                <span 
                  className="font-medium cursor-pointer hover:text-primary hover:underline"
                  onClick={() => navigate(`/bridge/${intervention.bridgeId}`)}
                >
                  {intervention.bridgeName}
                </span>
                <Badge className={cn(getPriorityColor(intervention.priority))}>
                  {intervention.priority}
                </Badge>
                <Badge variant="outline">{intervention.type}</Badge>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(intervention);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteId(intervention.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
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

        {interventions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma intervenção agendada.</p>
            <Button variant="outline" className="mt-4" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Criar primeira intervenção
            </Button>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <CreateInterventionDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={handleCreate}
      />

      {/* Edit Dialog */}
      {editingIntervention && (
        <CreateInterventionDialog
          open={!!editingIntervention}
          onOpenChange={(open) => !open && setEditingIntervention(null)}
          onSubmit={handleUpdate}
          editData={editingIntervention}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta intervenção? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
