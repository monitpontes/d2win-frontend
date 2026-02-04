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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Company } from '@/types';
import type { CreateCompanyData } from '@/lib/api';

interface AdminSidebarProps {
  selectedCompanyId: string;
  onSelectCompany: (companyId: string) => void;
}

const emptyCompanyForm: CreateCompanyData = {
  name: '',
  description: '',
  cnpj: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
};

export function AdminSidebar({ selectedCompanyId, onSelectCompany }: AdminSidebarProps) {
  const { companies, isLoading, createCompany, updateCompany, deleteCompany, isCreating, isUpdating, isDeleting } = useCompanies();
  
  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState(false);
  const [isEditCompanyOpen, setIsEditCompanyOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companyForm, setCompanyForm] = useState<CreateCompanyData>(emptyCompanyForm);

  const resetForm = () => {
    setCompanyForm(emptyCompanyForm);
  };

  const handleAddCompany = () => {
    if (companyForm.name.trim()) {
      createCompany(companyForm);
      resetForm();
      setIsAddCompanyOpen(false);
    }
  };

  const handleEditCompany = () => {
    if (companyForm.name.trim() && selectedCompany) {
      updateCompany({ id: selectedCompany.id, data: companyForm });
      resetForm();
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
    setCompanyForm({
      name: company.name,
      description: company.description || '',
      cnpj: company.cnpj || '',
      email: company.email || '',
      phone: company.phone || '',
      address: company.address || '',
      city: company.city || '',
      state: company.state || '',
      zipCode: company.zipCode || '',
      contactName: company.contactName || '',
      contactEmail: company.contactEmail || '',
      contactPhone: company.contactPhone || '',
    });
    setIsEditCompanyOpen(true);
  };

  const openDeleteDialog = (company: Company, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCompany(company);
    setIsDeleteDialogOpen(true);
  };

  const updateField = (field: keyof CreateCompanyData, value: string) => {
    setCompanyForm(prev => ({ ...prev, [field]: value }));
  };

  // Formulário compartilhado para criar/editar empresa
  const CompanyFormContent = () => (
    <Tabs defaultValue="info" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="info">Informações</TabsTrigger>
        <TabsTrigger value="contact">Contato</TabsTrigger>
        <TabsTrigger value="address">Endereço</TabsTrigger>
      </TabsList>

      <TabsContent value="info" className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="company-name">Nome da Empresa *</Label>
          <Input
            id="company-name"
            value={companyForm.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="Nome da empresa"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company-cnpj">CNPJ</Label>
          <Input
            id="company-cnpj"
            value={companyForm.cnpj}
            onChange={(e) => updateField('cnpj', e.target.value)}
            placeholder="00.000.000/0000-00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company-description">Descrição</Label>
          <Input
            id="company-description"
            value={companyForm.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Descrição da empresa"
          />
        </div>
      </TabsContent>

      <TabsContent value="contact" className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="company-email">E-mail Corporativo</Label>
          <Input
            id="company-email"
            type="email"
            value={companyForm.email}
            onChange={(e) => updateField('email', e.target.value)}
            placeholder="contato@empresa.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company-phone">Telefone</Label>
          <Input
            id="company-phone"
            value={companyForm.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            placeholder="(00) 0000-0000"
          />
        </div>
        <div className="border-t pt-4 mt-4">
          <p className="text-sm font-medium mb-3">Contato Responsável</p>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="contact-name">Nome</Label>
              <Input
                id="contact-name"
                value={companyForm.contactName}
                onChange={(e) => updateField('contactName', e.target.value)}
                placeholder="Nome do responsável"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">E-mail</Label>
              <Input
                id="contact-email"
                type="email"
                value={companyForm.contactEmail}
                onChange={(e) => updateField('contactEmail', e.target.value)}
                placeholder="responsavel@empresa.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-phone">Telefone</Label>
              <Input
                id="contact-phone"
                value={companyForm.contactPhone}
                onChange={(e) => updateField('contactPhone', e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="address" className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="company-address">Endereço</Label>
          <Input
            id="company-address"
            value={companyForm.address}
            onChange={(e) => updateField('address', e.target.value)}
            placeholder="Rua, número, complemento"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="company-city">Cidade</Label>
            <Input
              id="company-city"
              value={companyForm.city}
              onChange={(e) => updateField('city', e.target.value)}
              placeholder="Cidade"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-state">Estado</Label>
            <Input
              id="company-state"
              value={companyForm.state}
              onChange={(e) => updateField('state', e.target.value)}
              placeholder="UF"
              maxLength={2}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="company-zipcode">CEP</Label>
          <Input
            id="company-zipcode"
            value={companyForm.zipCode}
            onChange={(e) => updateField('zipCode', e.target.value)}
            placeholder="00000-000"
          />
        </div>
      </TabsContent>
    </Tabs>
  );

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
              resetForm();
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
                    {company.cnpj || `ID: ${company.id.slice(-6)}`}
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Empresa</DialogTitle>
            <DialogDescription>Cadastre uma nova empresa no sistema.</DialogDescription>
          </DialogHeader>
          <CompanyFormContent />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCompanyOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddCompany} disabled={isCreating || !companyForm.name.trim()}>
              {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Company Dialog */}
      <Dialog open={isEditCompanyOpen} onOpenChange={setIsEditCompanyOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
            <DialogDescription>Atualize as informações da empresa.</DialogDescription>
          </DialogHeader>
          <CompanyFormContent />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditCompanyOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditCompany} disabled={isUpdating || !companyForm.name.trim()}>
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
