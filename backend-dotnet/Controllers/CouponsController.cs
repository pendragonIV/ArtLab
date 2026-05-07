using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ArtLab.Backend.Data;
using ArtLab.Backend.Models;

namespace ArtLab.Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CouponsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CouponsController(AppDbContext context)
        {
            _context = context;
        }

        // POST: api/coupons/apply
        [HttpPost("apply")]
        public async Task<IActionResult> ApplyCoupon([FromBody] ApplyCouponRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Code))
            {
                return BadRequest(new { message = "Coupon code is required" });
            }

            var code = request.Code.Trim().ToUpper();

            var coupon = await _context.Coupons
                .FirstOrDefaultAsync(c => c.Code == code && c.IsActive);

            if (coupon == null)
            {
                return BadRequest(new { message = "Invalid coupon code" });
            }

            if (coupon.ExpiryDate < DateTime.UtcNow)
            {
                return BadRequest(new { message = "This coupon has expired" });
            }

            if (coupon.UsageLimit > 0 && coupon.UsedCount >= coupon.UsageLimit)
            {
                return BadRequest(new { message = "This coupon has reached its usage limit" });
            }

            return Ok(new
            {
                id = coupon.Id,
                code = coupon.Code,
                discountPercent = coupon.DiscountPercent,
                maxDiscountAmount = coupon.MaxDiscountAmount
            });
        }
    }

    public class ApplyCouponRequest
    {
        public string Code { get; set; } = string.Empty;
    }
}
