using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json.Serialization;
using ArtLab.Backend.Data;
using ArtLab.Backend.Models;

namespace ArtLab.Backend.Controllers
{
    [ApiController]
    [Route("api/checkout")]
    public class SepPayController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;
        private readonly ILogger<SepPayController> _logger;

        public SepPayController(AppDbContext context, IConfiguration config, ILogger<SepPayController> logger)
        {
            _context = context;
            _config = config;
            _logger = logger;
        }

        private int? TryGetUserId()
        {
            var val = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(val, out int id) ? id : null;
        }

        /// <summary>
        /// POST /api/checkout/qr
        /// Tạo order + trả về QR code URL để user quét thanh toán.
        /// Content chuyển khoản: "ARTLAB{orderId}" — SepPay sẽ match theo field này.
        /// </summary>
        [HttpPost("qr")]
        [Authorize]
        public async Task<IActionResult> CreateQrOrder([FromBody] QrOrderRequest request)
        {
            var userId = TryGetUserId();
            if (userId == null) return Unauthorized();

            var cartItems = await _context.CartItems
                .Include(c => c.Course)
                .Where(c => c.UserId == userId.Value)
                .ToListAsync();

            if (!cartItems.Any())
                return BadRequest(new { message = "Giỏ hàng trống" });

            // Tính tổng tiền
            decimal totalUsd = cartItems.Sum(c => c.Course!.Price);
            var exchangeRate = _config.GetValue<decimal>("VNPay:UsdToVndRate", 25000m);
            long totalVnd = (long)Math.Round(totalUsd * exchangeRate);

            // Áp dụng coupon nếu có
            if (!string.IsNullOrWhiteSpace(request.CouponCode))
            {
                var coupon = await _context.Coupons.FirstOrDefaultAsync(c =>
                    c.Code == request.CouponCode.Trim().ToUpper() && c.IsActive &&
                    c.ExpiryDate >= DateTime.UtcNow &&
                    (c.UsageLimit == 0 || c.UsedCount < c.UsageLimit));

                if (coupon != null)
                {
                    decimal discount = totalUsd * (coupon.DiscountPercent / 100);
                    if (coupon.MaxDiscountAmount.HasValue && discount > coupon.MaxDiscountAmount.Value)
                        discount = coupon.MaxDiscountAmount.Value;
                    totalUsd = Math.Max(0, totalUsd - discount);
                    totalVnd = (long)Math.Round(totalUsd * exchangeRate);
                    coupon.UsedCount++;
                }
            }

            // Tạo Order
            var order = new Order
            {
                UserId = userId.Value,
                TotalAmount = totalUsd,
                Status = "Pending",
                PaymentMethod = "SepPay"
            };
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            // Tạo OrderItems (cart KHÔNG xóa — chỉ xóa sau khi xác nhận)
            foreach (var item in cartItems)
            {
                _context.OrderItems.Add(new OrderItem
                {
                    OrderId = order.Id,
                    CourseId = item.CourseId,
                    PriceAtPurchase = item.Course!.Price
                });
            }
            await _context.SaveChangesAsync();

            // Build VietQR URL
            var bankBin    = _config["SepPay:BankBin"] ?? "970436";         // Mặc định VCB
            var accountNo  = _config["SepPay:AccountNumber"] ?? "";
            var accountName = _config["SepPay:AccountName"] ?? "ARTLAB ACADEMY";
            var transferContent = $"ARTLAB{order.Id}"; // SepPay sẽ match theo field này

            var qrUrl = $"https://img.vietqr.io/image/{bankBin}-{accountNo}-compact2.png" +
                        $"?amount={totalVnd}" +
                        $"&addInfo={Uri.EscapeDataString(transferContent)}" +
                        $"&accountName={Uri.EscapeDataString(accountName)}";

            return Ok(new
            {
                orderId = order.Id,
                totalVnd,
                totalUsd,
                transferContent,
                qrUrl,
                accountNumber = accountNo,
                accountName,
                bankBin,
                message = "Quét QR hoặc chuyển khoản với nội dung bên dưới"
            });
        }

        /// <summary>
        /// GET /api/checkout/status/{orderId}
        /// Frontend polling để kiểm tra trạng thái thanh toán.
        /// </summary>
        [HttpGet("status/{orderId}")]
        [Authorize]
        public async Task<IActionResult> GetOrderStatus(int orderId)
        {
            var userId = TryGetUserId();
            var order = await _context.Orders
                .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId);

            if (order == null) return NotFound();

