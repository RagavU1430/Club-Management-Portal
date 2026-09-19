import * as mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";

// Initialize PDF.js worker using Vite's native URL resolver with CDN fallback
try {
  if (typeof window !== "undefined") {
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.mjs",
        import.meta.url
      ).toString();
    } catch {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    }
  }
} catch (e) {
  console.warn("Failed to set PDF.js worker path:", e);
}

export interface ExtractedAgendaResult {
  text: string;
  lineCount: number;
  fileName: string;
  fileType: "pdf" | "docx" | "txt" | "unknown";
  suggestedTitle?: string;
}

/**
 * Normalizes text extracted from documents into clean, structured agenda lines.
 */
export function cleanExtractedText(raw: string): string {
  if (!raw) return "";

  // Split lines and trim whitespace
  const lines = raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Recombine lines, separating paragraphs cleanly
  return lines.join("\n");
}

/**
 * Extracts raw text from a Word (.docx) document ArrayBuffer.
 */
export async function extractTextFromDocx(arrayBuffer: ArrayBuffer): Promise<string> {
  const result = await mammoth.extractRawText({ arrayBuffer });
  return cleanExtractedText(result.value || "");
}

/**
 * Extracts text content from a PDF document ArrayBuffer.
 */
export async function extractTextFromPdf(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
    });
    const pdf = await loadingTask.promise;
    const pageTexts: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Combine text items preserving layout breaks
      let lastY: number | null = null;
      let pageStr = "";

      for (const item of textContent.items as any[]) {
        if (!("str" in item)) continue;
        const currentY = item.transform ? item.transform[5] : null;
        if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 5) {
          pageStr += "\n";
        } else if (pageStr.length > 0 && !pageStr.endsWith("\n") && !pageStr.endsWith(" ")) {
          pageStr += " ";
        }
        pageStr += item.str;
        lastY = currentY;
      }

      if (pageStr.trim()) {
        pageTexts.push(pageStr.trim());
      }
    }

    return cleanExtractedText(pageTexts.join("\n\n"));
  } catch (err: any) {
    console.error("PDF extraction error:", err);
    throw new Error(`Could not parse PDF file: ${err.message || "Unknown error"}`);
  }
}

/**
 * Reads text from a plain text or Markdown file.
 */
export async function extractTextFromTxt(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(cleanExtractedText(String(reader.result || "")));
    reader.onerror = () => reject(new Error("Failed to read text file."));
    reader.readAsText(file);
  });
}

/**
 * Universal document agenda parser for File objects (.pdf, .docx, .txt, .md).
 */
export async function parseAgendaDocument(file: File): Promise<ExtractedAgendaResult> {
  const name = file.name.toLowerCase();
  let text = "";
  let fileType: ExtractedAgendaResult["fileType"] = "unknown";

  if (name.endsWith(".docx")) {
    fileType = "docx";
    const buffer = await file.arrayBuffer();
    text = await extractTextFromDocx(buffer);
  } else if (name.endsWith(".pdf")) {
    fileType = "pdf";
    const buffer = await file.arrayBuffer();
    text = await extractTextFromPdf(buffer);
  } else if (name.endsWith(".txt") || name.endsWith(".md")) {
    fileType = "txt";
    text = await extractTextFromTxt(file);
  } else if (name.endsWith(".doc")) {
    throw new Error("Older .doc format is not supported. Please save or export your file as .docx or .pdf.");
  } else {
    throw new Error("Unsupported file format. Please upload a PDF (.pdf), Word document (.docx), or plain text (.txt).");
  }

  const lines = text.split("\n").filter((l) => l.trim().length > 0);

  // Attempt to guess title from first non-empty line if it's short and looks like a heading
  let suggestedTitle: string | undefined;
  if (lines.length > 0 && lines[0].length < 80 && !lines[0].includes(":") && !/\d{1,2}:\d{2}/.test(lines[0])) {
    suggestedTitle = lines[0].replace(/^#+\s*/, "").trim();
  }

  return {
    text,
    lineCount: lines.length,
    fileName: file.name,
    fileType,
    suggestedTitle,
  };
}
