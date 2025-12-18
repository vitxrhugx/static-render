import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface TemperatureChartProps {
  data: Array<{
    date: string;
    tempMax: number;
    tempMin: number;
  }>;
}

export function TemperatureChart({ data }: TemperatureChartProps) {
  return (
    <div className="bg-card rounded-xl p-6 shadow-card">
      <h3 className="font-display font-semibold mb-4">Temperatura ao longo do período</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }} 
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis 
              tick={{ fontSize: 12 }} 
              stroke="hsl(var(--muted-foreground))"
              tickFormatter={(value) => `${value}°`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number) => [`${value}°C`]}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="tempMax" 
              stroke="hsl(25, 95%, 53%)" 
              strokeWidth={2}
              dot={{ fill: 'hsl(25, 95%, 53%)', strokeWidth: 0, r: 4 }}
              name="Máxima"
            />
            <Line 
              type="monotone" 
              dataKey="tempMin" 
              stroke="hsl(199, 92%, 60%)" 
              strokeWidth={2}
              dot={{ fill: 'hsl(199, 92%, 60%)', strokeWidth: 0, r: 4 }}
              name="Mínima"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