            return Ok(new
            {
                orderId = order.Id,
                status = order.Status,      // "Pending" | "Completed" | "Cancelled"
                paymentMethod = order.PaymentMethod,
                paid = order.Status == "Completed"
            });
        }

        /// <summary>
        /// POST /api/checkout/sepay-webhook
        /// SepPay gọi endpoint này khi phát hiện giao dịch khớp.
        /// Header: X-Sepay-Key (API secret)
        /// Payload JSON từ SepPay theo chuẩn của họ.
        /// </summary>
        [HttpPost("sepay-webhook")]
        [AllowAnonymous]
        public async Task<IActionResult> SepPayWebhook(
            [FromBody] SepPayWebhookPayload payload,
            [FromHeader(Name = "X-Sepay-Key")] string? secretKey)
        {
            // 1. Xác thực secret key
            var configuredKey = _config["SepPay:ApiSecret"];
            if (string.IsNullOrEmpty(configuredKey) || secretKey != configuredKey)
            {
                _logger.LogWarning("SepPay webhook: invalid or missing secret key");
                return Unauthorized(new { error = "Invalid secret key" });
            }

            // 2. Chỉ xử lý giao dịch tiền VÀO (transferType = "in")
            if (!string.Equals(payload.TransferType, "in", StringComparison.OrdinalIgnoreCase))
            {
                return Ok(new { status = "ignored", reason = "not a credit transaction" });
            }

            _logger.LogInformation("SepPay webhook received: content={Content} amount={Amount}",
                payload.Content, payload.TransferAmount);

            // 3. Parse Order ID từ nội dung chuyển khoản: "ARTLAB{orderId}"
            var content = (payload.Content ?? "").ToUpperInvariant().Trim();
            int? matchedOrderId = null;

            // Tìm pattern "ARTLAB" + số trong nội dung
            var match = System.Text.RegularExpressions.Regex.Match(content, @"ARTLAB(\d+)");
            if (match.Success && int.TryParse(match.Groups[1].Value, out int parsedId))
            {
                matchedOrderId = parsedId;
            }

            if (matchedOrderId == null)
            {
                _logger.LogInformation("SepPay webhook: no matching order in content '{Content}'", content);
                return Ok(new { status = "ignored", reason = "no matching order" });
            }

            // 4. Tìm order
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == matchedOrderId.Value);

            if (order == null)
            {
                _logger.LogWarning("SepPay webhook: order {OrderId} not found", matchedOrderId);
                return Ok(new { status = "ignored", reason = "order not found" });
            }

            // 5. Idempotency — đã xử lý rồi thì bỏ qua
            if (order.Status == "Completed")
            {
                return Ok(new { status = "already_completed", orderId = order.Id });
            }

            // 6. Kiểm tra số tiền khớp (cho phép sai lệch ±1000 VND do làm tròn)
            var exchangeRate = _config.GetValue<decimal>("VNPay:UsdToVndRate", 25000m);
            var expectedVnd = (long)Math.Round(order.TotalAmount * exchangeRate);
            var receivedVnd = (long)(payload.TransferAmount ?? 0);

            if (Math.Abs(receivedVnd - expectedVnd) > 1000)
            {
                _logger.LogWarning(
                    "SepPay webhook: amount mismatch for order {OrderId}. Expected {Expected}, got {Received}",
                    order.Id, expectedVnd, receivedVnd);
                // Vẫn log nhưng KHÔNG từ chối — có thể user trả thừa/thiếu chút
                // Quyết định: nếu trả ≥ 90% là chấp nhận
                if (receivedVnd < expectedVnd * 0.9m)
                    return Ok(new { status = "ignored", reason = "insufficient amount" });
            }

            // 7. Xác nhận thanh toán thành công
            order.Status = "Completed";
            order.PaymentTransactionId = payload.ReferenceCode ?? payload.Id?.ToString();

            // 8. Tạo Enrollments
            foreach (var item in order.OrderItems)
            {
                var alreadyEnrolled = await _context.Enrollments
                    .AnyAsync(e => e.UserId == order.UserId && e.CourseId == item.CourseId);
                if (!alreadyEnrolled)
                    _context.Enrollments.Add(new Enrollment { UserId = order.UserId, CourseId = item.CourseId });
            }

            // 9. Xóa cart
            var cartItems = await _context.CartItems
                .Where(c => c.UserId == order.UserId)
                .ToListAsync();
            _context.CartItems.RemoveRange(cartItems);

            await _context.SaveChangesAsync();

            _logger.LogInformation("SepPay: order {OrderId} completed. User {UserId} enrolled in {Count} courses",
                order.Id, order.UserId, order.OrderItems.Count);

            // SepPay yêu cầu response { "status": 1 } để biết đã nhận thành công
            return Ok(new { status = 1, message = "Payment confirmed", orderId = order.Id });
        }

        // DTO cho QR order request
        public class QrOrderRequest
        {
            public string? CouponCode { get; set; }
        }

        // DTO cho SepPay webhook payload
        public class SepPayWebhookPayload
        {
            [JsonPropertyName("id")]
            public int? Id { get; set; }

            [JsonPropertyName("gateway")]
            public string? Gateway { get; set; }

            [JsonPropertyName("transactionDate")]
            public string? TransactionDate { get; set; }

            [JsonPropertyName("accountNumber")]
            public string? AccountNumber { get; set; }

            [JsonPropertyName("subAccount")]
            public string? SubAccount { get; set; }

            [JsonPropertyName("code")]
            public string? Code { get; set; }

            [JsonPropertyName("content")]
            public string? Content { get; set; }

            [JsonPropertyName("transferType")]
            public string? TransferType { get; set; }

            [JsonPropertyName("transferAmount")]
            public decimal? TransferAmount { get; set; }

            [JsonPropertyName("accumulated")]
            public decimal? Accumulated { get; set; }

            [JsonPropertyName("referenceCode")]
            public string? ReferenceCode { get; set; }

            [JsonPropertyName("description")]
            public string? Description { get; set; }
        }
    }
}
