import { useState } from 'react';
import { Building2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { mockCompanies } from '@/data/mockData';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface AdminSidebarProps {
  selectedCompanyId: string;
  onSelectCompany: (companyId: string) => void;
}

export function AdminSidebar({ selectedCompanyId, onSelectCompany }: AdminSidebarProps) {
  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');

  const handleAddCompany = () => {
    if (newCompanyName.trim()) {
      toast.success(`Empresa "${newCompanyName}" adicionada com sucesso!`);
      setNewCompanyName('');
      setIsAddCompanyOpen(false);
    }
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
            onClick={() => setIsAddCompanyOpen(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Companies List */}
      <div className="flex-1 overflow-y-auto p-2">
        {mockCompanies.map((company) => (
          <button
            key={company.id}
            onClick={() => onSelectCompany(company.id)}
            className={cn(
              "w-full text-left px-3 py-2.5 rounded-lg transition-colors mb-1",
              selectedCompanyId === company.id
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            )}
          >
            <p className="font-medium text-sm">{company.name}</p>
            <p className={cn(
              "text-xs",
              selectedCompanyId === company.id
                ? "text-primary-foreground/70"
                : "text-muted-foreground"
            )}>
              pontes • ID: {company.id.replace('company-', '')}
            </p>
          </button>
        ))}
      </div>

      {/* Add Company Dialog */}
      <Dialog open={isAddCompanyOpen} onOpenChange={setIsAddCompanyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Empresa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Nome da Empresa</Label>
              <Input
                id="company-name"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="Nome da empresa"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCompanyOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddCompany}>
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
