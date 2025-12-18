import { Thermometer, Droplets, Wind, Sun } from "lucide-react";

interface WeatherData {
  tempMax: number;
  tempMin: number;
  precipitation: number;
  windMax: number;
}

interface WeatherCardsProps {
  data: WeatherData;
}

export function WeatherCards({ data }: WeatherCardsProps) {
  const cards = [
    {
      label: "Temp. Máxima",
      value: `${data.tempMax}°C`,
      icon: Thermometer,
      gradient: "gradient-temp-hot",
      bgColor: "bg-climatch-orange/10",
    },
    {
      label: "Temp. Mínima",
      value: `${data.tempMin}°C`,
      icon: Thermometer,
      gradient: "gradient-temp-cold",
      bgColor: "bg-climatch-ice/10",
    },
    {
      label: "Precipitação",
      value: `${data.precipitation} mm`,
      icon: Droplets,
      gradient: "gradient-rain",
      bgColor: "bg-climatch-rain/10",
    },
    {
      label: "Vento Máx.",
      value: `${data.windMax} km/h`,
      icon: Wind,
      gradient: "gradient-wind",
      bgColor: "bg-climatch-green/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div
          key={card.label}
          className="bg-card rounded-xl p-5 shadow-card hover:shadow-card-hover transition-all duration-300 animate-fade-in"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className={`w-10 h-10 rounded-lg ${card.gradient} flex items-center justify-center`}>
              <card.icon className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xs font-medium text-muted-foreground px-2 py-1 rounded-full bg-muted">
              D-1
            </span>
          </div>
          <p className="text-2xl font-display font-bold mb-1">{card.value}</p>
          <p className="text-sm text-muted-foreground">{card.label}</p>
        </div>
      ))}
    </div>
  );
}
