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
    public class MyCoursesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MyCoursesController(AppDbContext context)
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

        // GET: api/mycourses
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Course>>> GetMyCourses()
        {
            var userId = GetUserId();

            // Fetch courses the user is enrolled in
            var myCourses = await _context.Enrollments
                .Where(e => e.UserId == userId)
                .Include(e => e.Course)
                .Select(e => e.Course)
                .ToListAsync();

            return Ok(myCourses);
        }

        // GET: api/mycourses/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Course>> GetMyCourse(int id)
        {
            var userId = GetUserId();

            // Check enrollment
            var isEnrolled = await _context.Enrollments.AnyAsync(e => e.UserId == userId && e.CourseId == id);
            
            if (!isEnrolled)
            {
                return Forbid("You do not own this course.");
            }

            var course = await _context.Courses
                .Include(c => c.Chapters.OrderBy(ch => ch.OrderIndex))
                    .ThenInclude(ch => ch.Lessons.OrderBy(l => l.OrderIndex))
                .FirstOrDefaultAsync(c => c.Id == id);

            if (course == null)
            {
                return NotFound();
            }

            return Ok(course);
        }
    }
}
