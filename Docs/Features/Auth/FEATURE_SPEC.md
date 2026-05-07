# Auth (Google OAuth + next-auth + backend JWT)

## 1) Mục tiêu
- Người dùng đăng nhập bằng Google trên frontend.
- Backend đồng bộ/tạo user và trả về **backend JWT** để gọi API.

## 2) Luồng (tóm tắt)
- Frontend `next-auth` nhận callback từ Google.
- Trong `signIn` callback: frontend gọi backend `POST /api/auth/google-sync` kèm header `X-Sync-Secret`.
- Backend tạo hoặc cập nhật user, sinh JWT có `role`.
- Frontend lưu JWT vào token/session để client có thể gọi backend.

## 3) Frontend
- Route handler: `frontend-nextjs/src/app/api/auth/[...nextauth]/route.ts`
- Env:
  - `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  - `BACKEND_SYNC_SECRET`
  - (khuyến nghị) `BACKEND_BASE_URL`
- Notes:
  - Không hardcode backend URL theo localhost.
  - Không để “temporary bypass role” lọt production.

## 4) Backend
- Controller: `backend-dotnet/Controllers/AuthController.cs`
- Endpoint: `POST /api/auth/google-sync`
  - Header bắt buộc: `X-Sync-Secret` phải khớp `ApiSyncSecret`
  - Body: `email`, `name`, `avatarUrl`, `providerId`
  - Response: `{ userId, token, role }`
- Role:
  - User đầu tiên trong DB được set `Admin`, các user sau mặc định `Student`.
  - Nếu user bị ban → `403 Forbid`.

## 5) Test plan (tối thiểu)
- Dev: login Google thành công → session có backend token.
- Sai `X-Sync-Secret` → `401`.
- User bị ban → `403`.
- Backend JWT có claim role và frontend hiển thị role đúng.
