using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ArtLab.Backend.Data;
using ArtLab.Backend.Models;

namespace ArtLab.Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ProgressController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProgressController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/progress/{lessonId}
        [HttpGet("{lessonId}")]
        public async Task<IActionResult> GetProgress(int lessonId)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var progress = await _context.LessonProgresses
                .FirstOrDefaultAsync(p => p.UserId == userId && p.LessonId == lessonId);

            if (progress == null)
            {
                return Ok(new { watchedSeconds = 0, isCompleted = false });
            }

            return Ok(new
            {
                watchedSeconds = progress.WatchedSeconds,
                isCompleted = progress.IsCompleted
            });
        }

        // POST: api/progress/update
        [HttpPost("update")]
        public async Task<IActionResult> UpdateProgress([FromBody] ProgressUpdateRequest request)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var progress = await _context.LessonProgresses
                .FirstOrDefaultAsync(p => p.UserId == userId && p.LessonId == request.LessonId);

            if (progress == null)
            {
                progress = new LessonProgress
                {
                    UserId = userId,
                    LessonId = request.LessonId,
                    WatchedSeconds = request.WatchedSeconds,
                    IsCompleted = request.IsCompleted,
                    LastWatchedAt = DateTime.UtcNow
                };
                _context.LessonProgresses.Add(progress);
            }
            else
            {
                // Only update if new time is further along, or if we want to allow jumping back
                // For a simple resume feature, usually we want to save the latest position regardless,
                // but we shouldn't un-complete a lesson if they rewind.
                progress.WatchedSeconds = request.WatchedSeconds;
                if (request.IsCompleted)
                {
                    progress.IsCompleted = true;
                }
                progress.LastWatchedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return Ok(new { success = true });
        }
    }

    public class ProgressUpdateRequest
    {
        public int LessonId { get; set; }
        public int WatchedSeconds { get; set; }
        public bool IsCompleted { get; set; }
    }
}
