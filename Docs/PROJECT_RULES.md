# Quy Tắc Lập Trình Dự Án ArtLab (Project Rules)

Tài liệu này định nghĩa các tiêu chuẩn lập trình cho cả Frontend (Next.js) và Backend (C# .NET) của dự án ArtLab. **BẮT BUỘC** tuân thủ trong suốt quá trình phát triển.

## I. Cấu Trúc Mã Nguồn (Architecture)

### 1. Backend (C# .NET 8 Web API)
- Sử dụng **Clean Architecture** hoặc kiến trúc **N-Tier** chặt chẽ.
- Cấm gọi trực tiếp Database (DbContext) từ Controllers. Mọi truy vấn phải đi qua luồng: `Controller -> Service -> Repository (hoặc EF Context)`.
- Không sử dụng Service Locator pattern để lấy dependencies. Phải tiêm thông qua Constructor (Dependency Injection).
- **Thư mục cơ bản:**
  - `/Controllers`: Tiếp nhận request REST.
  - `/Services`: Chứa logic nghiệp vụ lõi (Business Logic).
  - `/Models` hoặc `/Entities`: Định nghĩa các cấu trúc bảng (Table).
  - `/Data`: Chứa DbContext và Migrations.

### 2. Frontend (Next.js)
- Sử dụng **App Router** (thư mục `app/`).
- Tối đa hóa việc dùng **Server Components**. Chỉ thêm `'use client'` ở đỉnh file khi cần tương tác người dùng (onClick, useState, useEffect).
- Tách biệt UI Components (như Buttons, Cards) vào thư mục `components/`.
- Quản lý State bằng **Zustand**, Fetching data bằng SWR hoặc native fetch của Next.js.
- Sử dụng **Vanilla CSS Modules** (`.module.css`), KHÔNG dùng Tailwind.

## II. Quy Tắc Viết Code (Coding Conventions)

### 1. Đặt tên (Naming Conventions)
- **C#:** 
  - Class/Method: `PascalCase`.
  - Interfaces bắt đầu bằng chữ 'I' (VD: `IUserService`).
  - Biến cục bộ / tham số: `camelCase`.
- **TypeScript/React:**
  - Component / File chứa Component: `PascalCase` (VD: `CourseCard.tsx`).
  - Hàm / File tiện ích (utils): `camelCase` (VD: `formatDate.ts`).

### 2. Xử Lý Lỗi (Error Handling - Fail-Fast)
- **Luôn quăng Exception (Throw) thay vì trả về null** khi gặp lỗi sai logic hệ thống. Để Middleware (hoặc Filter) chặn Exception đó ở cấp cao nhất và trả về HTTP Status phù hợp (400, 404, 500).
- Không được "nuốt" lỗi bằng `try/catch` trống.

### 3. Ghi Chú Code (Documentation)
- Mọi class, interface và các hàm logic phức tạp trong C# **phải có thẻ XML `<summary>`** bằng tiếng Việt giải thích rõ tác dụng.

## III. Cơ Sở Dữ Liệu (Database - EF Core)
- Dùng mô hình **Code-First**. Database schema do C# Code quyết định.
- Mỗi khi thêm/sửa bảng, phải chạy lệnh `Add-Migration "Tên_Migration_Rõ_Ràng"`.
- Không được vào trực tiếp Database (PgAdmin, SSMS) để sửa cấu trúc bảng.

## IV. Quản Lý Phiên Bản (Git & Commits)
- Mọi message của Git commit phải tuân theo chuẩn Conventional Commits và viết bằng tiếng Việt:
  - `feat: [Mô tả tính năng mới]`
  - `fix: [Mô tả lỗi đã sửa]`
  - `docs: [Cập nhật tài liệu]`
  - `refactor: [Tái cấu trúc code]`
  - `chore: [Cập nhật thư viện, cấu hình]`
