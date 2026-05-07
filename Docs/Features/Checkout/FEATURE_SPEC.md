# Checkout (Cart → Order → VNPay return)

## 1) Mục tiêu
- User checkout giỏ hàng, tạo order và nhận payment URL.
- VNPay callback xác nhận thanh toán và cấp enrollment.

## 2) Backend
- Controller: `backend-dotnet/Controllers/CheckoutController.cs`
- `POST /api/checkout` (Authorize)
  - Lấy cart items của user
  - Tạo `Order` (Status: `Pending`) + `OrderItems`
  - Xoá cart
  - Với `PaymentMethod == "VNPay"`: sinh URL VNPay bằng config:
    - `VNPay:TmnCode`, `VNPay:HashSecret`, `VNPay:BaseUrl`, `VNPay:ReturnUrl`
  - Với `MoMo` / `BankTransfer`: hiện đang trả URL return **hardcode** theo localhost (cần chuyển sang config/env)
- `GET /api/checkout/vnpay-return` (AllowAnonymous)
  - Validate signature (`vnp_SecureHash`)
  - Nếu responseCode `00` và order `Pending`:
    - Set `Completed` + `PaymentTransactionId`
    - Tạo `Enrollment` cho từng `OrderItem` nếu chưa tồn tại

## 3) Frontend
- Return page: `frontend-nextjs/src/app/checkout/payment-return/page.tsx`
- Nhiệm vụ:
  - đọc querystring (status/orderId/...) và hiển thị kết quả
  - có thể call backend để verify trạng thái order nếu cần

## 4) Data / DB
- Entities liên quan: `CartItem`, `Order`, `OrderItem`, `Enrollment`
- Transaction: tạo order + items + clear cart dùng DB transaction.

## 5) Test plan (tối thiểu)
- Cart rỗng → 400 “Your cart is empty”
- VNPay signature sai → 400 “Invalid signature”
- Payment OK → order Completed + enrollments được tạo, không tạo trùng enrollment
