# Series (series listing + detail)

## 1) Mục tiêu
- Hiển thị danh sách series và trang chi tiết series.

## 2) Frontend
- List: `frontend-nextjs/src/app/series/page.tsx`
- Detail: `frontend-nextjs/src/app/series/[id]/page.tsx`

## 3) Backend
- Controller: `backend-dotnet/Controllers/SeriesController.cs`

## 4) Test plan (tối thiểu)
- Load list.
- Load detail theo id không tồn tại → 404.
