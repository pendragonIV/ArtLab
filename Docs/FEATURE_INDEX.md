# 📚 ArtLab — Feature Index

Tài liệu theo tính năng nằm trong `Docs/Features/<FeatureName>/FEATURE_SPEC.md`.

## Frontend routes (Next.js)
- Home: `frontend-nextjs/src/app/page.tsx`
- Courses: `frontend-nextjs/src/app/course/[id]/page.tsx`
- Learn: `frontend-nextjs/src/app/learn/[courseId]/page.tsx`, `frontend-nextjs/src/app/learn/[courseId]/[lessonId]/page.tsx`
- Cart: `frontend-nextjs/src/app/cart/page.tsx`
- Checkout return: `frontend-nextjs/src/app/checkout/payment-return/page.tsx`
- My courses: `frontend-nextjs/src/app/my-courses/page.tsx`
- Profile: `frontend-nextjs/src/app/profile/page.tsx`
- Series: `frontend-nextjs/src/app/series/page.tsx`, `frontend-nextjs/src/app/series/[id]/page.tsx`
- Events: `frontend-nextjs/src/app/events/page.tsx`, `frontend-nextjs/src/app/events/[slug]/page.tsx`, `frontend-nextjs/src/app/events/earlybirds/page.tsx`
- Shorts: `frontend-nextjs/src/app/shorts/page.tsx`
- Category: `frontend-nextjs/src/app/category/[slug]/page.tsx`
- Instructor: `frontend-nextjs/src/app/instructor/[name]/page.tsx`
- Admin: `frontend-nextjs/src/app/admin/page.tsx`
- Tutor: `frontend-nextjs/src/app/tutor/page.tsx`

## Backend APIs (ASP.NET)
Controllers nằm ở `backend-dotnet/Controllers/*.cs`:
- Auth: `AuthController.cs`
- Courses: `CoursesController.cs`
- Lessons: `LessonsController.cs`
- Cart: `CartController.cs`
- Checkout: `CheckoutController.cs`
- My courses: `MyCoursesController.cs`
- Profile: `ProfileController.cs`
- Admin: `AdminController.cs`
- Series: `SeriesController.cs`
- Instructors: `InstructorsController.cs`
- Tutor: `TutorController.cs`
- Video DRM (VdoCipher): `VdoCipherAdminController.cs`

## Kiến thức chung (OTT / DRM)
- Bảo vệ nội dung stream (Netflix-class, ảnh, giới hạn): `Docs/CONTENT_PROTECTION_OTT.md`

## Feature specs
- Auth: `Docs/Features/Auth/FEATURE_SPEC.md`
- Courses: `Docs/Features/Courses/FEATURE_SPEC.md`
- Lessons/Learn: `Docs/Features/Lessons/FEATURE_SPEC.md`
- Cart: `Docs/Features/Cart/FEATURE_SPEC.md`
- Checkout/Payments: `Docs/Features/Checkout/FEATURE_SPEC.md`
- Video DRM (VdoCipher): `Docs/Features/Video/FEATURE_SPEC.md`
- Profile: `Docs/Features/Profile/FEATURE_SPEC.md`
- Series: `Docs/Features/Series/FEATURE_SPEC.md`
- Events: `Docs/Features/Events/FEATURE_SPEC.md`
- Shorts: `Docs/Features/Shorts/FEATURE_SPEC.md`
- Admin: `Docs/Features/Admin/FEATURE_SPEC.md`
