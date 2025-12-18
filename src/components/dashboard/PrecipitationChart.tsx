import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PrecipitationChartProps {
  data: Array<{
    date: string;
    precipitation: number;
  }>;
}

export function PrecipitationChart({ data }: PrecipitationChartProps) {
  return (
    <div className="bg-card rounded-xl p-6 shadow-card">
      <h3 className="font-display font-semibold mb-4">Precipitação diária</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }} 
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis 
              tick={{ fontSize: 12 }} 
              stroke="hsl(var(--muted-foreground))"
              tickFormatter={(value) => `${value}mm`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number) => [`${value} mm`, 'Precipitação']}
            />
            <Bar 
              dataKey="precipitation" 
              fill="hsl(199, 89%, 48%)" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
