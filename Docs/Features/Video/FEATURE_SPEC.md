# Video DRM (VdoCipher)

Tham chiếu nền tảng OTT và mô hình bảo vệ (Widevine L1/L3, FairPlay, ảnh): [CONTENT_PROTECTION_OTT.md](../../CONTENT_PROTECTION_OTT.md).

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

## 5) Kỳ vọng thực tế (capture / Discord / Zoom)

- DRM + VdoCipher **giảm** sao chép dạng tải file và tăng ma sát với một số công cụ ghi màn hình (tuỳ thiết bị / trình duyệt / Widevine L1 vs L3).
- **Không** có cam kết kỹ thuật “chặn hoàn toàn” quay màn hình, chụp, hay chia sẻ qua Discord/Zoom trên mọi máy người dùng — xem mục 9 trong [CONTENT_PROTECTION_OTT.md](../../CONTENT_PROTECTION_OTT.md).
- Mitigation bổ sung trong app: watermark overlay trên trình phát tại `frontend-nextjs/src/app/learn/[courseId]/[lessonId]/page.tsx` (email + `sub` JWT + timestamp).
- Heuristic kiểu “chênh `outerWidth`/`innerWidth` = DevTools” hoặc tương tự: xem mục **10** trong [CONTENT_PROTECTION_OTT.md](../../CONTENT_PROTECTION_OTT.md) (lách hệ thống, share tab, khuyến nghị không phụ thuộc một mình heuristic).
