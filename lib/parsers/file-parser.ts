// Server-side only - uses Node.js APIs (pdf-parse, mammoth, xlsx)

export interface ParsedFile {
  text: string;
  type: string;
  name: string;
  size: number;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const SUPPORTED_TYPES: Record<string, string> = {
  "text/plain": "txt",
  "text/csv": "csv",
  "text/markdown": "md",
  "application/json": "json",
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-excel": "xls",
};

export function getSupportedExtensions(): string {
  return Object.values(SUPPORTED_TYPES)
    .map((ext) => `.${ext}`)
    .join(", ");
}

export function isSupportedFile(file: File): boolean {
  // Check MIME type first
  if (file.type in SUPPORTED_TYPES) return true;
  // Check extension as fallback (some browsers don't set MIME correctly)
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  const exts = Object.values(SUPPORTED_TYPES).map((e) => `.${e}`);
  return exts.includes(ext || "");
}

export async function parseFile(file: File): Promise<ParsedFile> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`文件 "${file.name}" 超过 10MB 限制`);
  }

  if (!isSupportedFile(file)) {
    throw new Error(
      `不支持的文件格式: ${file.name}。支持的格式: ${getSupportedExtensions()}`
    );
  }

  const type = detectType(file);
  let text = "";

  switch (type) {
    case "txt":
    case "csv":
    case "md":
      text = await file.text();
      break;

    case "pdf":
      text = await parsePdf(file);
      break;

    case "docx":
      text = await parseDocx(file);
      break;

    case "xlsx":
    case "xls":
      text = await parseExcel(file);
      break;

    default:
      text = await file.text();
  }

  if (!text.trim()) {
    throw new Error(`文件 "${file.name}" 解析后内容为空`);
  }

  return { text: text.trim(), type, name: file.name, size: file.size };
}

export async function parseFiles(files: File[]): Promise<ParsedFile[]> {
  const results: ParsedFile[] = [];
  const errors: string[] = [];

  for (const file of files) {
    try {
      results.push(await parseFile(file));
    } catch (err) {
      errors.push(err instanceof Error ? err.message : `解析 "${file.name}" 失败`);
    }
  }

  if (errors.length > 0 && results.length === 0) {
    throw new Error(errors.join("; "));
  }

  return results;
}

function detectType(file: File): string {
  if (file.type in SUPPORTED_TYPES) {
    return SUPPORTED_TYPES[file.type];
  }
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const exts = Object.values(SUPPORTED_TYPES);
  return exts.includes(ext) ? ext : "txt";
}

async function parsePdf(file: File): Promise<string> {
  // pdf-parse works with ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  // Dynamic import to avoid SSR issues
  const { PDFParse } = await import("pdf-parse");
  const pdf = new PDFParse({ data: buffer });
  const result = await pdf.getText();
  return result.text || "";
}

async function parseDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const mammoth = (await import("mammoth")).default;
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value || "";
}

async function parseExcel(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const XLSX = (await import("xlsx")).default;
  const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });
  const texts: string[] = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const csvText = XLSX.utils.sheet_to_csv(sheet);
    if (csvText.trim()) {
      texts.push(`[Sheet: ${sheetName}]\n${csvText}`);
    }
  }
  return texts.join("\n\n");
}
