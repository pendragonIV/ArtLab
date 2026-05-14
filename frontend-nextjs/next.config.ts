import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async headers() {
    return [
      {
        // Áp dụng cho toàn bộ các trang trên website
        source: "/(.*)",
        headers: [
          // ── Lớp 4A: Permissions Policy ─────────────────────────────────────
          // Chặn hoàn toàn: screen share, camera, mic, Picture-in-Picture, geolocation
          {
            key: "Permissions-Policy",
            value: [
              "display-capture=()",       // Chặn getDisplayMedia() — screen share
              "camera=()",                // Chặn camera API
              "microphone=()",            // Chặn microphone API
              "picture-in-picture=()",    // Chặn PiP (dễ bypass record)
              "geolocation=()",           // Không cần thiết cho e-learning
              "usb=()",                   // Chặn USB device access
            ].join(", "),
          },

          // ── Lớp 4B: Content Security Policy ────────────────────────────────
          // Chỉ cho phép video load từ VdoCipher CDN — chặn hotlink video từ domain khác
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://player.vdocipher.com https://api.ipify.org",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              // Chỉ cho phép media/iframe từ VdoCipher
              "media-src 'self' blob: https://*.vdocipher.com https://*.vdostream.net",
              "frame-src 'self' https://player.vdocipher.com",
              // API calls
              "connect-src 'self' http://localhost:5149 https://*.up.railway.app https://*.vdocipher.com https://api.ipify.org",
              "img-src 'self' data: blob: https:",
              // Chặn mọi object/embed
              "object-src 'none'",
              "base-uri 'self'",
            ].join("; "),
          },

          // ── Lớp 4C: X-Frame-Options ─────────────────────────────────────────
          // Chặn site bị nhúng vào iframe bởi domain khác (clickjacking + screen share relay)
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },

          // ── Lớp 4D: Miscellaneous security hardening ─────────────────────────
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
