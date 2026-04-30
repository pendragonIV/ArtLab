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
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/admin/stats
        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var totalUsers = await _context.Users.CountAsync();
            var totalCourses = await _context.Courses.CountAsync();
            var totalSales = await _context.Orders.Where(o => o.Status == "Completed").SumAsync(o => (decimal?)o.TotalAmount) ?? 0;
            var totalOrders = await _context.Orders.CountAsync();

            return Ok(new
            {
                TotalUsers = totalUsers,
                TotalCourses = totalCourses,
                TotalSales = totalSales,
                TotalOrders = totalOrders
            });
        }

        // POST: api/admin/courses
        [HttpPost("courses")]
        public async Task<IActionResult> CreateCourse([FromBody] CourseDto dto)
        {
            var course = new Course
            {
                Title = dto.Title,
                Author = dto.Author,
                Category = dto.Category,
                Price = dto.Price,
                OriginalPrice = dto.OriginalPrice,
                ThumbnailUrl = dto.ThumbnailUrl,
                IsNew = true,
                IsClasscutEnabled = dto.IsClasscutEnabled
            };

            _context.Courses.Add(course);
            await _context.SaveChangesAsync();

            return Ok(course);
        }

        public class CourseDto
        {
            public required string Title { get; set; }
            public required string Author { get; set; }
            public required string Category { get; set; }
            public decimal Price { get; set; }
            public decimal OriginalPrice { get; set; }
            public string? ThumbnailUrl { get; set; }
            public bool IsClasscutEnabled { get; set; }
        }

        // GET: api/admin/users
        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _context.Users
                .Select(u => new { u.Id, Name = u.Username, u.Email, u.Role, u.CreatedAt })
                .ToListAsync();
            return Ok(users);
        }

        // DELETE: api/admin/users/5
        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            // Prevent deleting yourself! (Optional safety net)
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (currentUserId == id.ToString())
            {
                return BadRequest("You cannot delete your own admin account.");
            }

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "User deleted successfully." });
        }
    }
}
