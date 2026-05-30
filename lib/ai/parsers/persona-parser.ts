/* eslint-disable @typescript-eslint/no-explicit-any */

export interface GeneratedPersona {
  name: string;
  age: number;
  occupation: string;
  tagline: string;
  quote: string;
  goals: string[];
  painPoints: string[];
  behaviors: string[];
  segmentName: string;
}

export function parsePersonaResponse(rawJson: string): GeneratedPersona[] {
  let parsed: any;
  try { parsed = JSON.parse(rawJson); } catch {
    const m = rawJson.match(/\{[\s\S]*\}/);
    if (!m) return [];
    parsed = JSON.parse(m[0]);
  }
  if (!parsed || !Array.isArray(parsed.personas)) return [];
  return parsed.personas.map((p: any): GeneratedPersona => ({
    name: String(p.name || ""),
    age: typeof p.age === "number" ? p.age : 28,
    occupation: String(p.occupation || ""),
    tagline: String(p.tagline || ""),
    quote: String(p.quote || ""),
    goals: Array.isArray(p.goals) ? p.goals.map(String) : [],
    painPoints: Array.isArray(p.painPoints) ? p.painPoints.map(String) : [],
    behaviors: Array.isArray(p.behaviors) ? p.behaviors.map(String) : [],
    segmentName: String(p.segmentName || ""),
  }));
}
