import { useMemo } from 'react';
import type { OperationalData } from '@/types/organization';

export interface KPIData {
  cancelledByWeather: number;
  totalCancelled: number;
  impactedByRain: number;
  impactPercentage: number;
  potentialSavings: number;
  productivityRecovered: number;
  totalScheduled: number;
  totalCompleted: number;
  completionRate: number;
  weatherCancellationRate: number;
}

interface KPICalculatorOptions {
  avgOperationCost?: number; // Custo médio por operação cancelada (para cálculo de economia)
}

export function useKPICalculator(
  operationalData: OperationalData[],
  options: KPICalculatorOptions = {}
) {
  const { avgOperationCost = 500 } = options; // R$ 500 como custo médio default

  const kpis = useMemo<KPIData>(() => {
    if (!operationalData.length) {
      return {
        cancelledByWeather: 0,
        totalCancelled: 0,
        impactedByRain: 0,
        impactPercentage: 0,
        potentialSavings: 0,
        productivityRecovered: 0,
        totalScheduled: 0,
        totalCompleted: 0,
        completionRate: 0,
        weatherCancellationRate: 0,
      };
    }

    // Totais básicos
    const totalScheduled = operationalData.reduce(
      (sum, d) => sum + d.scheduledOperations,
      0
    );
    const totalCompleted = operationalData.reduce(
      (sum, d) => sum + d.completedOperations,
      0
    );
    const totalCancelled = operationalData.reduce(
      (sum, d) => sum + d.cancelledOperations,
      0
    );

    // Cancelamentos por clima
    const cancelledByWeather = operationalData
      .filter(d => d.weatherImpact)
      .reduce((sum, d) => sum + d.cancelledOperations, 0);

    // Operações impactadas por chuva (dias com weather_impact = true)
    const impactedDays = operationalData.filter(d => d.weatherImpact);
    const impactedByRain = impactedDays.reduce(
      (sum, d) => sum + d.scheduledOperations,
      0
    );

    // Percentual de impacto
    const impactPercentage = totalScheduled > 0
      ? Math.round((cancelledByWeather / totalCancelled) * 100) || 0
      : 0;

    // Taxa de conclusão
    const completionRate = totalScheduled > 0
      ? Math.round((totalCompleted / totalScheduled) * 100)
      : 0;

    // Taxa de cancelamento por clima
    const weatherCancellationRate = totalCancelled > 0
      ? Math.round((cancelledByWeather / totalCancelled) * 100)
      : 0;

    // Economia potencial (cancelamentos evitáveis com planejamento climático)
    // Estimativa: 70% dos cancelamentos por clima poderiam ser evitados
    const potentialSavings = Math.round(cancelledByWeather * 0.7 * avgOperationCost);

    // Produtividade recuperada (melhoria estimada comparada a período sem análise)
    // Baseado na diferença entre taxa de conclusão atual vs estimativa sem análise
    const baselineCompletionRate = 60; // Taxa base sem análise climática
    const productivityRecovered = Math.max(0, completionRate - baselineCompletionRate);

    return {
      cancelledByWeather,
      totalCancelled,
      impactedByRain,
      impactPercentage,
      potentialSavings,
      productivityRecovered,
      totalScheduled,
      totalCompleted,
      completionRate,
      weatherCancellationRate,
    };
  }, [operationalData, avgOperationCost]);

  const hasData = operationalData.length > 0;

  return { kpis, hasData };
}
