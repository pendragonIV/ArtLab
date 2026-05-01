using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ArtLab.Backend.Data;
using ArtLab.Backend.Models;
using ArtLab.Backend.Services;

namespace ArtLab.Backend.Controllers
{
    /// <summary>
    /// Instructor/Tutor course management — tutors can only manage their own courses.
    /// Requires Role = "Instructor" or "Admin".
    /// </summary>
    [ApiController]
    [Route("api/tutor")]
    [Authorize(Roles = "Instructor,Admin")]
    public class TutorController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly VdoCipherService _vdoCipherService;

        public TutorController(AppDbContext context, VdoCipherService vdoCipherService)
        {
            _context = context;
            _vdoCipherService = vdoCipherService;
        }

        // Helper: get current user ID from JWT claims
        private int GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(claim, out var id) ? id : 0;
        }

        // ── GET: api/tutor/courses ─────────────────────────────────────────────
        /// <summary>Returns only courses owned by the current instructor.</summary>
        [HttpGet("courses")]
        public async Task<IActionResult> GetMyCourses()
        {
            var userId = GetUserId();
            var courses = await _context.Courses
                .Where(c => c.InstructorId == userId)
                .Include(c => c.Chapters)
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new
                {
                    c.Id, c.Title, c.Author, c.Category,
                    c.Price, c.OriginalPrice, c.ThumbnailUrl,
                    c.Description, c.IsNew, c.IsTrending,
                    c.IsClasscutEnabled, c.CreatedAt,
                    ChapterCount = c.Chapters.Count,
                    DiscountPct = c.OriginalPrice > 0
                        ? (int)Math.Round((1 - c.Price / c.OriginalPrice) * 100)
                        : 0,
                })
                .ToListAsync();

            return Ok(courses);
        }

        // ── POST: api/tutor/courses ────────────────────────────────────────────
        /// <summary>Create a new course owned by current instructor.</summary>
        [HttpPost("courses")]
        public async Task<IActionResult> CreateCourse([FromBody] TutorCourseDto dto)
        {
            var userId = GetUserId();
            if (userId == 0) return Unauthorized();

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return Unauthorized();

            var course = new Course
            {
                Title           = dto.Title,
                Author          = user.Username,   // auto-fill from current user
                Category        = dto.Category,
                Price           = dto.Price,
                OriginalPrice   = dto.OriginalPrice > 0 ? dto.OriginalPrice : dto.Price,
                ThumbnailUrl    = dto.ThumbnailUrl ?? "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800",
                Description     = dto.Description,
                IsClasscutEnabled = dto.IsClasscutEnabled,
                IsNew           = true,
                InstructorId    = userId,
                Level           = dto.Level ?? "Basic~Advanced",
                AudioLanguage   = dto.AudioLanguage ?? "English",
                SubtitleLanguage = dto.SubtitleLanguage ?? "English",
                IncludesMaterials = dto.IncludesMaterials,
            };

            _context.Courses.Add(course);
            await _context.SaveChangesAsync();

            return Ok(new { course.Id, course.Title, course.Author });
        }

        // ── PUT: api/tutor/courses/{id} ────────────────────────────────────────
        /// <summary>Update a course — only allowed if current user is the owner.</summary>
        [HttpPut("courses/{id}")]
        public async Task<IActionResult> UpdateCourse(int id, [FromBody] TutorCourseDto dto)
        {
            var userId = GetUserId();
            var course = await _context.Courses.FindAsync(id);

            if (course == null) return NotFound();
            // Ownership check (Admin can edit any)
            if (course.InstructorId != userId && !User.IsInRole("Admin"))
                return Forbid();

            course.Title             = dto.Title;
            course.Category          = dto.Category;
            course.Price             = dto.Price;
            course.OriginalPrice     = dto.OriginalPrice > 0 ? dto.OriginalPrice : dto.Price;
            course.ThumbnailUrl      = dto.ThumbnailUrl ?? course.ThumbnailUrl;
            course.Description       = dto.Description ?? course.Description;
            course.IsClasscutEnabled = dto.IsClasscutEnabled;
            course.IsTrending        = dto.IsTrending;
            course.Level             = dto.Level ?? course.Level;
            course.AudioLanguage     = dto.AudioLanguage ?? course.AudioLanguage;
            course.SubtitleLanguage  = dto.SubtitleLanguage ?? course.SubtitleLanguage;
            course.IncludesMaterials = dto.IncludesMaterials;

            await _context.SaveChangesAsync();
            return Ok(new { course.Id, course.Title, message = "Course updated." });
        }

        // ── DELETE: api/tutor/courses/{id} ────────────────────────────────────
        /// <summary>Delete a course — only allowed if current user is the owner.</summary>
        [HttpDelete("courses/{id}")]
        public async Task<IActionResult> DeleteCourse(int id)
        {
            var userId = GetUserId();
            var course = await _context.Courses
                .Include(c => c.Chapters)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (course == null) return NotFound();
            if (course.InstructorId != userId && !User.IsInRole("Admin"))
                return Forbid();

            _context.Courses.Remove(course);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Course '{course.Title}' deleted." });
        }

        // ── GET: api/tutor/stats ───────────────────────────────────────────────
        /// <summary>Quick stats for the tutor dashboard.</summary>
        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var userId = GetUserId();
            var courseIds = await _context.Courses
                .Where(c => c.InstructorId == userId)
                .Select(c => c.Id)
                .ToListAsync();

            var totalCourses = courseIds.Count;
            var totalStudents = await _context.Enrollments
                .Where(e => courseIds.Contains(e.CourseId))
                .Select(e => e.UserId)
                .Distinct()
                .CountAsync();
            var totalRevenue = await _context.OrderItems
                .Where(oi => courseIds.Contains(oi.CourseId))
                .SumAsync(oi => (decimal?)oi.PriceAtPurchase) ?? 0;

            return Ok(new { totalCourses, totalStudents, totalRevenue });
        }

        // ── GET: api/tutor/profile ─────────────────────────────────────────────
        /// <summary>Get current instructor profile details.</summary>
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var userId = GetUserId();
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound();

            return Ok(new { user.Headline, user.Bio, user.YoutubeUrl, user.TwitterUrl, user.PortfolioImagesJson });
        }

        // ── PUT: api/tutor/profile ─────────────────────────────────────────────
        /// <summary>Update current instructor profile details.</summary>
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] TutorProfileDto dto)
        {
            var userId = GetUserId();
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound();

            user.Headline = dto.Headline;
            user.Bio = dto.Bio;
            user.YoutubeUrl = dto.YoutubeUrl;
            user.TwitterUrl = dto.TwitterUrl;
            user.PortfolioImagesJson = dto.PortfolioImagesJson;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Profile updated successfully." });
        }

        // ── POST: api/tutor/courses/{id}/chapters ──────────────────────────────
        /// <summary>Add a chapter to the instructor's course.</summary>
        [HttpPost("courses/{id}/chapters")]
        public async Task<IActionResult> AddChapter(int id, [FromBody] ChapterDto dto)
        {
            var userId = GetUserId();
            var course = await _context.Courses.FindAsync(id);
            if (course == null) return NotFound();
            if (course.InstructorId != userId && !User.IsInRole("Admin")) return Forbid();

            var chapter = new Chapter
            {
                CourseId   = id,
                Title      = dto.Title,
                Price      = dto.Price,
                OrderIndex = dto.SortOrder,
            };
            _context.Chapters.Add(chapter);
            await _context.SaveChangesAsync();
            return Ok(chapter);
        }

        // ── GET: api/tutor/courses/{id}/curriculum ─────────────────────────────
        /// <summary>Get curriculum for a specific course.</summary>
        [HttpGet("courses/{id}/curriculum")]
        public async Task<IActionResult> GetCourseCurriculum(int id)
        {
            var userId = GetUserId();
            var course = await _context.Courses
                .Include(c => c.Chapters)
                .ThenInclude(ch => ch.Lessons.OrderBy(l => l.OrderIndex))
                .FirstOrDefaultAsync(c => c.Id == id);

            if (course == null) return NotFound();
            if (course.InstructorId != userId && !User.IsInRole("Admin")) return Forbid();

            return Ok(course.Chapters.OrderBy(ch => ch.OrderIndex));
        }

        // ── POST: api/tutor/chapters/{chapterId}/lessons ───────────────────────
        [HttpPost("chapters/{chapterId}/lessons")]
        public async Task<IActionResult> AddLesson(int chapterId, [FromBody] LessonDto dto)
        {
            var userId = GetUserId();
            var chapter = await _context.Chapters.Include(ch => ch.Course).FirstOrDefaultAsync(ch => ch.Id == chapterId);
            if (chapter == null) return NotFound("Chapter not found");
            if (chapter.Course.InstructorId != userId && !User.IsInRole("Admin")) return Forbid();

            var lesson = new Lesson
            {
                ChapterId = chapterId,
                Title = dto.Title,
                IsFreePreview = dto.IsFreePreview,
                OrderIndex = dto.OrderIndex,
                DurationMinutes = dto.DurationMinutes,
                VdoCipherVideoId = ""
            };
            _context.Lessons.Add(lesson);
            await _context.SaveChangesAsync();
            return Ok(lesson);
        }

        // ── PUT: api/tutor/lessons/{lessonId} ──────────────────────────────────
        [HttpPut("lessons/{lessonId}")]
        public async Task<IActionResult> UpdateLesson(int lessonId, [FromBody] LessonDto dto)
        {
            var userId = GetUserId();
            var lesson = await _context.Lessons.Include(l => l.Chapter).ThenInclude(c => c.Course).FirstOrDefaultAsync(l => l.Id == lessonId);
            if (lesson == null) return NotFound("Lesson not found");
            if (lesson.Chapter.Course.InstructorId != userId && !User.IsInRole("Admin")) return Forbid();

            lesson.Title = dto.Title;
            lesson.IsFreePreview = dto.IsFreePreview;
            lesson.OrderIndex = dto.OrderIndex;
            lesson.DurationMinutes = dto.DurationMinutes;
            await _context.SaveChangesAsync();
            return Ok(lesson);
        }

        // ── POST: api/tutor/lessons/{lessonId}/upload ──────────────────────────
        [HttpPost("lessons/{lessonId}/upload")]
        public async Task<IActionResult> UploadVideo(int lessonId, IFormFile file)
        {
            var userId = GetUserId();
            var lesson = await _context.Lessons.Include(l => l.Chapter).ThenInclude(c => c.Course).FirstOrDefaultAsync(l => l.Id == lessonId);
            
            if (lesson == null) return NotFound("Lesson not found.");
            if (lesson.Chapter.Course.InstructorId != userId && !User.IsInRole("Admin")) return Forbid();
            if (file == null || file.Length == 0) return BadRequest("No file uploaded.");

            try
            {
                // Delete existing video if any
                if (!string.IsNullOrEmpty(lesson.VdoCipherVideoId))
                {
                    await _vdoCipherService.DeleteVideoAsync(lesson.VdoCipherVideoId);
                }

                using var stream = file.OpenReadStream();
                var videoId = await _vdoCipherService.UploadVideoAsync(lesson.Title, stream, file.FileName);
                
                // Save VdoCipherVideoId
                lesson.VdoCipherVideoId = videoId;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Upload triggered successfully", videoId = videoId });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Upload failed", details = ex.Message });
            }
        }

        // ── DELETE: api/tutor/lessons/{lessonId}/video ─────────────────────────
        [HttpDelete("lessons/{lessonId}/video")]
        public async Task<IActionResult> DeleteVideo(int lessonId)
        {
            var userId = GetUserId();
            var lesson = await _context.Lessons.Include(l => l.Chapter).ThenInclude(c => c.Course).FirstOrDefaultAsync(l => l.Id == lessonId);

            if (lesson == null) return NotFound("Lesson not found.");
            if (lesson.Chapter.Course.InstructorId != userId && !User.IsInRole("Admin")) return Forbid();
            if (string.IsNullOrEmpty(lesson.VdoCipherVideoId)) return BadRequest("No video attached to this lesson.");

            try
            {
                await _vdoCipherService.DeleteVideoAsync(lesson.VdoCipherVideoId);
                lesson.VdoCipherVideoId = string.Empty;
                await _context.SaveChangesAsync();
                return Ok(new { message = "Video deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to delete video", details = ex.Message });
            }
        }

        // ── DTOs ───────────────────────────────────────────────────────────────
        public class TutorCourseDto
        {
            public required string Title { get; set; }
            public required string Category { get; set; }
            public decimal Price { get; set; }
            public decimal OriginalPrice { get; set; }
            public string? ThumbnailUrl { get; set; }
            public string? Description { get; set; }
            public bool IsClasscutEnabled { get; set; }
            public bool IsTrending { get; set; }
            
            public string? Level { get; set; }
            public string? AudioLanguage { get; set; }
            public string? SubtitleLanguage { get; set; }
            public bool IncludesMaterials { get; set; }
        }

        public class ChapterDto
        {
            public required string Title { get; set; }
            public decimal Price { get; set; }
            public int SortOrder { get; set; }
        }

        public class TutorProfileDto
        {
            public string? Headline { get; set; }
            public string? Bio { get; set; }
            public string? YoutubeUrl { get; set; }
            public string? TwitterUrl { get; set; }
            public string? PortfolioImagesJson { get; set; }
        }

        public class LessonDto
        {
            public required string Title { get; set; }
            public bool IsFreePreview { get; set; }
            public int OrderIndex { get; set; }
            public int DurationMinutes { get; set; }
        }
    }
}
