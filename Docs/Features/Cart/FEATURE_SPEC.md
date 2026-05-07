# Cart (giỏ hàng)

## 1) Mục tiêu
- User thêm/xoá khoá học khỏi giỏ.
- Checkout lấy toàn bộ cart items để tạo order.

## 2) Frontend
- Route: `frontend-nextjs/src/app/cart/page.tsx`
- UI: danh sách items + tổng tiền + nút checkout.

## 3) Backend
- Controller: `backend-dotnet/Controllers/CartController.cs`
- Trách nhiệm:
  - CRUD cart items theo user (Authorize)
  - Không cho user sửa cart của người khác.

## 4) Data / DB
- Entity: `CartItem` (UserId, CourseId, …)

## 5) Test plan (tối thiểu)
- Add item → cart hiển thị đúng.
- Remove item → cart cập nhật đúng.
- Checkout sau khi tạo order sẽ clear cart.
