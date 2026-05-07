# 🐛 BUG-ANALYZE-WEB COMMAND — PHÂN TÍCH LỖI (WEB)

## 📋 TỔNG QUAN
Điều tra lỗi cho ArtLab (Next.js + .NET) theo pipeline có bằng chứng — **CHỈ ĐIỀU TRA & KẾT LUẬN NGUYÊN NHÂN**, không sửa code trực tiếp trong command này.

---

## 🎯 MỤC ĐÍCH
- Thu thập bằng chứng (log/console/network/config) và khoanh vùng lỗi.
- Xác định root cause theo layer: **frontend / auth / backend / DB / infra**.

---

## 🧩 CHẾ ĐỘ
- `mode=frontend`: hydration, runtime error, UI không render, CSS/layout vỡ.
- `mode=auth`: next-auth callback, session/token/role sai.
- `mode=backend`: 4xx/5xx, exception, mapping/validation, CORS.
- `mode=db`: migration/schema mismatch, query fail, connection.

---

## 🛠️ QUY TRÌNH (BẮT BUỘC)
1. **Tóm tắt triệu chứng** + bước tái hiện.
2. **Thu thập bằng chứng**
   - Frontend: console errors/warnings, network tab (4xx/5xx), route bị fail.
   - Backend: logs, controller/service stacktrace (nếu có), status codes.
   - Config: env (`.env.local`, `appsettings*.json`), CORS/JWT settings.
   - DB: migrations list + snapshot thay đổi.
3. **Khoanh vùng**
   - lỗi xảy ra trước hay sau auth?
   - request nào fail? payload gì? code path nào?
4. **Kết luận root cause** (chỉ khi đủ bằng chứng).
5. **Artifacts cần thêm** nếu chưa đủ kết luận.

---

## 📦 ĐẦU RA
- Triệu chứng + repro steps
- Bằng chứng (trích từ log/console/network)
- Root cause (nếu đủ bằng chứng)
- Artifacts còn thiếu (nếu thiếu)

🚫 Không sửa code trong command này (muốn sửa thì chuyển qua task implementation).
