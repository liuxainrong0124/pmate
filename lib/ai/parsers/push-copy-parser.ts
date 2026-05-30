/* eslint-disable @typescript-eslint/no-explicit-any */

export interface GeneratedCopyVariant {
  style: "emotional" | "data" | "gamified";
  title: string;
  body: string;
  cta: string;
}

const VALID_STYLES = ["emotional", "data", "gamified"];

export function parsePushCopyResponse(rawJson: string): GeneratedCopyVariant[] {
  let parsed: any;
  try { parsed = JSON.parse(rawJson); } catch {
    const m = rawJson.match(/\{[\s\S]*\}/);
    if (!m) return [];
    parsed = JSON.parse(m[0]);
  }
  if (!parsed || !Array.isArray(parsed.variants)) return [];
  return parsed.variants.map((v: any): GeneratedCopyVariant => ({
    style: VALID_STYLES.includes(v.style) ? v.style : "emotional",
    title: String(v.title || ""),
    body: String(v.body || ""),
    cta: String(v.cta || ""),
  }));
}
