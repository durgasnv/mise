import http from "node:http";
import dotenv from "dotenv";
dotenv.config();

import generateRecipe from "./api/generate-recipe.js";
import health from "./api/health.js";
import hello from "./api/hello.js";

const ROUTES = {
  "/api/generate-recipe": generateRecipe,
  "/api/health": health,
  "/api/hello": hello,
};

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

  const { pathname } = new URL(req.url, `http://${req.headers.host}`);
  const handler = ROUTES[pathname];

  if (!handler) {
    res.status(404).json({ error: "Not found" });
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
  console.log(`Backend dev server listening on http://localhost:${PORT}`);
});
