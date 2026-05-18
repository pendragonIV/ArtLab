using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ArtLab.Backend.Data;
using ArtLab.Backend.Models;
using ArtLab.Backend.Services;

namespace ArtLab.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CheckoutController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;

        public CheckoutController(AppDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        private int GetUserId()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdStr, out int userId)) return userId;
            throw new UnauthorizedAccessException("Invalid user token");
        }

        private string GetFrontendUrl() =>
            (_config["FrontendUrl"] ?? "https://artlab.com.vn").TrimEnd('/');

        public class CheckoutRequest
        {
            public string PaymentMethod { get; set; } = "VNPay"; // "VNPay", "BankTransfer"
            public string? CouponCode { get; set; }
        }

        [HttpPost]
        public async Task<IActionResult> ProcessCheckout([FromBody] CheckoutRequest request)
        {
            var userId = GetUserId();

            // Validate payment method — MoMo removed (not implemented)
            var validMethods = new[] { "VNPay", "BankTransfer" };
            if (!validMethods.Contains(request.PaymentMethod))
                return BadRequest("Invalid payment method. Supported: VNPay, BankTransfer");

            // 1. Get cart items
            var cartItems = await _context.CartItems
                .Include(c => c.Course)
                .Where(c => c.UserId == userId)
                .ToListAsync();

            if (!cartItems.Any())
                return BadRequest("Your cart is empty");

            // 2. Prevent duplicate orders within 10 minutes
            var existingPending = await _context.Orders
                .Where(o => o.UserId == userId && o.Status == "Pending")
                .OrderByDescending(o => o.CreatedAt)
                .FirstOrDefaultAsync();

            if (existingPending != null && (DateTime.UtcNow - existingPending.CreatedAt).TotalMinutes < 10)
            {
                var existingUrl = BuildPaymentUrl(existingPending, request.PaymentMethod);
                return Ok(new { message = "Order already pending", orderId = existingPending.Id, paymentUrl = existingUrl });
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 3. Calculate total
                decimal totalAmount = cartItems.Sum(c => c.Course!.Price);
                Coupon? appliedCoupon = null;

                if (!string.IsNullOrWhiteSpace(request.CouponCode))
                {
                    appliedCoupon = await _context.Coupons.FirstOrDefaultAsync(c =>
                        c.Code == request.CouponCode.Trim().ToUpper() && c.IsActive);

                    if (appliedCoupon != null && appliedCoupon.ExpiryDate >= DateTime.UtcNow &&
                        (appliedCoupon.UsageLimit == 0 || appliedCoupon.UsedCount < appliedCoupon.UsageLimit))
                    {
                        decimal discount = totalAmount * (appliedCoupon.DiscountPercent / 100);
                        if (appliedCoupon.MaxDiscountAmount.HasValue && discount > appliedCoupon.MaxDiscountAmount.Value)
                            discount = appliedCoupon.MaxDiscountAmount.Value;
                        totalAmount = Math.Max(0, totalAmount - discount);
                        appliedCoupon.UsedCount++;
                    }
                }

                // 4. Create Order (Pending) — cart NOT cleared yet
                var order = new Order
                {
                    UserId = userId,
                    TotalAmount = totalAmount,
                    Status = "Pending",
                    PaymentMethod = request.PaymentMethod
                };
                _context.Orders.Add(order);
                await _context.SaveChangesAsync();

                // 5. Create OrderItems
                foreach (var item in cartItems)
                {
                    _context.OrderItems.Add(new OrderItem
                    {
                        OrderId = order.Id,
                        CourseId = item.CourseId,
                        PriceAtPurchase = item.Course!.Price
                    });
                }
                // ✅ Cart is NOT cleared here — only cleared after payment confirmed!

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                var paymentUrl = BuildPaymentUrl(order, request.PaymentMethod);
                return Ok(new { message = "Order created", orderId = order.Id, paymentUrl });
            }
            catch
            {
                await transaction.RollbackAsync();
                return StatusCode(500, "An error occurred during checkout. Please try again.");
            }
        }

        private string BuildPaymentUrl(Order order, string paymentMethod)
        {
            var frontendUrl = GetFrontendUrl();

            if (paymentMethod == "VNPay")
            {
                var vnpay = new VnPayLibrary();
                var exchangeRate = _config.GetValue<decimal>("VNPay:UsdToVndRate", 25000m);

                vnpay.AddRequestData("vnp_Version", "2.1.0");
                vnpay.AddRequestData("vnp_Command", "pay");
                vnpay.AddRequestData("vnp_TmnCode", _config["VNPay:TmnCode"]!);
                vnpay.AddRequestData("vnp_Amount", (order.TotalAmount * exchangeRate * 100).ToString("0"));
                vnpay.AddRequestData("vnp_CreateDate", order.CreatedAt.ToString("yyyyMMddHHmmss"));
                vnpay.AddRequestData("vnp_CurrCode", "VND");
                vnpay.AddRequestData("vnp_IpAddr", VnPayLibrary.GetIpAddress(HttpContext));
                vnpay.AddRequestData("vnp_Locale", "vn");
                vnpay.AddRequestData("vnp_OrderInfo", "Thanh toan don hang " + order.Id);
                vnpay.AddRequestData("vnp_OrderType", "other");
                vnpay.AddRequestData("vnp_ReturnUrl", _config["VNPay:ReturnUrl"]!);
                vnpay.AddRequestData("vnp_TxnRef", order.Id.ToString());

                return vnpay.CreateRequestUrl(_config["VNPay:BaseUrl"]!, _config["VNPay:HashSecret"]!);
            }
            else if (paymentMethod == "BankTransfer")
            {
                return $"{frontendUrl}/checkout/payment-return?status=pending&method=bank&orderId={order.Id}";
            }

            return $"{frontendUrl}/checkout/payment-return?status=failed&orderId={order.Id}";
        }

        [HttpGet("vnpay-return")]
        [AllowAnonymous]
        public async Task<IActionResult> VnPayReturn()
        {
            var vnpay = new VnPayLibrary();
            foreach (var (key, value) in Request.Query)
                if (!string.IsNullOrEmpty(key) && key.StartsWith("vnp_"))
                    vnpay.AddResponseData(key, value.ToString());

            var vnp_SecureHash = Request.Query["vnp_SecureHash"].ToString();
            if (!vnpay.ValidateSignature(vnp_SecureHash, _config["VNPay:HashSecret"]!))
                return BadRequest(new { message = "Invalid signature" });

            var orderId = Convert.ToInt32(vnpay.GetResponseData("vnp_TxnRef"));
            var vnp_ResponseCode = vnpay.GetResponseData("vnp_ResponseCode");
            var vnp_TransactionNo = vnpay.GetResponseData("vnp_TransactionNo");

            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order == null) return NotFound("Order not found");

            if (vnp_ResponseCode == "00" && order.Status == "Pending")
            {
                order.Status = "Completed";
                order.PaymentTransactionId = vnp_TransactionNo;

                // Enroll user in courses
                foreach (var item in order.OrderItems)
                {
                    var alreadyEnrolled = await _context.Enrollments
                        .AnyAsync(e => e.UserId == order.UserId && e.CourseId == item.CourseId);

                    if (!alreadyEnrolled)
                        _context.Enrollments.Add(new Enrollment { UserId = order.UserId, CourseId = item.CourseId });
                }

                // ✅ Clear cart ONLY now, after payment confirmed
                var cartItems = await _context.CartItems.Where(c => c.UserId == order.UserId).ToListAsync();
                _context.CartItems.RemoveRange(cartItems);

                await _context.SaveChangesAsync();
                return Ok(new { message = "Payment successful", orderId });
            }

            return BadRequest(new { message = "Payment failed", responseCode = vnp_ResponseCode });
        }

        /// <summary>Admin xác nhận chuyển khoản ngân hàng thủ công</summary>
        [HttpPost("bank-confirm/{orderId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ConfirmBankTransfer(int orderId)
        {
            var order = await _context.Orders.Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order == null) return NotFound("Order not found");
            if (order.Status != "Pending") return BadRequest("Order is not pending");
            if (order.PaymentMethod != "BankTransfer") return BadRequest("Not a bank transfer order");

            order.Status = "Completed";
            order.PaymentTransactionId = "BANK_MANUAL_" + DateTime.UtcNow.ToString("yyyyMMddHHmmss");

            foreach (var item in order.OrderItems)
            {
                var alreadyEnrolled = await _context.Enrollments
                    .AnyAsync(e => e.UserId == order.UserId && e.CourseId == item.CourseId);
                if (!alreadyEnrolled)
                    _context.Enrollments.Add(new Enrollment { UserId = order.UserId, CourseId = item.CourseId });
            }

            var cartItems = await _context.CartItems.Where(c => c.UserId == order.UserId).ToListAsync();
            _context.CartItems.RemoveRange(cartItems);

            await _context.SaveChangesAsync();
            return Ok(new { message = "Bank transfer confirmed", orderId });
        }
    }
}
