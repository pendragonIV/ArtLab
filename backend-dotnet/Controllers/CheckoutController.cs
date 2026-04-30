using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ArtLab.Backend.Data;
using ArtLab.Backend.Models;

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

        [HttpPost]
        public async Task<IActionResult> ProcessCheckout()
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
                    Status = "Completed" // Assuming payment is successful instantly for this demo
                };
                
                _context.Orders.Add(order);
                await _context.SaveChangesAsync(); // Get Order Id

                // 4. Create OrderItems & Enrollments
                foreach (var item in cartItems)
                {
                    var orderItem = new OrderItem
                    {
                        OrderId = order.Id,
                        CourseId = item.CourseId,
                        PriceAtPurchase = item.Course!.Price
                    };
                    _context.OrderItems.Add(orderItem);

                    // Check if already enrolled to prevent duplicate key issues conceptually
                    var alreadyEnrolled = await _context.Enrollments
                        .AnyAsync(e => e.UserId == userId && e.CourseId == item.CourseId);
                    
                    if (!alreadyEnrolled)
                    {
                        var enrollment = new Enrollment
                        {
                            UserId = userId,
                            CourseId = item.CourseId
                        };
                        _context.Enrollments.Add(enrollment);
                    }
                }

                // 5. Clear Cart
                _context.CartItems.RemoveRange(cartItems);

                // Commit all changes
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { message = "Checkout successful", orderId = order.Id });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, "An error occurred during checkout. Please try again.");
            }
        }
    }
}
