---
name: visual-qa-testing
description: Visually QA web UI changes by running the Next.js dev server, checking console errors, and doing a quick manual smoke test in a browser. Use after making UI changes in frontend-nextjs to verify they look correct.
disable-model-invocation: true
---

# Visual QA Testing (ArtLab)

## Khi dùng
- Sau khi sửa UI trong `frontend-nextjs/src/**` (layout/page/component/CSS Modules).
- Khi nghi có lỗi hydration, lỗi runtime, hoặc API call bị fail.

## Quy trình nhanh
1. **Đảm bảo dev server đang chạy**
   - Nếu chưa chạy:
     - `cd frontend-nextjs`
     - `npm install` (nếu lần đầu)
     - `npm run dev`
2. **Mở trình duyệt** tại `http://localhost:3000` và vào đúng route vừa sửa.
3. **Kiểm tra console**:
   - Không có `TypeError`, hydration mismatch, hoặc lỗi import.
4. **Kiểm tra network**:
   - Không có request 4xx/5xx bất thường; auth callback/route handlers hoạt động đúng.
5. **Smoke test tương tác** (nếu có):
   - click / form submit / navigation (Link) / auth flow tối thiểu.

## Báo cáo kết quả (format)
- **UI**: OK / lỗi gì (mô tả ngắn)
- **Console**: sạch / liệt kê lỗi
- **Network**: sạch / endpoint fail nào
