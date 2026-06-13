// Shared parser utilities — safely extract strings from AI responses
// that may return objects instead of plain strings in arrays

function toDisplayString(item: unknown): string {
  if (typeof item === "string") return item;
  if (typeof item === "number" || typeof item === "boolean") return String(item);
  if (item && typeof item === "object") {
    const obj = item as Record<string, unknown>;
    return String(obj.item || obj.title || obj.name || obj.description
      || obj.update || obj.move || obj.what || obj.label || obj.text || "");
  }
  return "";
}

export function toStringArray(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.map(toDisplayString).filter(Boolean);
}
