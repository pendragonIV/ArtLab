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
    public class ProfileController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProfileController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/profile/{userId}  — public, hiển thị thông tin cơ bản (không trả email)
        [HttpGet("{userId:int}")]
        public async Task<IActionResult> GetPublicProfile(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound();

            var enrolledCount = await _context.Enrollments.CountAsync(e => e.UserId == userId);

            return Ok(new
            {
                user.Id,
                user.Username,
                user.AvatarUrl,
                user.Role,
                user.Headline,
                user.Bio,
                user.CreatedAt,
                TotalCourses = enrolledCount
            });
        }

        // GET: api/profile/me  — requires auth
        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetMyProfile()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound();

            // Get enrolled courses
            var enrolledCourses = await _context.Enrollments
                .Where(e => e.UserId == userId)
                .Join(_context.Courses,
                    e => e.CourseId,
                    c => c.Id,
                    (e, c) => new {
                        c.Id, c.Title, c.Author, c.ThumbnailUrl, c.Price,
                        c.Category, EnrolledAt = e.EnrolledAt
                    })
                .OrderByDescending(x => x.EnrolledAt)
                .ToListAsync();

            return Ok(new
            {
                user.Id,
                user.Username,
                user.Email,
                user.AvatarUrl,
                user.Role,
                user.CreatedAt,
                EnrolledCourses = enrolledCourses,
                TotalCourses = enrolledCourses.Count
            });
        }

        // PUT: api/profile/me  — update profile
        [HttpPut("me")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound();

            if (!string.IsNullOrWhiteSpace(dto.Username))
                user.Username = dto.Username;
            if (!string.IsNullOrWhiteSpace(dto.AvatarUrl))
                user.AvatarUrl = dto.AvatarUrl;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Profile updated successfully." });
        }

        public class UpdateProfileDto
        {
            public string? Username { get; set; }
            public string? AvatarUrl { get; set; }
        }

        // DELETE: api/profile/me — delete my account
        [HttpDelete("me")]
        [Authorize]
        public async Task<IActionResult> DeleteMyAccount()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound();

            // Depending on cascade rules, enrollments might be deleted automatically, 
            // but we can be explicit or just rely on EF.
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            
            return Ok(new { message = "Account deleted successfully." });
        }
    }
}
