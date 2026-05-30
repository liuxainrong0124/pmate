export interface MetricData {
  label: string;
  value: string;
  change: number;
  trend: "up" | "down";
  sparkline: number[];
}

export interface TodoItem {
  id: string;
  text: string;
  time: string;
  priority: "high" | "medium" | "low";
  done?: boolean;
}

export interface AlertItem {
  id: string;
  text: string;
  action: string;
  severity: "warning" | "info" | "critical";
}

export const emptyMetrics: MetricData[] = [
  { label: "DAU", value: "--", change: 0, trend: "up", sparkline: [0] },
  { label: "次日留存", value: "--", change: 0, trend: "up", sparkline: [0] },
  { label: "推送打开率", value: "--", change: 0, trend: "up", sparkline: [0] },
  { label: "LTV", value: "--", change: 0, trend: "up", sparkline: [0] },
];

export const emptyTodos: TodoItem[] = [];

export const emptyAlerts: AlertItem[] = [];

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 11) return "早上好";
  if (h < 14) return "中午好";
  if (h < 18) return "下午好";
  return "晚上好";
}
