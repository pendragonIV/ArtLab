using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ArtLab.Backend.Data;
using ArtLab.Backend.Services;

namespace ArtLab.Backend.Controllers
{
    [ApiController]
    [Route("api/admin/vdocipher")]
    [Authorize(Roles = "Admin")]
    public class VdoCipherAdminController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly VdoCipherService _vdoCipher;

        public VdoCipherAdminController(AppDbContext context, VdoCipherService vdoCipher)
        {
            _context = context;
            _vdoCipher = vdoCipher;
        }

        // POST /api/admin/vdocipher/lessons/{lessonId}/upload
        [HttpPost("lessons/{lessonId}/upload")]
        [RequestSizeLimit(2_000_000_000)] // 2 GB
        public async Task<IActionResult> UploadVideo(int lessonId, IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded");

            var lesson = await _context.Lessons
                .FirstOrDefaultAsync(l => l.Id == lessonId);

            if (lesson == null) return NotFound("Lesson not found");

            // Xoá video cũ trên VdoCipher nếu có
            if (!string.IsNullOrEmpty(lesson.VdoCipherVideoId))
            {
                try { await _vdoCipher.DeleteVideoAsync(lesson.VdoCipherVideoId); }
                catch { /* ignore if already deleted */ }
            }

            // Upload video lên VdoCipher
            await using var stream = file.OpenReadStream();
            var videoId = await _vdoCipher.UploadVideoAsync(lesson.Title, stream, file.FileName);

            // Lưu VdoCipherVideoId vào DB
            lesson.VdoCipherVideoId = videoId;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Video uploaded to VdoCipher. Encoding in progress.",
                videoId
            });
        }

        // DELETE /api/admin/vdocipher/lessons/{lessonId}/video
        [HttpDelete("lessons/{lessonId}/video")]
        public async Task<IActionResult> DeleteVideo(int lessonId)
        {
            var lesson = await _context.Lessons.FindAsync(lessonId);
            if (lesson == null) return NotFound();

            if (!string.IsNullOrEmpty(lesson.VdoCipherVideoId))
            {
                await _vdoCipher.DeleteVideoAsync(lesson.VdoCipherVideoId);
                lesson.VdoCipherVideoId = null;
                await _context.SaveChangesAsync();
            }

            return Ok(new { message = "Video deleted from VdoCipher" });
        }
    }
}
