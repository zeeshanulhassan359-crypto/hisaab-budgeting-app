import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import Anthropic from "@anthropic-ai/sdk";
import { answerQuestion } from "./ask.js";
import { MAX_QUESTION_LENGTH, cleanQuestion } from "./localChecks.js";
import { AGE_BANDS, type AgeBand } from "./types.js";

const PORT = Number(process.env.PORT ?? 8787);
const MAX_BODY_BYTES = 4096;
const REQUESTS_PER_MINUTE = Number(process.env.REQUESTS_PER_MINUTE ?? 20);

// Simple per-device-IP rate limit so one device can't run up the AI bill.
// Replace with a shared store (e.g. Redis) when running more than one instance.
const recentRequests = new Map<string, number[]>();
function allowRequest(key: string): boolean {
  const now = Date.now();
  const windowStart = now - 60_000;
  const times = (recentRequests.get(key) ?? []).filter((t) => t > windowStart);
  if (times.length >= REQUESTS_PER_MINUTE) {
    recentRequests.set(key, times);
    return false;
  }
  times.push(now);
  recentRequests.set(key, times);
  return true;
}

function log(event: string, detail: Record<string, unknown> = {}) {
  // Never log question text or answers: only events and categories.
  console.log(JSON.stringify({ at: new Date().toISOString(), event, ...detail }));
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY_BYTES) throw new Error("body_too_large");
    chunks.push(chunk as Buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function isAgeBand(value: unknown): value is AgeBand {
  return typeof value === "string" && (AGE_BANDS as readonly string[]).includes(value);
}

const server = createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    return send(res, 200, { ok: true });
  }
  if (req.method !== "POST" || req.url !== "/ask") {
    return send(res, 404, { error: "not_found" });
  }

  const sharedKey = process.env.APP_SHARED_KEY;
  if (sharedKey && req.headers["x-app-key"] !== sharedKey) {
    return send(res, 401, { error: "unauthorized" });
  }

  const clientKey = req.socket.remoteAddress ?? "unknown";
  if (!allowRequest(clientKey)) {
    return send(res, 429, { error: "slow_down" });
  }

  let body: unknown;
  try {
    body = await readJson(req);
  } catch {
    return send(res, 400, { error: "bad_request" });
  }

  const { question, ageBand } = (body ?? {}) as Record<string, unknown>;
  if (typeof question !== "string" || !isAgeBand(ageBand)) {
    return send(res, 400, { error: "bad_request" });
  }
  const cleaned = cleanQuestion(question);
  if (cleaned.length === 0 || cleaned.length > MAX_QUESTION_LENGTH) {
    return send(res, 400, { error: "bad_length" });
  }

  try {
    const result = await answerQuestion(cleaned, ageBand, log);
    return send(res, 200, result);
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      log("upstream_rate_limited");
    } else if (error instanceof Anthropic.APIError) {
      log("upstream_error", { status: error.status });
    } else {
      log("internal_error", { message: error instanceof Error ? error.message : "unknown" });
    }
    // 503 tells the app to use its offline topic pack instead.
    return send(res, 503, { error: "unavailable" });
  }
});

server.listen(PORT, () => log("listening", { port: PORT }));
