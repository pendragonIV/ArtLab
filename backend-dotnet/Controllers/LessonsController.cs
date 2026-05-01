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
        private readonly VdoCipherService _vdoCipher;

        public LessonsController(AppDbContext context, VdoCipherService vdoCipher)
        {
            _context = context;
            _vdoCipher = vdoCipher;
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

            string? vdoCipherOtp = null;
            string? vdoCipherPlaybackInfo = null;
            if (canWatch && !string.IsNullOrEmpty(lesson.VdoCipherVideoId))
            {
                var (otp, playbackInfo) = await _vdoCipher.GetPlaybackInfoAsync(lesson.VdoCipherVideoId);
                vdoCipherOtp = otp;
                vdoCipherPlaybackInfo = playbackInfo;
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
                VideoUrl = canWatch ? (lesson.VideoUrl ?? GetDemoVideoUrl(lesson)) : null,
                VdoCipherVideoId = canWatch ? lesson.VdoCipherVideoId : null,
                VdoCipherOtp = vdoCipherOtp,
                VdoCipherPlaybackInfo = vdoCipherPlaybackInfo,
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
                        l.VdoCipherVideoId,
                        HasVdoCipherVideo = l.VdoCipherVideoId != null && l.VdoCipherVideoId != "",
                        IsLocked = !l.IsFreePreview && !isEnrolled
                    })
                })
                .ToListAsync();

            return Ok(new { IsEnrolled = isEnrolled, Chapters = chapters });
        }

        // POST /api/lessons/{lessonId}/complete  — Mark lesson as watched
        [HttpPost("{lessonId}/complete")]
        [Authorize]
        public IActionResult MarkComplete(int lessonId)
        {
            // For now return success — progress tracking can be added later
            return Ok(new { message = "Lesson marked as complete" });
        }

        private static string GetDemoVideoUrl(Models.Lesson lesson)
        {
            // Rotating sample videos for demo
            var sampleVideos = new[]
            {
                "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
                "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
                "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
                "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4"
            };
            return sampleVideos[lesson.Id % sampleVideos.Length];
        }
    }
}
