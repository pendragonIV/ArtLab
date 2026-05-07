# Admin

## 1) Mục tiêu
- Trang admin cho thao tác quản trị (tuỳ scope: quản lý course/lesson/user/order/video).

## 2) Frontend
- Route: `frontend-nextjs/src/app/admin/page.tsx`

## 3) Backend
- Controller: `backend-dotnet/Controllers/AdminController.cs`
- Auth/role:
  - Chỉ role `Admin` truy cập được.

## 4) Test plan (tối thiểu)
- User không phải admin → bị chặn (403 hoặc redirect).
- Admin → truy cập được và các action chính hoạt động.
