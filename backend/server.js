import http from "node:http";
import dotenv from "dotenv";
dotenv.config();

import generateRecipe from "./api/generate-recipe.js";
import health from "./api/health.js";
import hello from "./api/hello.js";
import auth from "./api/auth.js";

const PORT = process.env.PORT || 5000;

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function wrapResponse(res) {
  res.status = function status(code) {
    res.statusCode = code;
    return res;
  };
  res.json = function json(payload) {
    if (!res.getHeader("Content-Type")) {
      res.setHeader("Content-Type", "application/json");
    }
    res.end(JSON.stringify(payload));
  };
  return res;
}

const server = http.createServer(async (req, res) => {
  wrapResponse(res);

  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  let pathname = url.pathname;

  // Normalize path (support both /api/path and /path)
  const normalizedPath = pathname.startsWith("/api") ? pathname : `/api${pathname === "/" ? "/health" : pathname}`;

  let handler = null;

  if (normalizedPath === "/api/generate-recipe") {
    handler = generateRecipe;
  } else if (normalizedPath === "/api/health" || normalizedPath === "/api/") {
    handler = health;
  } else if (normalizedPath === "/api/hello") {
    handler = hello;
  } else if (normalizedPath.startsWith("/api/auth")) {
    handler = auth;
  }

  if (!handler) {
    res.status(404).json({ error: `Route ${pathname} not found.` });
    return;
  }

  try {
    req.body = await readBody(req);
    await handler(req, res);
  } catch (error) {
    console.error("Unhandled error:", error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

server.listen(PORT, () => {
  console.log(`Backend service listening on port ${PORT}`);
});
