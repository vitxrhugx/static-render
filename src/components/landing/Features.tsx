import { BarChart3, Cloud, MapPin, FileSpreadsheet, Calendar, Zap } from "lucide-react";

const features = [
  {
    icon: MapPin,
    title: "Busca de Localidades",
    description: "Encontre qualquer cidade do Brasil e salve suas localidades favoritas para acesso rápido.",
    gradient: "gradient-hero",
  },
  {
    icon: Calendar,
    title: "Dados D-1 (Ontem)",
    description: "Acesse dados consolidados do dia anterior com alta precisão para validação imediata.",
    gradient: "gradient-rain",
  },
  {
    icon: BarChart3,
    title: "Histórico Completo",
    description: "Consulte dados meteorológicos históricos desde 1940 para análises aprofundadas.",
    gradient: "gradient-wind",
  },
  {
    icon: Cloud,
    title: "Múltiplas Variáveis",
    description: "Temperatura, precipitação, vento, umidade e mais de 20 variáveis meteorológicas.",
    gradient: "gradient-temp-cold",
  },
  {
    icon: FileSpreadsheet,
    title: "Upload de Dados",
    description: "Importe seus dados operacionais via CSV para correlação com dados climáticos.",
    gradient: "gradient-temp-hot",
  },
  {
    icon: Zap,
    title: "Insights Automáticos",
    description: "Relatórios automáticos que correlacionam suas operações com eventos climáticos.",
    gradient: "gradient-hero",
  },
];

export function Features() {
  return (
    <section className="py-24 bg-card">
      <div className="container px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Tudo que você precisa para{" "}
            <span className="text-gradient">decisões inteligentes</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Funcionalidades pensadas para transformar dados meteorológicos em vantagem operacional
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-6 rounded-2xl bg-background shadow-card hover:shadow-card-hover transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-12 h-12 rounded-xl ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-display font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
