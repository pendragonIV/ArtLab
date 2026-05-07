# 📝 DOCS-UPDATE COMMAND — HƯỚNG DẪN CẬP NHẬT DOCS (ARTLAB)

## 📋 TỔNG QUAN
Command này giúp bạn **xác định chính xác file Docs cần cập nhật** sau khi thay đổi code.  
Mục tiêu: docs luôn khớp code, không bỏ sót.

---

## 🎯 KHI DÙNG
- Sau khi thay đổi **API contract**, **auth**, **payment**, **DB schema/migrations**, **infra**, hoặc **luồng UI quan trọng**.
- Khi thay đổi **cách chạy dev**, ports, env vars, hoặc cấu trúc thư mục.

---

## 🧠 ĐẦU VÀO
Mô tả ngắn thay đổi theo 1 trong các dạng:
- `docs-update: frontend ...`
- `docs-update: backend ...`
- `docs-update: auth ...`
- `docs-update: db ...`
- `docs-update: infra ...`
- `docs-update: workflow ...`

Ví dụ:
```
docs-update: auth thay đổi cách sync role từ backend
docs-update: db rename cột duration -> durationSeconds
docs-update: frontend thêm route /my-courses và flow empty state
docs-update: workflow đổi lệnh chạy dev backend
```

---

## 🛠️ PIPELINE (BẮT BUỘC)
1. **Tóm tắt thay đổi** (1–3 câu) + phạm vi (`frontend-nextjs/` hay `backend-dotnet/`).
2. **Chọn file doc cần cập nhật** theo bảng dưới.
3. **Liệt kê mục cần sửa** (bullet) + “định nghĩa xong” cho docs.
4. Nếu có breaking change/migration: thêm **steps migrate**.

---

## 📌 MAP: THAY ĐỔI → FILE DOC
- **Cài đặt/chạy dev/ports/env** → `SETUP.md`
- **Kiến trúc/tầng/layer/boundaries** → `Docs/PROJECT_ARCHITECTURE.md`
- **Workflow làm việc/commit/review/checklist** → `Docs/WORKFLOW.md`
- **Quy ước coding/rules nội bộ** → `Docs/PROJECT_RULES.md`
- **Docker/DB/infra/network/payment providers** → `Docs/INFRASTRUCTURE.md`

---

## ✅ OUTPUT FORMAT (BẮT BUỘC)
- **Files cần cập nhật**: danh sách path
- **Nội dung cần bổ sung/sửa**: 3–10 bullet
- **Breaking change?**: Có/Không
- **Migration/rollout steps (nếu có)**: bullet checklist
