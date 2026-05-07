# Profile (user profile)

## 1) Mục tiêu
- User xem thông tin tài khoản (profile).
- (Tuỳ scope) cập nhật thông tin cơ bản.

## 2) Frontend
- Route: `frontend-nextjs/src/app/profile/page.tsx`

## 3) Backend
- Controller: `backend-dotnet/Controllers/ProfileController.cs`
- Auth: yêu cầu JWT/Authorize.

## 4) Test plan (tối thiểu)
- Chưa đăng nhập → chặn đúng (401 hoặc redirect tuỳ frontend).
- Đăng nhập → xem được profile.
