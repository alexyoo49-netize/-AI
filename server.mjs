import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "public");
const port = Number(process.env.PORT || 4173);

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function send(res, status, body, type = "application/json; charset=utf-8") {
  res.writeHead(status, {
    "content-type": type,
    "access-control-allow-origin": "*",
  });
  res.end(body);
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : {};
}

async function extractPdfText(base64) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const bytes = Uint8Array.from(Buffer.from(base64, "base64"));
  const loadingTask = pdfjs.getDocument({
    data: bytes,
    disableWorker: true,
    useSystemFonts: true,
  });
  const pdf = await loadingTask.promise;
  const pages = [];
  for (let pageNo = 1; pageNo <= Math.min(pdf.numPages, 8); pageNo += 1) {
    const page = await pdf.getPage(pageNo);
    const content = await page.getTextContent();
    const text = content.items.map((item) => item.str).join(" ");
    pages.push(text);
  }
  return {
    pageCount: pdf.numPages,
    text: pages.join("\n\n").replace(/\s+/g, " ").trim(),
  };
}

async function handleApi(req, res) {
  if (req.method === "OPTIONS") return send(res, 204, "");

  if (req.url === "/api/extract-pdf" && req.method === "POST") {
    try {
      const body = await readJson(req);
      if (!body.base64) return send(res, 400, JSON.stringify({ error: "base64 is required" }));
      const result = await extractPdfText(body.base64);
      return send(res, 200, JSON.stringify(result));
    } catch (error) {
      return send(
        res,
        500,
        JSON.stringify({
          error: "PDF 텍스트 추출에 실패했습니다. 이력서 내용을 텍스트로 붙여넣어 주세요.",
          detail: error.message,
        }),
      );
    }
  }

  return send(res, 404, JSON.stringify({ error: "not found" }));
}

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://localhost:${port}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";
  const target = path.normalize(path.join(publicDir, pathname));
  if (!target.startsWith(publicDir)) return send(res, 403, "Forbidden", "text/plain; charset=utf-8");

  try {
    const stat = await fs.stat(target);
    if (stat.isDirectory()) return send(res, 403, "Forbidden", "text/plain; charset=utf-8");
    const body = await fs.readFile(target);
    send(res, 200, body, mime[path.extname(target)] || "application/octet-stream");
  } catch {
    send(res, 404, "Not found", "text/plain; charset=utf-8");
  }
}

const server = http.createServer(async (req, res) => {
  if (req.url.startsWith("/api/")) return handleApi(req, res);
  return serveStatic(req, res);
});

server.listen(port, () => {
  console.log(`내일경로 AI MVP: http://localhost:${port}`);
});
