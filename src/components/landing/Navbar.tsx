import { Button } from "@/components/ui/button";
import { CloudSun } from "lucide-react";
import { Link } from "react-router-dom";

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg gradient-hero flex items-center justify-center">
            <CloudSun className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-display font-bold">Climatch</span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link to="/login">
            <Button variant="ghost">Entrar</Button>
          </Link>
          <Link to="/signup">
            <Button variant="default">Criar Conta</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
