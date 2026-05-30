export interface TimeSeriesPoint {
  date: string;
  value: number;
}

export interface MetricWithHistory {
  id: string;
  label: string;
  currentValue: string;
  change: number;
  trend: "up" | "down";
  unit: string;
  history: TimeSeriesPoint[];
  benchmark: string;
}

export const emptyMetricsHistory: MetricWithHistory[] = [
  { id: "dau", label: "DAU", currentValue: "--", change: 0, trend: "up", unit: "", benchmark: "--", history: [] },
  { id: "retention", label: "次日留存", currentValue: "--", change: 0, trend: "up", unit: "", benchmark: "--", history: [] },
  { id: "push_rate", label: "推送打开率", currentValue: "--", change: 0, trend: "up", unit: "", benchmark: "--", history: [] },
  { id: "ltv", label: "LTV", currentValue: "--", change: 0, trend: "up", unit: "", benchmark: "--", history: [] },
  { id: "conversion", label: "转化率", currentValue: "--", change: 0, trend: "up", unit: "", benchmark: "--", history: [] },
  { id: "churn", label: "周流失率", currentValue: "--", change: 0, trend: "up", unit: "", benchmark: "--", history: [] },
];

export interface AnomalyEvent {
  date: string;
  metric: string;
  change: string;
  possibleCauses: string[];
  confidence: number;
}

export const mockAnomalies: AnomalyEvent[] = [];
