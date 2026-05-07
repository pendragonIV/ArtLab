# Video DRM (VdoCipher)

## 1) Mục tiêu
- Video bài học được bảo vệ DRM (Widevine/FairPlay) qua VdoCipher.
- Frontend chỉ nhận OTP/playbackInfo hợp lệ theo user/session.

## 2) Kiến trúc (tóm tắt)
- Backend lưu `VideoId` (hoặc mapping lesson→video).
- Backend gọi API VdoCipher để tạo OTP khi user được phép xem.
- Frontend dùng OTP để render player (iframe/VdoCipher embed).

## 3) Backend
- Controller liên quan: `backend-dotnet/Controllers/VdoCipherAdminController.cs`
- Service: `backend-dotnet/Services/VdoCipherService.cs` (gọi VdoCipher API)
- Config:
  - `VdoCipherApiKey` trong `appsettings*`/env (không commit key thật)

## 4) Test plan (tối thiểu)
- OTP endpoint chỉ hoạt động khi user có quyền (enrolled/admin).
- Key sai → lỗi rõ, không leak secret.
