import { Button } from "@/components/ui/button";
import { CloudSun, TrendingUp, Shield } from "lucide-react";
import { Link } from "react-router-dom";

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-climatch-sky/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />
      </div>

      <div className="container relative z-10 px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-primary/10 text-primary animate-fade-in">
            <CloudSun className="w-4 h-4" />
            <span className="text-sm font-medium">Inteligência Meteorológica para PMEs</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold mb-6 leading-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Transforme o clima em{" "}
            <span className="text-gradient">vantagem competitiva</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            O Climatch correlaciona dados meteorológicos com suas operações, 
            permitindo decisões estratégicas baseadas em dados precisos e auditáveis.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Link to="/signup">
              <Button variant="hero" size="xl">
                Começar Gratuitamente
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="hero-outline" size="xl">
                Já tenho conta
              </Button>
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card shadow-card">
              <div className="w-10 h-10 rounded-lg gradient-hero flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">~100% Precisão</p>
                <p className="text-xs text-muted-foreground">Dados validados</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card shadow-card">
              <div className="w-10 h-10 rounded-lg gradient-rain flex items-center justify-center">
                <CloudSun className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">Dados D-1</p>
                <p className="text-xs text-muted-foreground">Sempre atualizado</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card shadow-card">
              <div className="w-10 h-10 rounded-lg gradient-wind flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">Auditável</p>
                <p className="text-xs text-muted-foreground">Fontes oficiais</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
