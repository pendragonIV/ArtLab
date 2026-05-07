# 🔍 CODE-ANALYZE-WEB COMMAND — PHÂN TÍCH CẤU TRÚC CODE (WEB)

## 📋 TỔNG QUAN
Phân tích cấu trúc code, luồng chạy, và kiến trúc cho **ArtLab web** (Next.js + ASP.NET) — **CHỈ PHÂN TÍCH, KHÔNG SỬA, KHÔNG ĐỀ XUẤT GIẢI PHÁP**.

---

## 🎯 MỤC ĐÍCH
- Xác định **cấu trúc** (frontend/backend boundaries, module layout).
- Truy vết **luồng chạy**: UI → API → DB (hoặc auth callback).
- Kiểm tra **dependencies** và nơi đặt logic đúng layer.

---

## 🧩 PHẠM VI
### Frontend (Next.js 16)
- App Router segments (`src/app/**`), Server/Client boundary, route handlers.
- Auth flow (next-auth), session/token exposure.
- CSS Modules + component organization.

### Backend (.NET)
- Controllers → Services → EF Core → DB.
- DTO mapping, status codes, auth/claims, CORS.
- Migrations + snapshot changes.

---

## 🧠 ĐẦU VÀO
Bạn cung cấp 1 trong các dạng:
- File/route cần phân tích (vd: `frontend-nextjs/src/app/learn/[courseId]/page.tsx`)
- Endpoint/backend controller (vd: `backend-dotnet/Controllers/CoursesController.cs`)
- Triệu chứng/flow (vd: “đăng nhập Google xong không có role đúng”)

Tuỳ chọn: `mode=architecture|flow|dependencies|security` (mặc định: auto)

---

## 🛠️ QUY TRÌNH PHÂN TÍCH (BẮT BUỘC)
1. **Tóm tắt vấn đề/goal** (1–3 câu).
2. **Thu thập bằng chứng từ code**:
   - File liên quan, import graph, call sites.
   - Với Next: xác định Server/Client boundary và nơi fetch.
   - Với .NET: xác định controller action → service → DbContext.
3. **Vẽ luồng chạy** (bullet flow hoặc sơ đồ chữ).
4. **Chỉ ra điểm đặt logic đúng/sai layer** (nếu có).
5. **Liệt kê artifacts còn thiếu** (file/env/doc) nếu không đủ kết luận.

---

## 📦 ĐẦU RA
- Tóm tắt
- Phân tích cấu trúc
- Luồng chạy (UI→API→DB/Auth)
- Dependencies đáng chú ý
- Artifacts cần bổ sung (nếu thiếu)

🚫 Không đưa giải pháp/patch code trong command này.
