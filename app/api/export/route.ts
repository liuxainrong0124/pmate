import { NextRequest, NextResponse } from "next/server";
import { exportFeedbackToDocx, exportCompetitorToDocx, exportPrdToDocx } from "@/lib/export/docx-exporter";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data, format } = body;

    if (!type || !data || !format) {
      return NextResponse.json({ error: "type, data, and format are required" }, { status: 400 });
    }

    if (format === "docx") {
      let buffer: Buffer;
      if (type === "feedback") {
        buffer = await exportFeedbackToDocx(data);
      } else if (type === "competitor") {
        buffer = await exportCompetitorToDocx(data);
      } else if (type === "prd") {
        buffer = await exportPrdToDocx(data);
      } else {
        return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
      }

      const arrayBuffer = new Uint8Array(buffer).buffer;
      return new NextResponse(arrayBuffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${type}-report.docx"`,
        },
      });
    }

    if (format === "pptx") {
      // Dynamic import pptxgenjs (server-side only)
      const { exportFeedbackToPptx, exportCompetitorToPptx } = await import("@/lib/export/pptx-exporter");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let pptx: any;
      if (type === "feedback") {
        pptx = exportFeedbackToPptx(data);
      } else if (type === "competitor") {
        pptx = exportCompetitorToPptx(data);
      } else {
        return NextResponse.json({ error: "PPT export only supports feedback and competitor types" }, { status: 400 });
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const arrayBuffer = (await pptx.write({ outputType: "arraybuffer" })) as ArrayBuffer;
      return new NextResponse(arrayBuffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "Content-Disposition": `attachment; filename="${type}-report.pptx"`,
        },
      });
    }

    return NextResponse.json({ error: `Unsupported format: ${format}` }, { status: 400 });
  } catch (error: unknown) {
    console.error("Export error:", error);
    const message = error instanceof Error ? error.message : "Export failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
