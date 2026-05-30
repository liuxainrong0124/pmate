import { NextRequest, NextResponse } from "next/server";
import { parseFile } from "@/lib/parsers/file-parser";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    const results = [];
    const errors: string[] = [];

    for (const file of files) {
      try {
        const parsed = await parseFile(file);
        results.push(parsed);
      } catch (err) {
        errors.push(err instanceof Error ? err.message : `Failed to parse ${file.name || "unknown"}`);
      }
    }

    if (errors.length > 0 && results.length === 0) {
      return NextResponse.json(
        { error: errors.join("; ") },
        { status: 400 }
      );
    }

    return NextResponse.json({ files: results, errors: errors.length > 0 ? errors : undefined });
  } catch (error: unknown) {
    console.error("File parse error:", error);
    const message = error instanceof Error ? error.message : "File parsing failed";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
