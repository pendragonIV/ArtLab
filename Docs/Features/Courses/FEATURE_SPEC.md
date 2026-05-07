# Courses (catalog + course detail)

## 1) Mục tiêu
- Hiển thị danh sách khoá học và trang chi tiết khoá học.
- Cho phép xem curriculum và điều hướng sang học bài (learn).

## 2) Frontend
- Course detail: `frontend-nextjs/src/app/course/[id]/page.tsx`
- Home/featured courses: `frontend-nextjs/src/app/page.tsx`, `frontend-nextjs/src/components/*` (CourseCard, FeaturedCourses, …)
- UX states: loading/empty/error khi fetch course/curriculum.

## 3) Backend
- Controller: `backend-dotnet/Controllers/CoursesController.cs`
- Dữ liệu phục vụ:
  - list courses (public)
  - course detail + lessons list (public hoặc theo rule product)

## 4) Test plan (tối thiểu)
- Load course list.
- Load course detail theo id không tồn tại → 404 (frontend hiển thị not found).
