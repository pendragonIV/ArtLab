# Events (landing + event detail)

## 1) Mục tiêu
- Hiển thị landing các event và chi tiết event theo slug.
- Hỗ trợ trang event đặc biệt (earlybirds).

## 2) Frontend
- List: `frontend-nextjs/src/app/events/page.tsx`
- Earlybirds: `frontend-nextjs/src/app/events/earlybirds/page.tsx`
- Detail: `frontend-nextjs/src/app/events/[slug]/page.tsx`

## 3) Backend
- (Nếu có) endpoint/DB cho event. Nếu event là static content thì mô tả nơi lưu (file/DB) khi xác định.

## 4) Test plan (tối thiểu)
- Truy cập slug hợp lệ và không hợp lệ (404).
