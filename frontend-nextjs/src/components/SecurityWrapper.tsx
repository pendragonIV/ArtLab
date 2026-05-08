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

    // Bẫy debugger chống bật F12 từ menu trình duyệt (Tùy chọn cực đoan)
    // const detectDevTools = () => {
    //   const widthThreshold = window.outerWidth - window.innerWidth > 160;
    //   const heightThreshold = window.outerHeight - window.innerHeight > 160;
    //   if (widthThreshold || heightThreshold) {
    //       // DevTools might be open
    //   }
    // };
    // setInterval(detectDevTools, 1000);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [pathname]);

  return null;
}
