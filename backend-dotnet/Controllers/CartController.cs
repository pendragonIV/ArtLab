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
    public class CartController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CartController(AppDbContext context)
        {
            _context = context;
        }

        private int GetUserId()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdStr, out int userId)) return userId;
            throw new UnauthorizedAccessException("Invalid user token");
        }

        // GET: api/cart  — returns all cart items (both full-course and chapters)
        [HttpGet]
        public async Task<IActionResult> GetCart()
        {
            var userId = GetUserId();

            var cartItems = await _context.CartItems
                .Where(c => c.UserId == userId)
                .Include(c => c.Course)
                .Include(c => c.Chapter)
                .Select(c => new
                {
                    CartItemId = c.Id,
                    c.CourseId,
                    c.ChapterId,
                    IsChapterPurchase = c.ChapterId != null,
                    Title = c.ChapterId != null
                        ? $"{c.Course!.Title} — Ch. {c.Chapter!.OrderIndex}: {c.Chapter.Title}"
                        : c.Course!.Title,
                    Author    = c.Course!.Author,
                    Price     = c.ChapterId != null ? c.Chapter!.Price : c.Course!.Price,
                    OriginalPrice = c.ChapterId != null ? c.Chapter!.Price : c.Course!.OriginalPrice,
                    ThumbnailUrl  = c.Course!.ThumbnailUrl,
                    CourseName = c.Course!.Title,
                    ChapterTitle = c.Chapter != null ? c.Chapter.Title : null
                })
                .ToListAsync();

            return Ok(cartItems);
        }

        // POST: api/cart/{courseId}  — add full course
        [HttpPost("{courseId}")]
        public async Task<IActionResult> AddCourseToCart(int courseId)
        {
            var userId = GetUserId();

            var courseExists = await _context.Courses.AnyAsync(c => c.Id == courseId);
            if (!courseExists) return NotFound("Course not found");

            var alreadyInCart = await _context.CartItems
                .AnyAsync(c => c.UserId == userId && c.CourseId == courseId && c.ChapterId == null);
            if (alreadyInCart) return BadRequest("Course is already in your cart");

            _context.CartItems.Add(new CartItem { UserId = userId, CourseId = courseId });
            await _context.SaveChangesAsync();
            return Ok(new { message = "Course added to cart" });
        }

        // POST: api/cart/chapter/{chapterId}  — add single chapter (Classcut)
        [HttpPost("chapter/{chapterId}")]
        public async Task<IActionResult> AddChapterToCart(int chapterId)
        {
            var userId = GetUserId();

            var chapter = await _context.Chapters
                .Include(ch => ch.Course)
                .FirstOrDefaultAsync(ch => ch.Id == chapterId);
            if (chapter == null) return NotFound("Chapter not found");

            // Ensure parent course allows Classcut
            if (chapter.Course == null || !chapter.Course.IsClasscutEnabled)
                return BadRequest("This course does not support Classcut purchases.");

            var alreadyInCart = await _context.CartItems
                .AnyAsync(c => c.UserId == userId && c.ChapterId == chapterId);
            if (alreadyInCart) return BadRequest("Chapter is already in your cart");

            _context.CartItems.Add(new CartItem
            {
                UserId = userId,
                CourseId = chapter.CourseId,
                ChapterId = chapterId
            });
            await _context.SaveChangesAsync();
            return Ok(new { message = "Chapter added to cart" });
        }

        // POST: api/cart/chapters  — add multiple chapters at once (Classcut "Add All")
        [HttpPost("chapters")]
        public async Task<IActionResult> AddChaptersToCart([FromBody] List<int> chapterIds)
        {
            var userId = GetUserId();
            int added = 0;

            foreach (var chapterId in chapterIds)
            {
                var chapter = await _context.Chapters
                    .Include(ch => ch.Course)
                    .FirstOrDefaultAsync(ch => ch.Id == chapterId);

                if (chapter == null || chapter.Course == null || !chapter.Course.IsClasscutEnabled)
                    continue;

                var alreadyInCart = await _context.CartItems
                    .AnyAsync(c => c.UserId == userId && c.ChapterId == chapterId);
                if (alreadyInCart) continue;

                _context.CartItems.Add(new CartItem
                {
                    UserId = userId,
                    CourseId = chapter.CourseId,
                    ChapterId = chapterId
                });
                added++;
            }

            if (added > 0) await _context.SaveChangesAsync();
            return Ok(new { message = $"{added} chapter(s) added to cart" });
        }

        // DELETE: api/cart/{cartItemId}  — remove by CartItem ID
        [HttpDelete("{cartItemId}")]
        public async Task<IActionResult> RemoveFromCart(int cartItemId)
        {
            var userId = GetUserId();

            // Support both old (courseId-based) and new (cartItemId-based) removal
            var cartItem = await _context.CartItems
                .FirstOrDefaultAsync(c => c.Id == cartItemId && c.UserId == userId);

            // Fallback: if not found by CartItem.Id, try by CourseId (for old full-course items)
            if (cartItem == null)
            {
                cartItem = await _context.CartItems
                    .FirstOrDefaultAsync(c => c.CourseId == cartItemId && c.UserId == userId && c.ChapterId == null);
            }

            if (cartItem == null) return NotFound("Item not found in your cart");

            _context.CartItems.Remove(cartItem);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Item removed from cart" });
        }
    }
}
