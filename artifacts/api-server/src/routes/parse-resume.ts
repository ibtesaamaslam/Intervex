import { Router, type IRouter } from "express";
import multer from "multer";
import mammoth from "mammoth";

// Lazy-load pdf-parse via dynamic import so it works in both:
//   - dev  (ESM / tsx): import() with CJS interop
//   - prod (esbuild CJS bundle): esbuild converts import() of an external
//     module to an async require(), no import.meta dependency needed
type PdfParseResult = { text: string; numpages: number };
type PdfParseFn = (buffer: Buffer) => Promise<PdfParseResult>;

let _pdfParse: PdfParseFn | null = null;
async function getPdfParse(): Promise<PdfParseFn> {
  if (_pdfParse) return _pdfParse;
  const mod = await import("pdf-parse");
  // CJS default export may be on .default or on the module itself
  _pdfParse = (mod.default ?? mod) as unknown as PdfParseFn;
  return _pdfParse;
}

const router: IRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and DOCX files are supported."));
    }
  },
});

router.post("/", (req, res, next) => {
  upload.single("resume")(req, res, (err) => {
    if (err) {
      res.status(400).json({ error: err.message ?? "File upload failed." });
      return;
    }
    next();
  });
}, async (req, res) => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: "No file uploaded." });
    return;
  }

  try {
    let text = "";

    if (file.mimetype === "application/pdf") {
      const pdfParse = await getPdfParse();
      const data = await pdfParse(file.buffer);
      text = data.text ?? "";
    } else {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      text = result.value ?? "";
    }

    text = text
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim();

    if (!text) {
      res.status(422).json({ error: "Could not extract text from file. The document may be scanned or image-based." });
      return;
    }

    res.json({
      text,
      wordCount: text.split(/\s+/).filter(Boolean).length,
      fileName: file.originalname,
    });
  } catch (err) {
    console.error("Resume parse error:", err);
    res.status(500).json({ error: "Failed to parse resume file." });
  }
});

export default router;
