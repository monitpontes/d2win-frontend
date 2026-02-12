import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LayoutDashboard, LogOut, Settings, User, ChevronDown } from 'lucide-react';
import d2winLogo from '@/assets/d2win-logo.png';
export function Header() {
  const {
    user,
    logout,
    canAccessAdmin
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };
  const getRoleName = (role: string) => {
    const roles: Record<string, string> = {
      admin: 'Admin Global',
      gestor: 'Admin Empresa',
      viewer: 'Visualizador'
    };
    return roles[role] || role;
  };
  const isActive = (path: string) => location.pathname.startsWith(path);
  return <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b bg-card px-4 shadow-sm">
      {/* Logo */}
      <Link to="/dashboard" className="flex items-center gap-2">
        <img src={d2winLogo} alt="D2WIN" className="h-9 w-auto" />
        <span className="text-sm md:text-xl font-bold text-foreground">d2win<span className="hidden md:inline"> - Monitoramento Estrutural</span></span>
      </Link>

      {/* Navigation */}
      <nav className="flex items-center gap-2">
        <Button variant={isActive('/dashboard') ? 'secondary' : 'ghost'} size="sm" asChild>
          <Link to="/dashboard" className="flex items-center gap-1 md:gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
        </Button>

        {canAccessAdmin() && <Button variant={isActive('/admin') ? 'secondary' : 'ghost'} size="sm" asChild>
            <Link to="/admin" className="flex items-center gap-1 md:gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          </Button>}
      </nav>

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {user ? getInitials(user.name) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="hidden flex-col items-start md:flex">
              <span className="text-sm font-medium">{user?.name}</span>
              <span className="text-xs text-muted-foreground">{user && getRoleName(user.role)}</span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            Perfil
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            Configurações
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>;
}