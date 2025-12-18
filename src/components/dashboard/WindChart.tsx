import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface WindChartProps {
  data: Array<{
    date: string;
    windMax: number;
  }>;
}

export function WindChart({ data }: WindChartProps) {
  return (
    <div className="bg-card rounded-xl p-6 shadow-card">
      <h3 className="font-display font-semibold mb-4">Velocidade do vento</h3>
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
              tickFormatter={(value) => `${value}km/h`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number) => [`${value} km/h`, 'Vento máximo']}
            />
            <Line 
              type="monotone" 
              dataKey="windMax" 
              stroke="hsl(160, 84%, 39%)" 
              strokeWidth={2}
              dot={{ fill: 'hsl(160, 84%, 39%)', strokeWidth: 0, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
