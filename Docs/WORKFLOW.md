# ArtLab - Luồng Thao Tác & Quy Trình Làm Việc (Workflow)

Tài liệu này hướng dẫn cách làm việc (checkout, run code, commit) để đảm bảo chất lượng source code của dự án ArtLab.

## 1. Yêu Cầu Cài Đặt Ban Đầu (Prerequisites)
- **Node.js:** v18 trở lên (để chạy Next.js).
- **.NET SDK:** v8.0 trở lên (để chạy Backend).
- **Database:** SQL Server (có thể dùng Docker hoặc SQL Server Express).
- **IDE:** Visual Studio Code (hoặc Visual Studio cho Backend).

## 2. Cách Khởi Chạy Dự Án Chạy Môi Trường Dev

Bạn cần chạy đồng thời cả 2 hệ thống. Nên mở 2 terminal (hoặc 2 cửa sổ VS Code).

### Chạy Backend (C# API):
```bash
cd c:\Dev\artlab\backend-dotnet
dotnet build
dotnet run
```
API sẽ khởi chạy ở `http://localhost:5000` hoặc `https://localhost:5001`. Xem tài liệu Swagger tại `http://localhost:5000/swagger`.

### Chạy Frontend (Next.js):
```bash
cd c:\Dev\artlab\frontend-nextjs
npm run dev
```
Giao diện sẽ chạy tại `http://localhost:3000`.

---

## 3. Quy Trình Git & Quản Lý Mã Nguồn

Do đặc thù 2 phần riêng biệt, chúng ta sẽ lưu chung trên 1 repo (Monorepo) hoặc 2 repo. Dưới đây là quy tắc commit:

### 3.1. Nhánh làm việc (Branching)
- `main`: Chứa code đã được kiểm duyệt, sẵn sàng deploy lên Production.
- `dev`: Nhánh phát triển chính, mọi tính năng mới đều gộp vào đây trước.
- `feature/[tên-tính-năng]`: Nhánh dùng để làm tính năng mới (vd: `feature/login`, `feature/course-grid`).

### 3.2. Cấu trúc Commit Message (Tiếng Việt)
Áp dụng **Conventional Commits** để dễ đọc lịch sử:
- `feat: [Mô tả]` -> Khi thêm chức năng mới. (vd: `feat: Thêm API đăng ký user`)
- `fix: [Mô tả]` -> Khi sửa lỗi. (vd: `fix: Lỗi lệch hình UI card khóa học`)
- `refactor: [Mô tả]` -> Khi tối ưu lại code cũ nhưng không thay đổi logic.
- `docs: [Mô tả]` -> Khi sửa/viết thêm tài liệu.

### 3.3. Quy trình làm 1 tính năng mới
1. Kéo code mới nhất: `git checkout dev` -> `git pull`
2. Tạo nhánh mới: `git checkout -b feature/tinh-nang-a`
3. Code tính năng và test cẩn thận.
4. Add và Commit: `git commit -m "feat: Đã xong tính năng A"`
5. Đẩy code lên: `git push origin feature/tinh-nang-a`
6. Tạo Pull Request (PR) gộp vào nhánh `dev`.

---

## 4. Quy Trình Làm Việc Giữa User (Bạn) và Trợ Lý AI

Khi làm việc với tôi (Antigravity AI), hãy làm theo cách sau để đạt hiệu quả cao nhất:
1. **Thiết kế trước (UI-First):** Chúng ta sẽ luôn chốt UI trên file `.pen` trước. Khi UI được chốt, Code mới bắt đầu.
2. **Làm từng phần (Iterative):** Yêu cầu tạo từng Component (Frontend) hoặc từng API Endpoint (Backend). Không nên yêu cầu code cả hệ thống cùng lúc.
3. **Cập nhật Task:** Khi hoàn thành một phần, hãy nhắc tôi đánh dấu tick `[x]` trong file `task.md`.
4. **Kiểm tra liên tục (Test-driven):** Mỗi khi code xong 1 cụm, hãy tự bật `npm run dev` hoặc `dotnet run` để xem và báo lại cho tôi nếu có lỗi.
