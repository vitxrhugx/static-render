import { CloudSun } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="py-12 bg-foreground text-background">
      <div className="container px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
              <CloudSun className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold">Climatch</span>
          </div>
          
          <nav className="flex items-center gap-6">
            <Link to="/login" className="text-sm text-background/70 hover:text-background transition-colors">
              Login
            </Link>
            <Link to="/signup" className="text-sm text-background/70 hover:text-background transition-colors">
              Criar Conta
            </Link>
          </nav>
          
          <p className="text-sm text-background/60">
            © {new Date().getFullYear()} Climatch. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
