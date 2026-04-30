using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ArtLab.Backend.Data;
using ArtLab.Backend.Services;

namespace ArtLab.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LessonsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly BunnyStreamService _bunny;

        public LessonsController(AppDbContext context, BunnyStreamService bunny)
        {
            _context = context;
            _bunny = bunny;
        }

        private int? TryGetUserId()
        {
            var val = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(val, out int id) ? id : null;
        }

        // GET /api/lessons/{lessonId}
        // Returns lesson data. VideoUrl only exposed if:
        //   - lesson.IsFreePreview = true, OR
        //   - user is enrolled in the parent course
        [HttpGet("{lessonId}")]
        public async Task<IActionResult> GetLesson(int lessonId)
        {
            var lesson = await _context.Lessons
                .Include(l => l.Chapter)
                    .ThenInclude(ch => ch!.Course)
                .FirstOrDefaultAsync(l => l.Id == lessonId);

            if (lesson == null) return NotFound("Lesson not found");

            var courseId = lesson.Chapter!.CourseId;
            bool canWatch = lesson.IsFreePreview;

            if (!canWatch)
            {
                var userId = TryGetUserId();
                if (userId.HasValue)
                {
                    canWatch = await _context.Enrollments
                        .AnyAsync(e => e.UserId == userId.Value && e.CourseId == courseId);
                }
            }

            // Bunny signed embed URL — gắn IP user, hết hạn 2h
            string? bunnyEmbedUrl = null;
            if (canWatch && !string.IsNullOrEmpty(lesson.BunnyVideoId))
            {
                var userIp = HttpContext.Connection.RemoteIpAddress?.ToString();
                bunnyEmbedUrl = _bunny.GetEmbedUrl(lesson.BunnyVideoId, userIp);
            }

            return Ok(new
            {
                lesson.Id,
                lesson.Title,
                lesson.DurationMinutes,
                lesson.IsFreePreview,
                lesson.OrderIndex,
                lesson.ChapterId,
                CourseId = courseId,
                CourseTitle = lesson.Chapter.Course!.Title,
                ChapterTitle = lesson.Chapter.Title,
                // Only expose VideoUrl if user has access
                VideoUrl = canWatch ? (lesson.VideoUrl ?? GetDemoVideoUrl(lesson)) : null,
                BunnyVideoId = canWatch ? lesson.BunnyVideoId : null,
                BunnyEmbedUrl = bunnyEmbedUrl,
                IsLocked = !canWatch
            });
        }

        // GET /api/lessons/course/{courseId}
        // Returns full curriculum with lock status per lesson
        [HttpGet("course/{courseId}")]
        public async Task<IActionResult> GetCourseLessons(int courseId)
        {
            var userId = TryGetUserId();
            bool isEnrolled = false;
            if (userId.HasValue)
            {
                isEnrolled = await _context.Enrollments
                    .AnyAsync(e => e.UserId == userId.Value && e.CourseId == courseId);
            }

            var chapters = await _context.Chapters
                .Include(ch => ch.Lessons.OrderBy(l => l.OrderIndex))
                .Where(ch => ch.CourseId == courseId)
                .OrderBy(ch => ch.OrderIndex)
                .Select(ch => new
                {
                    ch.Id,
                    ch.Title,
                    ch.OrderIndex,
                    Lessons = ch.Lessons.Select(l => new
                    {
                        l.Id,
                        l.Title,
                        l.DurationMinutes,
                        l.IsFreePreview,
                        l.OrderIndex,
                        l.BunnyVideoId,
                        HasBunnyVideo = l.BunnyVideoId != null && l.BunnyVideoId != "",
                        IsLocked = !l.IsFreePreview && !isEnrolled
                    })
                })
                .ToListAsync();

            return Ok(new { IsEnrolled = isEnrolled, Chapters = chapters });
        }

        // POST /api/lessons/{lessonId}/complete  — Mark lesson as watched
        [HttpPost("{lessonId}/complete")]
        [Authorize]
        public async Task<IActionResult> MarkComplete(int lessonId)
        {
            // For now return success — progress tracking can be added later
            return Ok(new { message = "Lesson marked as complete" });
        }

        private static string GetDemoVideoUrl(Models.Lesson lesson)
        {
            // Rotating sample videos for demo (Big Buck Bunny clips)
            var demos = new[]
            {
                "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
                "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
                "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4"
            };
            return demos[lesson.Id % demos.Length];
        }
    }
}
