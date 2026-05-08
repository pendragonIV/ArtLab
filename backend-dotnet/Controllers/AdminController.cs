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
    [Authorize(Roles = "Admin,Moderator")]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly VdoCipherService _vdoCipherService;

        public AdminController(AppDbContext context, VdoCipherService vdoCipherService)
        {
            _context = context;
            _vdoCipherService = vdoCipherService;
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
                .Select(u => new { u.Id, Name = u.Username, u.Email, u.Role, u.CreatedAt, u.IsBanned })
                .ToListAsync();
            return Ok(users);
        }

        // PATCH: api/admin/users/5/ban
        [HttpPatch("users/{id}/ban")]
        public async Task<IActionResult> ToggleBanUser(int id, [FromBody] SetBanDto dto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

            if (currentUserId == id.ToString())
                return BadRequest("You cannot ban your own account.");

            if (currentUserRole == "Moderator" && (user.Role == "Admin" || user.Role == "Moderator"))
                return BadRequest("Moderators cannot ban Admins or other Moderators.");

            user.IsBanned = dto.IsBanned;
            await _context.SaveChangesAsync();
            return Ok(new { user.Id, user.Email, user.IsBanned, message = user.IsBanned ? "User banned." : "User unbanned." });
        }

        public class SetBanDto { public bool IsBanned { get; set; } }

        // DELETE: api/admin/users/5
        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

            if (currentUserId == id.ToString())
                return BadRequest("You cannot delete your own account.");

            if (currentUserRole == "Moderator")
                return BadRequest("Moderators are not allowed to delete users.");

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return Ok(new { message = "User deleted successfully." });
        }

        // PATCH: api/admin/users/5/role  — promote/demote user role
        [HttpPatch("users/{id}/role")]
        public async Task<IActionResult> SetUserRole(int id, [FromBody] SetRoleDto dto)
        {
            var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (currentUserRole != "Admin")
                return BadRequest("Only Admins can change user roles.");

            var allowed = new[] { "Student", "Instructor", "Moderator", "Admin" };
            if (!allowed.Contains(dto.Role))
                return BadRequest($"Role must be one of: {string.Join(", ", allowed)}");

            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (currentUserId == id.ToString() && dto.Role != "Admin")
                return BadRequest("Cannot demote your own Admin account.");

            user.Role = dto.Role;
            await _context.SaveChangesAsync();
            return Ok(new { user.Id, user.Email, user.Role, message = $"Role updated to {dto.Role}." });
        }

        // GET: api/admin/courses — all courses with instructor info
        [HttpGet("courses")]
        public async Task<IActionResult> GetAllCourses()
        {
            var courses = await _context.Courses
                .Include(c => c.Instructor)
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new
                {
                    c.Id, c.Title, c.Author, c.Category, c.Price, c.OriginalPrice,
                    c.IsNew, c.IsTrending, c.IsClasscutEnabled, c.CreatedAt,
                    InstructorId   = c.InstructorId,
                    InstructorName = c.Instructor != null ? c.Instructor.Username : "Admin",
                })
                .ToListAsync();
            return Ok(courses);
        }

        // DELETE: api/admin/courses/5 — admin can delete any course (Cascades to VdoCipher)
        [HttpDelete("courses/{id}")]
        public async Task<IActionResult> DeleteCourse(int id)
        {
            var course = await _context.Courses
                .Include(c => c.Chapters)
                .ThenInclude(ch => ch.Lessons)
                .FirstOrDefaultAsync(c => c.Id == id);
                
            if (course == null) return NotFound();

            // Cascade delete videos from VdoCipher
            foreach (var chapter in course.Chapters)
            {
                foreach (var lesson in chapter.Lessons)
                {
                    if (!string.IsNullOrEmpty(lesson.VdoCipherVideoId))
                    {
                        try
                        {
                            await _vdoCipherService.DeleteVideoAsync(lesson.VdoCipherVideoId);
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Failed to delete video {lesson.VdoCipherVideoId} from VdoCipher: {ex.Message}");
                        }
                    }
                }
            }

            _context.Courses.Remove(course);
            await _context.SaveChangesAsync();
            return Ok(new { message = $"Course '{course.Title}' and its videos were deleted successfully." });
        }

        // DELETE: api/admin/tutors/5 — admin can delete tutor (Cascades to Courses and VdoCipher)
        [HttpDelete("tutors/{id}")]
        public async Task<IActionResult> DeleteTutor(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null || user.Role != "Instructor") return NotFound("Tutor not found.");

            var courses = await _context.Courses
                .Include(c => c.Chapters)
                .ThenInclude(ch => ch.Lessons)
                .Where(c => c.Author == user.Username) // Or use InstructorId if that relation is strictly enforced
                .ToListAsync();

            foreach (var course in courses)
            {
                // Cascade delete videos from VdoCipher for this course
                foreach (var chapter in course.Chapters)
                {
                    foreach (var lesson in chapter.Lessons)
                    {
                        if (!string.IsNullOrEmpty(lesson.VdoCipherVideoId))
                        {
                            try
                            {
                                await _vdoCipherService.DeleteVideoAsync(lesson.VdoCipherVideoId);
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine($"Failed to delete video {lesson.VdoCipherVideoId}: {ex.Message}");
                            }
                        }
                    }
                }
                _context.Courses.Remove(course);
            }

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Tutor '{user.Username}', their {courses.Count} courses, and all related videos were deleted." });
        }

        public class SetRoleDto { public required string Role { get; set; } }
    }
}
