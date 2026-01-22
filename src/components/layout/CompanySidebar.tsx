import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { mockCompanies } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Building2, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompanySidebarProps {
  selectedCompanyId: string;
  onSelectCompany: (companyId: string) => void;
}

export function CompanySidebar({ selectedCompanyId, onSelectCompany }: CompanySidebarProps) {
  const { hasRole } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: '', description: '' });

  const isAdmin = hasRole('admin');

  const handleAddCompany = () => {
    // Mock add company
    console.log('Adding company:', newCompany);
    setDialogOpen(false);
    setNewCompany({ name: '', description: '' });
  };

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r bg-sidebar transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Collapse Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full border bg-card shadow-sm hover:bg-accent"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>

      {/* Header */}
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
        <Building2 className="h-5 w-5 text-sidebar-foreground" />
        {!collapsed && (
          <h2 className="font-semibold text-sidebar-foreground">Empresas</h2>
        )}
      </div>

      {/* Company List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* All Companies Option */}
          <button
            onClick={() => onSelectCompany('all')}
            className={cn(
              'mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
              selectedCompanyId === 'all'
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent'
            )}
          >
            <Building2 className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Todas as Empresas</span>}
          </button>

          {/* Company Items */}
          {mockCompanies.map((company) => (
            <button
              key={company.id}
              onClick={() => onSelectCompany(company.id)}
              className={cn(
                'mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                selectedCompanyId === company.id
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              )}
              title={collapsed ? company.name : undefined}
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-sidebar-accent text-xs font-medium text-sidebar-accent-foreground">
                {company.name.charAt(0)}
              </div>
              {!collapsed && (
                <span className="truncate">{company.name}</span>
              )}
            </button>
          ))}
        </div>
      </ScrollArea>

      {/* Add Company Button (Admin only) */}
      {isAdmin && (
        <div className="border-t border-sidebar-border p-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  collapsed && 'justify-center px-0'
                )}
              >
                <Plus className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="ml-2">Nova Empresa</span>}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Empresa</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={newCompany.name}
                    onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                    placeholder="Nome da empresa"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={newCompany.description}
                    onChange={(e) => setNewCompany({ ...newCompany, description: e.target.value })}
                    placeholder="Descrição da empresa"
                  />
                </div>
                <Button onClick={handleAddCompany} className="w-full">
                  Salvar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </aside>
  );
}
