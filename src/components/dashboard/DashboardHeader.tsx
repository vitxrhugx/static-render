import { Button } from "@/components/ui/button";
import { CloudSun, Settings, LogOut, User, Building2, Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/ThemeToggle";

interface DashboardHeaderProps {
  onToggleSidebar?: () => void;
}

export function DashboardHeader({ onToggleSidebar }: DashboardHeaderProps) {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="h-16 bg-card/80 backdrop-blur-md border-b border-border px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-2">
        {onToggleSidebar && (
          <Button variant="ghost" size="icon" className="md:hidden rounded-full" onClick={onToggleSidebar}>
            <Menu className="w-5 h-5" />
          </Button>
        )}
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center shadow-sm">
            <CloudSun className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-display font-bold">Climatch</span>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground mr-2 hidden md:inline">{user?.email || 'Usuário'}</span>
        
        <ThemeToggle />
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/organization")}
          className="hidden sm:flex"
        >
          <Building2 className="w-4 h-4 mr-2" />
          Organização
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => navigate("/organization")}>
              <Building2 className="w-4 h-4 mr-2" />
              Minha Organização
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
