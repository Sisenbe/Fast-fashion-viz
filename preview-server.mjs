/**
 * Zero-deps static server for local preview (CSV fetch requires http://).
 * Usage: node preview-server.mjs
 */
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = __dirname;
const port = Number(process.env.PORT) || 8080;

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function safeJoin(urlPath) {
  let rel = decodeURIComponent(urlPath.split("?")[0]);
  if (rel.startsWith("/")) rel = rel.slice(1);
  const joined = path.normalize(path.join(root, rel));
  const rootNorm = path.normalize(root + path.sep);
  if (!joined.startsWith(rootNorm) && joined !== path.normalize(root)) return null;
  return joined;
}

const server = http.createServer((req, res) => {
  let filePath = safeJoin(req.url === "/" ? "/index.html" : req.url);
  if (filePath && fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }
  if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }
  const ext = path.extname(filePath);
  res.writeHead(200, { "Content-Type": mime[ext] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(port, () => {
  console.log(`Preview: http://localhost:${port}/`);
});
