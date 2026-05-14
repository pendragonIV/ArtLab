/**
 * Reads JWT `sub` in the browser for display (e.g. session watermark).
 * Does not verify the signature — caller must only use for non-security UI.
 */
export function getJwtPayloadSub(token: string | undefined): string | undefined {
  if (!token) return undefined;
  try {
    const part = token.split(".")[1];
    if (!part) return undefined;
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
    const json = globalThis.atob(b64 + pad);
    const payload = JSON.parse(json) as { sub?: unknown };
    return typeof payload.sub === "string" ? payload.sub : undefined;
  } catch {
    return undefined;
  }
}
