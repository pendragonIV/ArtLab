type LogLevel = "info" | "warn" | "error";

function log(level: LogLevel, message: string, data?: Record<string, unknown>) {
  const payload = data ? { ...data } : undefined;
  // eslint-disable-next-line no-console
  console[level](payload ? `${message} ${JSON.stringify(payload)}` : message);
}

function getBackendBaseUrl() {
  // Client components can only read NEXT_PUBLIC_*
  const publicUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  const serverUrl = process.env.BACKEND_BASE_URL;
  return (serverUrl || publicUrl || "http://localhost:5149").replace(/\/$/, "");
}

async function readBodySnippet(res: Response, max = 600) {
  try {
    const text = await res.text();
    return text.length > max ? `${text.slice(0, max)}…` : text;
  } catch {
    return null;
  }
}

export async function backendFetch(
  path: string,
  init: RequestInit & { timeoutMs?: number } = {},
  ctx: { name: string; requestId?: string } = { name: "backendFetch" },
) {
  const baseUrl = getBackendBaseUrl();
  const url = path.startsWith("http") ? path : `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
  const method = (init.method || "GET").toUpperCase();
  const start = Date.now();

  const { timeoutMs, ...rest } = init;
  const controller = timeoutMs ? new AbortController() : null;
  const timeout = timeoutMs
    ? setTimeout(() => controller?.abort(`timeout ${timeoutMs}ms`), timeoutMs)
    : null;

  try {
    const res = await fetch(url, { ...rest, signal: controller?.signal ?? rest.signal });
    const ms = Date.now() - start;

    if (!res.ok) {
      const snippet = await readBodySnippet(res);
      log("error", "[backendFetch] non-OK response", {
        name: ctx.name,
        requestId: ctx.requestId,
        method,
        url,
        status: res.status,
        ms,
        body: snippet,
      });
    } else {
      log("info", "[backendFetch] ok", { name: ctx.name, requestId: ctx.requestId, method, url, status: res.status, ms });
    }

    return res;
  } catch (err) {
    const ms = Date.now() - start;
    log("error", "[backendFetch] fetch failed", {
      name: ctx.name,
      requestId: ctx.requestId,
      method,
      url,
      ms,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

