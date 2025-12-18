import { Zap, Truck, Wifi, ShoppingBag, Wheat, Wrench } from "lucide-react";

const sectors = [
  { icon: Wifi, name: "Telecomunicações", description: "Previna falhas de rede causadas por tempestades" },
  { icon: Zap, name: "Energia", description: "Otimize distribuição em dias extremos" },
  { icon: Truck, name: "Logística", description: "Planeje rotas considerando condições climáticas" },
  { icon: Wheat, name: "Agronegócio", description: "Acompanhe safras com dados precisos" },
  { icon: ShoppingBag, name: "Varejo", description: "Preveja demanda por produtos sazonais" },
  { icon: Wrench, name: "Serviços", description: "Valide ocorrências de campo" },
];

export function Sectors() {
  return (
    <section className="py-24 bg-background">
      <div className="container px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Setores que{" "}
            <span className="text-gradient">transformamos</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            PMEs de diversos setores já utilizam o Climatch para tomar decisões melhores
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
          {sectors.map((sector, index) => (
            <div
              key={sector.name}
              className="group flex flex-col items-center text-center p-6 rounded-2xl bg-card shadow-card hover:shadow-card-hover transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors duration-300">
                <sector.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{sector.name}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{sector.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
