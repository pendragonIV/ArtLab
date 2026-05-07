# Lessons + Learn (course learning experience)

## 1) Mục tiêu
- User xem danh sách bài học theo course và mở bài học cụ thể.
- Với user đã mua/enrolled: được xem video (DRM) + nội dung lesson.

## 2) Frontend
- Learn index: `frontend-nextjs/src/app/learn/[courseId]/page.tsx`
- Learn lesson: `frontend-nextjs/src/app/learn/[courseId]/[lessonId]/page.tsx`
- Notes:
  - cần handle trạng thái chưa enrolled (paywall / CTA mua khoá học)
  - loading/error states khi fetch lesson/video OTP

## 3) Backend
- Controller: `backend-dotnet/Controllers/LessonsController.cs`
- Có thể liên quan: enrollment check, trả metadata lesson, videoId/otp (tuỳ thiết kế).

## 4) Video
- DRM player/OTP theo feature `Video` (VdoCipher).

## 5) Test plan (tối thiểu)
- User đã mua: vào lesson được.
- User chưa mua: bị chặn đúng cách (401/403 hoặc response phù hợp).
