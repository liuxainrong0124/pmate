import { PrdOutput, PrdSection } from "@/types";

export function parsePrdResponse(fullText: string): PrdOutput {
  const parts = fullText.split("---PROGRESS---");
  const trimmedParts = parts.map((p) => p.trim()).filter(Boolean);

  const sections: PrdSection[] = [];
  for (const part of trimmedParts) {
    const section = extractSection(part);
    if (section) {
      sections.push(section);
    }
  }

  const suggestions: string[] = [];
  const lastPart = trimmedParts[trimmedParts.length - 1] || "";
  const decisionMatch = lastPart.match(/(?:关键决策|决策点)[\s\S]*?(\d+\.\s*.+)/g);
  if (decisionMatch) {
    decisionMatch.forEach((d) => suggestions.push(d.trim()));
  }

  return {
    sections,
    fullMarkdown: fullText.replace(/---PROGRESS---/g, "\n\n"),
    suggestions,
  };
}

function extractSection(text: string): PrdSection | null {
  const match = text.match(/^#{1,3}\s+(.+?)[\n\r]+([\s\S]*)/);
  if (match) {
    return {
      title: match[1].trim(),
      content: match[2].trim(),
    };
  }
  return { title: "", content: text };
}
