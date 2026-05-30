import { getItem, setItem } from "@/lib/store/local-store";
import { sendNotification } from "@/lib/notify";

export interface AlertRecord {
  id: string;
  metric: string;
  change: number;
  threshold: number;
  direction: "up" | "down";
  currentValue: string;
  previousValue: string;
  timestamp: string;
}

export interface AlertSettings {
  enabled: boolean;
  threshold: number; // percentage, e.g. 5 means ±5%
  autoRefresh: boolean;
  refreshIntervalMinutes: number;
}

const DEFAULT_ALERT_SETTINGS: AlertSettings = {
  enabled: false,
  threshold: 5,
  autoRefresh: false,
  refreshIntervalMinutes: 5,
};

export function getAlertSettings(): AlertSettings {
  return getItem<AlertSettings>("alertSettings", DEFAULT_ALERT_SETTINGS);
}

export function saveAlertSettings(settings: Partial<AlertSettings>) {
  const current = getAlertSettings();
  setItem("alertSettings", { ...current, ...settings });
}

export function getAlertHistory(): AlertRecord[] {
  return getItem<AlertRecord[]>("alertHistory", []);
}

function addAlertRecord(record: Omit<AlertRecord, "id" | "timestamp">) {
  const history = getAlertHistory();
  const entry: AlertRecord = {
    ...record,
    id: `alert-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
  history.unshift(entry);
  if (history.length > 100) history.length = 100;
  setItem("alertHistory", history);
}

/** Check metrics for anomalies and trigger alerts */
export function checkAnomaly(params: {
  label: string;
  currentValue: number;
  previousValue: number;
  displayValue: string;
  displayPrev: string;
}): AlertRecord | null {
  const settings = getAlertSettings();
  if (!settings.enabled) return null;

  if (params.previousValue === 0) return null;

  const change = ((params.currentValue - params.previousValue) / Math.abs(params.previousValue)) * 100;
  const absChange = Math.abs(change);

  if (absChange < settings.threshold) return null;

  const direction = change >= 0 ? "up" : "down";
  const directionLabel = direction === "down" ? "下降" : "上升";

  const record: Omit<AlertRecord, "id" | "timestamp"> = {
    metric: params.label,
    change: Math.round(change * 10) / 10,
    threshold: settings.threshold,
    direction,
    currentValue: params.displayValue,
    previousValue: params.displayPrev,
  };

  addAlertRecord(record);

  sendNotification(
    `⚠️ ${params.label}${directionLabel}${absChange.toFixed(1)}%`,
    `当前 ${params.displayValue}，上期 ${params.displayPrev}，请关注`
  );

  return { ...record, id: `alert-${Date.now()}`, timestamp: new Date().toISOString() };
}
