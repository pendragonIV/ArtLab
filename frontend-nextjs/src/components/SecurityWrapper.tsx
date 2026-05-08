"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function SecurityWrapper() {
  const pathname = usePathname();

  useEffect(() => {
    // Không chặn F12 ở trang Admin để dev còn sửa lỗi
    if (pathname?.startsWith("/admin") || pathname?.startsWith("/tutor")) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === "F12") {
        e.preventDefault();
      }
      
      // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C
      if (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j" || e.key === "C" || e.key === "c")) {
        e.preventDefault();
      }
      
      // Ctrl+U (View Source)
      if (e.ctrlKey && (e.key === "U" || e.key === "u")) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    // Bẫy Debugger chống mở DevTools từ trước
    // Nếu họ mở sẵn F12 ở tab khác rồi paste link vào, bẫy này sẽ làm trình duyệt liên tục bị Pause, không thao tác được.
    const debuggerTrap = setInterval(() => {
      try {
        // Xóa console liên tục để không đọc được log network/data
        console.clear();
        // Ép dừng thực thi nếu DevTools đang mở
        Function("debugger")();
      } catch (e) {}
    }, 500);

    // Bẫy phát hiện sự chênh lệch kích thước cửa sổ (khi DevTools được ghim vào cạnh màn hình)
    const resizeTrap = setInterval(() => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;
      if (widthThreshold || heightThreshold) {
        document.body.innerHTML = "<div style='display:flex;height:100vh;width:100vw;background:#000;color:#ef4444;justify-content:center;align-items:center;font-size:24px;font-weight:bold;font-family:sans-serif;'>DevTools Access Blocked</div>";
      }
    }, 1000);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      clearInterval(debuggerTrap);
      clearInterval(resizeTrap);
    };
  }, [pathname]);

  return null;
}
