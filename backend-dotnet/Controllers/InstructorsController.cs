using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ArtLab.Backend.Data;

namespace ArtLab.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InstructorsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public InstructorsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/instructors — list all unique instructors
        [HttpGet]
        public async Task<IActionResult> GetInstructors()
        {
            var instructors = await _context.Courses
                .GroupBy(c => c.Author)
                .Select(g => new
                {
                    Name = g.Key,
                    CourseCount = g.Count(),
                    Categories = g.Select(c => c.Category).Distinct().ToList(),
                    SampleThumbnail = g.First().ThumbnailUrl
                })
                .OrderByDescending(i => i.CourseCount)
                .ToListAsync();

            return Ok(instructors);
        }

        // GET: api/instructors/{name} — get instructor profile + their courses
        [HttpGet("{name}")]
        public async Task<IActionResult> GetInstructor(string name)
        {
            // Decode URL-encoded name (e.g. "Elena%20Rostova" → "Elena Rostova")
            var decodedName = Uri.UnescapeDataString(name);

            var courses = await _context.Courses
                .Where(c => c.Author.ToLower() == decodedName.ToLower())
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            if (!courses.Any()) return NotFound();

            // Build a simple instructor profile from course data
            var profile = new
            {
                Name = courses.First().Author,
                CourseCount = courses.Count,
                Categories = courses.Select(c => c.Category).Distinct().ToList(),
                TotalStudents = courses.Count * 42, // mock for now
                Courses = courses.Select(c => new {
                    c.Id, c.Title, c.Category, c.Price, c.OriginalPrice,
                    c.ThumbnailUrl, c.IsNew, c.IsTrending
                })
            };

            return Ok(profile);
        }
    }
}
