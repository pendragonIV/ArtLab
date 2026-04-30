using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ArtLab.Backend.Data;
using ArtLab.Backend.Models;

namespace ArtLab.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CoursesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CoursesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/courses
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Course>>> GetCourses([FromQuery] string? category)
        {
            // For now, if the DB is empty, let's seed some dummy data automatically just to show it works
            if (!await _context.Courses.AnyAsync())
            {
                _context.Courses.AddRange(
                    new Course { Title = "Advanced Character Illustration in Photoshop", Author = "Elena Rostova", Category = "Illustration", Price = 89.00m, OriginalPrice = 199.00m, ThumbnailUrl = "https://images.unsplash.com/photo-1541961017774-22349e4a1262?q=80&w=2558&auto=format&fit=crop", IsNew = true },
                    new Course { Title = "Advanced 3D Character Creation in Blender", Author = "Michael Zhang", Category = "3D Art", Price = 99.00m, OriginalPrice = 250.00m, ThumbnailUrl = "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2670&auto=format&fit=crop", IsTrending = true },
                    new Course { Title = "Cinematic Concept Art & Illustration", Author = "Sarah Jenkins", Category = "Concept Art", Price = 65.00m, OriginalPrice = 120.00m, ThumbnailUrl = "https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?q=80&w=2670&auto=format&fit=crop", IsTrending = true }
                );
                await _context.SaveChangesAsync();
            }

            var query = _context.Courses.AsQueryable();

            if (!string.IsNullOrEmpty(category))
            {
                // Normalize the category string to handle spaces/dashes (e.g. "3d-art" matches "3D Art")
                var normalizedCategory = category.ToLower().Replace("-", " ");
                query = query.Where(c => c.Category.ToLower() == normalizedCategory);
            }

            return await query.ToListAsync();
        }

        // GET: api/courses/search?q={query}
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<Course>>> SearchCourses([FromQuery] string q)
        {
            if (string.IsNullOrWhiteSpace(q))
            {
                return Ok(new List<Course>());
            }

            var query = q.ToLower();

            var courses = await _context.Courses
                .Where(c => c.Title.ToLower().Contains(query) || c.Author.ToLower().Contains(query))
                .Take(5) 
                .ToListAsync();

            return Ok(courses);
        }

        // GET: api/courses/classcuts
        [HttpGet("classcuts")]
        public async Task<ActionResult<IEnumerable<Course>>> GetClasscutCourses()
        {
            var courses = await _context.Courses
                .Where(c => c.IsClasscutEnabled)
                .Include(c => c.Chapters.OrderBy(ch => ch.OrderIndex))
                    .ThenInclude(ch => ch.Lessons)
                .ToListAsync();

            return Ok(courses);
        }

        // GET: api/courses/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Course>> GetCourse(int id)
        {
            var course = await _context.Courses
                .Include(c => c.Chapters.OrderBy(ch => ch.OrderIndex))
                    .ThenInclude(ch => ch.Lessons.OrderBy(l => l.OrderIndex))
                .FirstOrDefaultAsync(c => c.Id == id);

            if (course == null)
            {
                return NotFound();
            }

            return course;
        }

        // POST: api/courses/seed-curriculum
        [HttpPost("seed-curriculum")]
        public async Task<IActionResult> SeedCurriculum()
        {
            var courses = await _context.Courses.Include(c => c.Chapters).ToListAsync();
            int addedCount = 0;

            foreach (var course in courses)
            {
                if (!course.Chapters.Any())
                {
                    course.Chapters.Add(new Chapter 
                    { 
                        Title = "Introduction & Basics", 
                        OrderIndex = 1,
                        Lessons = new List<Lesson>
                        {
                            new Lesson { Title = "Welcome to the Course", DurationMinutes = 5, IsFreePreview = true, OrderIndex = 1 },
                            new Lesson { Title = "Tools & Software Setup", DurationMinutes = 12, IsFreePreview = true, OrderIndex = 2 },
                            new Lesson { Title = "Basic Concepts", DurationMinutes = 20, OrderIndex = 3 }
                        }
                    });

                    course.Chapters.Add(new Chapter 
                    { 
                        Title = "Core Techniques", 
                        OrderIndex = 2,
                        Lessons = new List<Lesson>
                        {
                            new Lesson { Title = "Understanding Lighting", DurationMinutes = 35, OrderIndex = 1 },
                            new Lesson { Title = "Color Theory Application", DurationMinutes = 42, OrderIndex = 2 },
                            new Lesson { Title = "Composition Rules", DurationMinutes = 28, OrderIndex = 3 }
                        }
                    });

                    course.Chapters.Add(new Chapter 
                    { 
                        Title = "Advanced Projects", 
                        OrderIndex = 3,
                        Lessons = new List<Lesson>
                        {
                            new Lesson { Title = "Project 1: Sketching", DurationMinutes = 45, OrderIndex = 1 },
                            new Lesson { Title = "Project 1: Final Render", DurationMinutes = 55, OrderIndex = 2 }
                        }
                    });

                    addedCount++;
                }
            }

            if (addedCount > 0)
            {
                await _context.SaveChangesAsync();
            }

            return Ok(new { message = $"Seeded curriculum for {addedCount} courses." });
        }
    }
}
