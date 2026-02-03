import { useState } from 'react';
import { Building2, Plus, Pencil, Trash2, MoreVertical, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCompanies } from '@/hooks/useCompanies';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Company } from '@/types';

interface AdminSidebarProps {
  selectedCompanyId: string;
  onSelectCompany: (companyId: string) => void;
}

export function AdminSidebar({ selectedCompanyId, onSelectCompany }: AdminSidebarProps) {
  const { companies, isLoading, createCompany, updateCompany, deleteCompany, isCreating, isUpdating, isDeleting } = useCompanies();
  
  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState(false);
  const [isEditCompanyOpen, setIsEditCompanyOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companyName, setCompanyName] = useState('');

  const handleAddCompany = () => {
    if (companyName.trim()) {
      createCompany({ name: companyName.trim() });
      setCompanyName('');
      setIsAddCompanyOpen(false);
    }
  };

  const handleEditCompany = () => {
    if (companyName.trim() && selectedCompany) {
      updateCompany({ id: selectedCompany.id, data: { name: companyName.trim() } });
      setCompanyName('');
      setSelectedCompany(null);
      setIsEditCompanyOpen(false);
    }
  };

  const handleDeleteCompany = () => {
    if (selectedCompany) {
      deleteCompany(selectedCompany.id);
      setSelectedCompany(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const openEditDialog = (company: Company, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCompany(company);
    setCompanyName(company.name);
    setIsEditCompanyOpen(true);
  };

  const openDeleteDialog = (company: Company, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCompany(company);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="w-52 min-h-screen border-r bg-card flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">Empresas</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6"
            onClick={() => {
              setCompanyName('');
              setIsAddCompanyOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Companies List */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : companies.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma empresa</p>
            <p className="text-xs">Clique em + para adicionar</p>
          </div>
        ) : (
          companies.map((company) => (
            <div
              key={company.id}
              className={cn(
                "group relative w-full text-left px-3 py-2.5 rounded-lg transition-colors mb-1 cursor-pointer",
                selectedCompanyId === company.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
              onClick={() => onSelectCompany(company.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{company.name}</p>
                  <p className={cn(
                    "text-xs",
                    selectedCompanyId === company.id
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground"
                  )}>
                    ID: {company.id.slice(-6)}
                  </p>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0",
                        selectedCompanyId === company.id
                          ? "hover:bg-primary-foreground/20 text-primary-foreground"
                          : "hover:bg-muted-foreground/20"
                      )}
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-32">
                    <DropdownMenuItem onClick={(e) => openEditDialog(company, e as unknown as React.MouseEvent)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => openDeleteDialog(company, e as unknown as React.MouseEvent)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Company Dialog */}
      <Dialog open={isAddCompanyOpen} onOpenChange={setIsAddCompanyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Empresa</DialogTitle>
            <DialogDescription>Adicione uma nova empresa ao sistema.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Nome da Empresa</Label>
              <Input
                id="company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Nome da empresa"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCompanyOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddCompany} disabled={isCreating}>
              {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Company Dialog */}
      <Dialog open={isEditCompanyOpen} onOpenChange={setIsEditCompanyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
            <DialogDescription>Atualize as informações da empresa.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-company-name">Nome da Empresa</Label>
              <Input
                id="edit-company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Nome da empresa"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditCompanyOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditCompany} disabled={isUpdating}>
              {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Empresa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a empresa "{selectedCompany?.name}"? 
              Esta ação não pode ser desfeita e todos os dados associados serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCompany}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
