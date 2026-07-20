// Client-side extractors for PDF and DOCX text.
import mammoth from "mammoth";

export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  console.log("[file-parsing] extracting", file.name, file.type, file.size);
  if (name.endsWith(".docx") || file.type.includes("word")) return extractDocx(file);
  if (name.endsWith(".pdf") || file.type === "application/pdf") return extractPdf(file);
  throw new Error("Unsupported file type. Please upload PDF or DOCX.");
}

async function extractDocx(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buf });
  return (result.value ?? "").trim();
}

async function extractPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // Load the worker via Vite's ?url import so it's bundled and same-origin.
  // Cast because the type map doesn't include ?url query.
  const workerModule = (await import(
    /* @vite-ignore */ "pdfjs-dist/build/pdf.worker.min.mjs?url"
  )) as { default: string };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (pdfjs as any).GlobalWorkerOptions.workerSrc = workerModule.default;

  const buf = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: buf, disableFontFace: true });
  const doc = await loadingTask.promise;
  let text = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    text +=
      content.items
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((it: any) => ("str" in it ? it.str : ""))
        .join(" ") + "\n";
  }
  try {
    await doc.destroy();
  } catch {
    /* ignore */
  }
  return text.trim();
}

