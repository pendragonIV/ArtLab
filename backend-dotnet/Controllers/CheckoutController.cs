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

        public CheckoutController(AppDbContext context)
        {
            _context = context;
        }

        private int GetUserId()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdStr, out int userId))
            {
                return userId;
            }
            throw new UnauthorizedAccessException("Invalid user token");
        }

        public class CheckoutRequest
        {
            public string PaymentMethod { get; set; } = "VNPay"; // "VNPay", "MoMo", "BankTransfer"
        }

        [HttpPost]
        public async Task<IActionResult> ProcessCheckout([FromBody] CheckoutRequest request)
        {
            var userId = GetUserId();

            // 1. Get all items in user's cart
            var cartItems = await _context.CartItems
                .Include(c => c.Course)
                .Where(c => c.UserId == userId)
                .ToListAsync();

            if (!cartItems.Any())
            {
                return BadRequest("Your cart is empty");
            }

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // 2. Calculate Total
                decimal totalAmount = cartItems.Sum(c => c.Course!.Price);

                // 3. Create Order
                var order = new Order
                {
                    UserId = userId,
                    TotalAmount = totalAmount,
                    Status = "Pending", // Payment pending
                    PaymentMethod = request.PaymentMethod
                };
                
                _context.Orders.Add(order);
                await _context.SaveChangesAsync(); // Get Order Id

                // 4. Create OrderItems (Don't create Enrollments yet)
                foreach (var item in cartItems)
                {
                    var orderItem = new OrderItem
                    {
                        OrderId = order.Id,
                        CourseId = item.CourseId,
                        PriceAtPurchase = item.Course!.Price
                    };
                    _context.OrderItems.Add(orderItem);
                }

                // 5. Clear Cart
                _context.CartItems.RemoveRange(cartItems);

                // Commit all changes
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // 6. Generate Payment URL based on Payment Method
                string paymentUrl = "";
                
                if (request.PaymentMethod == "VNPay")
                {
                    var config = HttpContext.RequestServices.GetRequiredService<IConfiguration>();
                    var vnpay = new VnPayLibrary();
                    
                    vnpay.AddRequestData("vnp_Version", "2.1.0");
                    vnpay.AddRequestData("vnp_Command", "pay");
                    vnpay.AddRequestData("vnp_TmnCode", config["VNPay:TmnCode"]!);
                    vnpay.AddRequestData("vnp_Amount", (order.TotalAmount * 25000 * 100).ToString("0")); // Amount is in VND * 100
                    vnpay.AddRequestData("vnp_CreateDate", order.CreatedAt.ToString("yyyyMMddHHmmss"));
                    vnpay.AddRequestData("vnp_CurrCode", "VND");
                    vnpay.AddRequestData("vnp_IpAddr", VnPayLibrary.GetIpAddress(HttpContext));
                    vnpay.AddRequestData("vnp_Locale", "vn");
                    vnpay.AddRequestData("vnp_OrderInfo", "Thanh toan don hang " + order.Id);
                    vnpay.AddRequestData("vnp_OrderType", "other");
                    vnpay.AddRequestData("vnp_ReturnUrl", config["VNPay:ReturnUrl"]!);
                    vnpay.AddRequestData("vnp_TxnRef", order.Id.ToString());

                    paymentUrl = vnpay.CreateRequestUrl(config["VNPay:BaseUrl"]!, config["VNPay:HashSecret"]!);
                }
                else if (request.PaymentMethod == "MoMo")
                {
                    // To be implemented
                    paymentUrl = "http://localhost:3000/checkout/payment-return?status=success&orderId=" + order.Id;
                }
                else if (request.PaymentMethod == "BankTransfer")
                {
                    // For manual bank transfer, just return success and let UI show instructions
                    paymentUrl = "http://localhost:3000/checkout/payment-return?status=pending&method=bank&orderId=" + order.Id;
                }

                return Ok(new { message = "Order created", orderId = order.Id, paymentUrl });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, "An error occurred during checkout. Please try again.");
            }
        }
        
        [HttpGet("vnpay-return")]
        [AllowAnonymous]
        public async Task<IActionResult> VnPayReturn()
        {
            var config = HttpContext.RequestServices.GetRequiredService<IConfiguration>();
            var vnpay = new VnPayLibrary();
            
            foreach (var (key, value) in Request.Query)
            {
                if (!string.IsNullOrEmpty(key) && key.StartsWith("vnp_"))
                {
                    vnpay.AddResponseData(key, value.ToString());
                }
            }
            
            var vnp_SecureHash = Request.Query["vnp_SecureHash"].ToString();
            bool checkSignature = vnpay.ValidateSignature(vnp_SecureHash, config["VNPay:HashSecret"]!);
            
            if (!checkSignature)
            {
                return BadRequest(new { message = "Invalid signature" });
            }

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
                
                // Add enrollments
                foreach (var item in order.OrderItems)
                {
                    var alreadyEnrolled = await _context.Enrollments
                        .AnyAsync(e => e.UserId == order.UserId && e.CourseId == item.CourseId);
                    
                    if (!alreadyEnrolled)
                    {
                        _context.Enrollments.Add(new Enrollment
                        {
                            UserId = order.UserId,
                            CourseId = item.CourseId
                        });
                    }
                }
                
                await _context.SaveChangesAsync();
                return Ok(new { message = "Payment successful", orderId });
            }

            return BadRequest(new { message = "Payment failed" });
        }
    }
}
