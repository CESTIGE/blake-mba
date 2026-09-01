import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const MAX_BODY_BYTES = 12_000;
const REPOSITORY_ROOT = path.resolve(process.cwd());

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function isInsideRepository(candidate) {
  const relative = path.relative(REPOSITORY_ROOT, candidate);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

function resolveStaticPath(requestPath) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(requestPath);
  } catch {
    return null;
  }
  const candidate = path.resolve(REPOSITORY_ROOT, `.${decodedPath}`);
  return isInsideRepository(candidate) ? candidate : null;
}

async function serveStatic(request, response, requestUrl, port) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end();
    return;
  }

  const pathname = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  let filePath = resolveStaticPath(pathname);
  if (!filePath) {
    response.writeHead(403);
    response.end();
    return;
  }

  try {
    if ((await stat(filePath)).isDirectory()) filePath = path.join(filePath, "index.html");
    if (!isInsideRepository(filePath) || !(await stat(filePath)).isFile()) {
      response.writeHead(404);
      response.end();
      return;
    }
    let body = await readFile(filePath);
    if (requestUrl.pathname === "/survey/") {
      body = Buffer.from(body.toString("utf8").replace(
        'data-survey-endpoint=""',
        `data-survey-endpoint="http://127.0.0.1:${port}/api/survey"`,
      ));
    }
    response.writeHead(200, { "Content-Type": contentTypes[path.extname(filePath).toLowerCase()] ?? "application/octet-stream" });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch (error) {
    if (error?.code === "ENOENT" || error?.code === "ENOTDIR") {
      response.writeHead(404);
      response.end();
      return;
    }
    response.writeHead(500);
    response.end();
  }
}

function handleSurveyApi(request, response, requestUrl) {
  if (request.method !== "POST") {
    response.writeHead(405, { Allow: "POST" });
    response.end();
    return;
  }
  if (Number(request.headers["content-length"] ?? 0) > MAX_BODY_BYTES) {
    request.resume();
    response.writeHead(413);
    response.end();
    return;
  }

  let byteLength = 0;
  let responded = false;
  request.on("data", (chunk) => {
    byteLength += chunk.length;
    if (!responded && byteLength > MAX_BODY_BYTES) {
      responded = true;
      response.writeHead(413);
      response.end();
    }
  });
  request.on("end", () => {
    if (responded) return;
    if (requestUrl.searchParams.get("mock") === "error") {
      sendJson(response, 200, {
        ok: false,
        code: "WRITE_ERROR",
        message: "目前無法儲存回覆，請稍後再試。",
      });
      return;
    }
    sendJson(response, 200, { ok: true, submissionId: "local-preview-submission" });
  });
  request.on("error", () => {
    if (!responded && !response.writableEnded) {
      response.writeHead(400);
      response.end();
    }
  });
}

function parsePort(argumentsList) {
  const index = argumentsList.indexOf("--port");
  const value = index === -1 ? "4173" : argumentsList[index + 1];
  const port = Number(value);
  if (!Number.isInteger(port) || port < 0 || port > 65_535) throw new Error("--port must be an integer from 0 to 65535");
  return port;
}

const requestedPort = parsePort(process.argv.slice(2));
const server = createServer((request, response) => {
  const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
  if (requestUrl.pathname === "/api/survey") {
    handleSurveyApi(request, response, requestUrl);
    return;
  }
  serveStatic(request, response, requestUrl, server.address()?.port);
});

server.listen(requestedPort, "127.0.0.1", () => {
  const address = server.address();
  console.log(`Survey preview listening at http://127.0.0.1:${address.port}/survey/`);
});

function stopServer() {
  server.close(() => process.exit(0));
}

process.once("SIGINT", stopServer);
process.once("SIGTERM", stopServer);
