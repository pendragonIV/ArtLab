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
    /// API upload video lên Bunny.net — chỉ Admin
    /// </summary>
    [ApiController]
    [Route("api/admin/bunny")]
    [Authorize(Roles = "Admin")]
    public class BunnyAdminController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly BunnyStreamService _bunny;

        public BunnyAdminController(AppDbContext context, BunnyStreamService bunny)
        {
            _context = context;
            _bunny = bunny;
        }

        // POST /api/admin/bunny/lessons/{lessonId}/upload
        // Form-data: file (video)
        [HttpPost("lessons/{lessonId}/upload")]
        [RequestSizeLimit(2_000_000_000)] // 2 GB
        public async Task<IActionResult> UploadVideo(int lessonId, IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded");

            var lesson = await _context.Lessons
                .Include(l => l.Chapter)
                .FirstOrDefaultAsync(l => l.Id == lessonId);

            if (lesson == null) return NotFound("Lesson not found");

            // Xoá video cũ trên Bunny nếu có
            if (!string.IsNullOrEmpty(lesson.BunnyVideoId))
            {
                try { await _bunny.DeleteVideoAsync(lesson.BunnyVideoId); }
                catch { /* ignore if already deleted */ }
            }

            // 1. Tạo video slot
            var videoId = await _bunny.CreateVideoAsync(lesson.Title);

            // 2. Upload file (stream, không buffer toàn bộ)
            await using var stream = file.OpenReadStream();
            await _bunny.UploadVideoAsync(videoId, stream, file.ContentType);

            // 3. Lưu BunnyVideoId vào DB
            lesson.BunnyVideoId = videoId;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Video uploaded to Bunny.net. Encoding in progress.",
                videoId,
                embedUrl = _bunny.GetEmbedUrl(videoId)
            });
        }

        // GET /api/admin/bunny/lessons/{lessonId}/status
        [HttpGet("lessons/{lessonId}/status")]
        public async Task<IActionResult> GetVideoStatus(int lessonId)
        {
            var lesson = await _context.Lessons.FindAsync(lessonId);
            if (lesson == null) return NotFound();

            if (string.IsNullOrEmpty(lesson.BunnyVideoId))
                return Ok(new { hasVideo = false });

            var info = await _bunny.GetVideoInfoAsync(lesson.BunnyVideoId);
            return Ok(new
            {
                hasVideo = true,
                info.VideoId,
                info.Title,
                info.StatusLabel,
                info.IsReady,
                info.ThumbnailUrl,
                info.Duration,
                info.EmbedUrl
            });
        }

        // DELETE /api/admin/bunny/lessons/{lessonId}/video
        [HttpDelete("lessons/{lessonId}/video")]
        public async Task<IActionResult> DeleteVideo(int lessonId)
        {
            var lesson = await _context.Lessons.FindAsync(lessonId);
            if (lesson == null) return NotFound();

            if (!string.IsNullOrEmpty(lesson.BunnyVideoId))
            {
                await _bunny.DeleteVideoAsync(lesson.BunnyVideoId);
                lesson.BunnyVideoId = null;
                await _context.SaveChangesAsync();
            }

            return Ok(new { message = "Video deleted" });
        }

        // GET /api/admin/bunny/library
        [HttpGet("library")]
        public IActionResult GetLibraryInfo()
        {
            return Ok(new
            {
                libraryId = _bunny.GetLibraryId(),
                cdnHostname = _bunny.GetCdnHostname()
            });
        }
    }
}
