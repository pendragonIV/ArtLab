"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5149";

// Debounce helper — prevents flooding the server with duplicate events
function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return ((...args: unknown[]) => {
    if (timer) return; // already queued — ignore
    timer = setTimeout(() => { timer = null; }, ms);
    fn(...args);
  }) as T;
}

export default function SecurityWrapper() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const lastEventRef = useRef<Record<string, number>>({});

  // ── Send security event to backend (Lớp 8c) ─────────────────────────────
  const logEvent = (eventType: string, detail?: string) => {
    const now = Date.now();
    // Rate-limit per event type: max once every 30s client-side
    if (lastEventRef.current[eventType] && now - lastEventRef.current[eventType] < 30_000) return;
    lastEventRef.current[eventType] = now;

    // @ts-ignore
    const token = session?.backendToken;
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    // Fire-and-forget — không cần await
    fetch(`${BACKEND}/api/session/security-event`, {
      method: "POST",
      headers,
      body: JSON.stringify({ eventType, detail }),
    }).catch(() => {}); // silent — security logging phải không gây lỗi UX
  };

  useEffect(() => {
    // Không áp dụng trên trang admin/tutor — cho phép dev debug bình thường
    if (pathname?.startsWith("/admin") || pathname?.startsWith("/tutor")) return;

    // ── Chặn right-click ────────────────────────────────────────────────────
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // ── Chặn phím tắt DevTools ──────────────────────────────────────────────
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === "F12") {
        e.preventDefault();
        logEvent("DevToolsOpened", "F12 key pressed");
      }

      // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C
      if (e.ctrlKey && e.shiftKey && ["I", "i", "J", "j", "C", "c"].includes(e.key)) {
        e.preventDefault();
        logEvent("DevToolsOpened", `Ctrl+Shift+${e.key}`);
      }

      // Ctrl+U (View Source)
      if (e.ctrlKey && (e.key === "U" || e.key === "u")) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    // ── Debugger trap — phát hiện DevTools đang mở sẵn ─────────────────────
    // Nếu DevTools mở, Function("debugger") sẽ khiến thực thi dừng/chậm lại
    const debuggerTrap = setInterval(() => {
      try {
        console.clear();
        Function("debugger")();
      } catch (e) {}
    }, 500);

    // ── Resize trap — phát hiện DevTools ghim vào cạnh ─────────────────────
    const logDevToolsOpen = debounce(() => {
      logEvent("DevToolsOpened", "Window resize delta detected");
    }, 5000);

    const resizeTrap = setInterval(() => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;
      if (widthThreshold || heightThreshold) {
        document.body.innerHTML = "<div style='display:flex;height:100vh;width:100vw;background:#000;color:#ef4444;justify-content:center;align-items:center;font-size:24px;font-weight:bold;font-family:sans-serif;'>DevTools Access Blocked</div>";
        logDevToolsOpen();
      }
    }, 1000);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      clearInterval(debuggerTrap);
      clearInterval(resizeTrap);
    };
  }, [pathname, session]);

  return null;
}
