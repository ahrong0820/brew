import * as fs from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";

const mime = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

export async function startStaticExportServer(outDir = path.resolve("out")) {
  const server = createServer(async (request, response) => {
    const url = new URL(request.url || "/", "http://127.0.0.1");
    if (!url.pathname.startsWith("/brew")) {
      response.writeHead(404).end();
      return;
    }

    let pathname = decodeURIComponent(url.pathname.slice("/brew".length));
    if (!pathname || pathname === "/") pathname = "/index.html";
    if (pathname.endsWith("/")) pathname += "index.html";

    let file = path.resolve(outDir, `.${pathname}`);
    if (!(file.startsWith(`${outDir}${path.sep}`) || file === outDir)) {
      response.writeHead(404).end();
      return;
    }

    try {
      if ((await fs.stat(file)).isDirectory()) file = path.join(file, "index.html");
    } catch {
      if (!path.extname(file)) file = path.join(outDir, "index.html");
    }

    try {
      const body = await fs.readFile(file);
      response.writeHead(200, {
        "Cache-Control": "no-store",
        "Content-Type": mime[path.extname(file)] || "application/octet-stream",
      });
      response.end(body);
    } catch {
      response.writeHead(404).end();
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("E2E server port unavailable");
  }

  return {
    server,
    url: `http://127.0.0.1:${address.port}/brew/`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}
