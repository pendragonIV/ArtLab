import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async headers() {
    return [
      {
        // Áp dụng cho toàn bộ các trang trên website
        source: "/(.*)",
        headers: [
          {
            key: "Permissions-Policy",
            // Chặn hoàn toàn API chia sẻ màn hình (getDisplayMedia)
            // Ngăn người dùng share tab qua Discord Web, Google Meet, Microsoft Teams Web...
            value: "display-capture=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
