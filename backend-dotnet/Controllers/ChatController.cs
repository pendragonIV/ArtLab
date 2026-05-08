using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ArtLab.Backend.Data;
using ArtLab.Backend.Models;

namespace ArtLab.Backend.Controllers
{
    [ApiController]
    [Route("api/chat")]
    public class ChatController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ChatController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/chat/lesson/{lessonId}  — public, không cần auth
        [HttpGet("lesson/{lessonId}")]
        public async Task<IActionResult> GetLessonChats(int lessonId)
        {
            var chats = await _context.LessonChats
                .Where(c => c.LessonId == lessonId)
                .Include(c => c.User)
                .OrderBy(c => c.VideoTimestamp)
                .ThenBy(c => c.CreatedAt)
                .Select(c => new
                {
                    c.Id,
                    c.UserId,
                    Username = c.User!.Username,
                    AvatarUrl = c.User.AvatarUrl,
                    c.VideoTimestamp,
                    c.Content,
                    c.CreatedAt
                })
                .ToListAsync();

            return Ok(chats);
        }

        public class SendChatDto
        {
            public int VideoTimestamp { get; set; }
            public required string Content { get; set; }
        }

        // POST: api/chat/lesson/{lessonId}  — yêu cầu JWT
        [HttpPost("lesson/{lessonId}")]
        [Authorize]
        public async Task<IActionResult> SendChat(int lessonId, [FromBody] SendChatDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Content))
                return BadRequest(new { message = "Nội dung không được để trống." });

            if (dto.Content.Length > 300)
                return BadRequest(new { message = "Nội dung tối đa 300 ký tự." });

            if (dto.VideoTimestamp < 0)
                return BadRequest(new { message = "Timestamp không hợp lệ." });

            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            // Kiểm tra bài học tồn tại
            var lesson = await _context.Lessons.FindAsync(lessonId);
            if (lesson == null) return NotFound(new { message = "Bài học không tồn tại." });

            var chat = new LessonChat
            {
                LessonId = lessonId,
                UserId = userId,
                VideoTimestamp = dto.VideoTimestamp,
                Content = dto.Content.Trim()
            };

            _context.LessonChats.Add(chat);
            await _context.SaveChangesAsync();

            // Lấy lại với thông tin user để trả về
            var user = await _context.Users.FindAsync(userId);
            return Ok(new
            {
                chat.Id,
                chat.UserId,
                Username = user!.Username,
                AvatarUrl = user.AvatarUrl,
                chat.VideoTimestamp,
                chat.Content,
                chat.CreatedAt
            });
        }

        // DELETE: api/chat/{chatId}  — chỉ xoá chat của chính mình hoặc Admin
        [HttpDelete("{chatId}")]
        [Authorize]
        public async Task<IActionResult> DeleteChat(int chatId)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var role = User.FindFirst(ClaimTypes.Role)?.Value;

            var chat = await _context.LessonChats.FindAsync(chatId);
            if (chat == null) return NotFound();

            if (chat.UserId != userId && role != "Admin")
                return Forbid();

            _context.LessonChats.Remove(chat);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xoá chat." });
        }
    }
}
