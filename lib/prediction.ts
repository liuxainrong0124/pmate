/** Simple linear regression prediction for time-series metric data */

export interface PredictionResult {
  label: string;
  currentValue: number;
  predictedValue: number;
  change: number;
  confidence: number;
  trend: "up" | "down" | "flat";
  forecastDays: number;
  rmse: number;
}

function linearRegression(data: { x: number; y: number }[]): { slope: number; intercept: number; r2: number } {
  const n = data.length;
  if (n < 3) return { slope: 0, intercept: data[0]?.y || 0, r2: 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (const p of data) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumX2 += p.x * p.x;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // R² calculation
  const yMean = sumY / n;
  let ssRes = 0, ssTot = 0;
  for (const p of data) {
    const predicted = slope * p.x + intercept;
    ssRes += (p.y - predicted) ** 2;
    ssTot += (p.y - yMean) ** 2;
  }
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

  return { slope, intercept, r2 };
}

export function predictMetric(
  label: string,
  values: number[],
  forecastDays: number = 7
): PredictionResult {
  if (values.length < 7) {
    return {
      label,
      currentValue: values[values.length - 1] || 0,
      predictedValue: values[values.length - 1] || 0,
      change: 0,
      confidence: 0,
      trend: "flat",
      forecastDays,
      rmse: 0,
    };
  }

  const data = values.map((v, i) => ({ x: i, y: v }));
  const { slope, intercept, r2 } = linearRegression(data);

  const currentValue = values[values.length - 1];
  const predictedValue = slope * (values.length - 1 + forecastDays) + intercept;

  // RMSE
  let sumSqErr = 0;
  for (let i = 0; i < values.length; i++) {
    const pred = slope * i + intercept;
    sumSqErr += (values[i] - pred) ** 2;
  }
  const rmse = Math.sqrt(sumSqErr / values.length);

  const change = currentValue !== 0 ? ((predictedValue - currentValue) / Math.abs(currentValue)) * 100 : 0;
  const trend = Math.abs(change) < 1 ? "flat" : change > 0 ? "up" : "down";
  const confidence = Math.max(0, Math.min(1, r2));

  return {
    label,
    currentValue,
    predictedValue,
    change: Math.round(change * 10) / 10,
    confidence: Math.round(confidence * 100),
    trend,
    forecastDays,
    rmse: Math.round(rmse * 100) / 100,
  };
}

export function predictAllMetrics(
  metrics: { label: string; values: number[] }[],
  forecastDays?: number
): PredictionResult[] {
  return metrics.map((m) => predictMetric(m.label, m.values, forecastDays));
}
