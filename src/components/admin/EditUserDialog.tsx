import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import type { User, UserRole } from '@/types';
import { User as UserIcon, Mail, Key, Shield, Power } from 'lucide-react';

interface EditUserDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (updatedUser: User) => void;
}

export function EditUserDialog({ user, open, onOpenChange, onSave }: EditUserDialogProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('viewer');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPassword('');
      setRole(user.role);
      setIsActive(user.status === 'active');
    }
  }, [user]);

  const handleSave = () => {
    if (!user) return;

    if (!name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      toast.error('E-mail inválido');
      return;
    }

    const updatedUser: User = {
      ...user,
      name: name.trim(),
      email: email.trim(),
      role,
      status: isActive ? 'active' : 'inactive',
    };

    onSave?.(updatedUser);
    toast.success('Usuário atualizado com sucesso!');
    onOpenChange(false);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-primary" />
            Editar Usuário
          </DialogTitle>
          <DialogDescription>
            Atualize as informações do usuário abaixo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="edit-name" className="flex items-center gap-2 text-sm font-medium">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
              Nome Completo
            </Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome completo"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="edit-email" className="flex items-center gap-2 text-sm font-medium">
              <Mail className="h-4 w-4 text-muted-foreground" />
              E-mail
            </Label>
            <Input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@empresa.com"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="edit-password" className="flex items-center gap-2 text-sm font-medium">
              <Key className="h-4 w-4 text-muted-foreground" />
              Nova Senha
            </Label>
            <Input
              id="edit-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Deixe em branco para manter a atual"
            />
            <p className="text-xs text-muted-foreground">
              Deixe em branco para manter a senha atual.
            </p>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="edit-role" className="flex items-center gap-2 text-sm font-medium">
              <Shield className="h-4 w-4 text-muted-foreground" />
              Perfil de Acesso
            </Label>
            <Select value={role} onValueChange={(value: UserRole) => setRole(value)}>
              <SelectTrigger id="edit-role">
                <SelectValue placeholder="Selecione um perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">
                  <div className="flex flex-col">
                    <span>Visualizador</span>
                    <span className="text-xs text-muted-foreground">Apenas visualização</span>
                  </div>
                </SelectItem>
                <SelectItem value="gestor">
                  <div className="flex flex-col">
                    <span>Gestor</span>
                    <span className="text-xs text-muted-foreground">Edição e exportação</span>
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex flex-col">
                    <span>Administrador</span>
                    <span className="text-xs text-muted-foreground">Acesso total</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <Power className={`h-5 w-5 ${isActive ? 'text-success' : 'text-muted-foreground'}`} />
              <div>
                <Label htmlFor="edit-active" className="text-sm font-medium cursor-pointer">
                  Usuário Ativo
                </Label>
                <p className="text-xs text-muted-foreground">
                  {isActive ? 'O usuário pode acessar o sistema' : 'O usuário não pode fazer login'}
                </p>
              </div>
            </div>
            <Switch
              id="edit-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
