using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;
using ArtLab.Backend.Data;
using ArtLab.Backend.Models;

namespace ArtLab.Backend.Controllers
{
    /// <summary>
    /// Manages active video playback sessions.
    /// Enforces "max 1 concurrent device" rule per user per lesson.
    /// </summary>
    [ApiController]
    [Route("api/session")]
    [Authorize]
    public class SessionController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SessionController(AppDbContext context)
        {
            _context = context;
        }

        private int? TryGetUserId()
        {
            var val = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(val, out int id) ? id : null;
        }

        private string GetClientIp()
        {
            return HttpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault()
                   ?? HttpContext.Connection.RemoteIpAddress?.ToString()
                   ?? "unknown";
        }

        // POST /api/session/start
        // Called when user starts watching a lesson.
        // Returns 409 Conflict if another active session exists for this user+lesson.
        [HttpPost("start")]
        public async Task<IActionResult> StartSession([FromBody] StartSessionRequest req)
        {
            var userId = TryGetUserId();
            if (!userId.HasValue) return Unauthorized();

            var clientIp = GetClientIp();
            var cutoff = DateTime.UtcNow.AddSeconds(-60); // sessions not pinged in 60s = dead

            // Check for an existing alive session for this user on ANY lesson
            // (one device at a time globally, not just per-lesson)
            var existingSession = await _context.ActiveSessions
                .Where(s => s.UserId == userId.Value && s.LastPingAt >= cutoff)
                .OrderByDescending(s => s.LastPingAt)
                .FirstOrDefaultAsync();

            if (existingSession != null && existingSession.LessonId != req.LessonId)
            {
                // Log the blocked concurrent session event
                _context.SecurityEvents.Add(new SecurityEvent
                {
                    UserId = userId.Value,
                    EventType = "ConcurrentSessionBlocked",
                    LessonId = req.LessonId,
                    ClientIp = clientIp,
                    Detail = JsonSerializer.Serialize(new
                    {
                        blockedBy = new { existingSession.LessonId, existingSession.ClientIp, existingSession.LastPingAt }
                    })
                });
                await _context.SaveChangesAsync();

                return Conflict(new
                {
                    error = "Bạn đang xem trên thiết bị khác. Vui lòng kết thúc phiên đó trước khi xem ở đây.",
                    code = "CONCURRENT_SESSION"
                });
            }

            // Clean up any stale sessions for this user+lesson before creating a new one
            var staleSessions = await _context.ActiveSessions
                .Where(s => s.UserId == userId.Value && s.LessonId == req.LessonId)
                .ToListAsync();
            _context.ActiveSessions.RemoveRange(staleSessions);

            // Create new session
            var sessionToken = Guid.NewGuid().ToString("N");
            var session = new ActiveSession
            {
                UserId = userId.Value,
                LessonId = req.LessonId,
                SessionToken = sessionToken,
                ClientIp = clientIp,
                StartedAt = DateTime.UtcNow,
                LastPingAt = DateTime.UtcNow
            };
            _context.ActiveSessions.Add(session);
            await _context.SaveChangesAsync();

            return Ok(new { sessionToken });
        }

        // POST /api/session/heartbeat
        // Called every 20s by client to keep session alive.
        [HttpPost("heartbeat")]
        public async Task<IActionResult> Heartbeat([FromBody] HeartbeatRequest req)
        {
            var userId = TryGetUserId();
            if (!userId.HasValue) return Unauthorized();

            var session = await _context.ActiveSessions
                .FirstOrDefaultAsync(s => s.SessionToken == req.SessionToken && s.UserId == userId.Value);

            if (session == null) return NotFound(new { error = "Session not found or expired" });

            session.LastPingAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { ok = true });
        }

        // DELETE /api/session/{lessonId}
        // Called on unmount (tab close / navigation away).
        [HttpDelete("{lessonId}")]
        public async Task<IActionResult> EndSession(int lessonId, [FromQuery] string? token)
        {
            var userId = TryGetUserId();
            if (!userId.HasValue) return Unauthorized();

            var query = _context.ActiveSessions
                .Where(s => s.UserId == userId.Value && s.LessonId == lessonId);

            if (!string.IsNullOrEmpty(token))
                query = query.Where(s => s.SessionToken == token);

            var sessions = await query.ToListAsync();
            _context.ActiveSessions.RemoveRange(sessions);
            await _context.SaveChangesAsync();

            return Ok(new { removed = sessions.Count });
        }

        // POST /api/session/security-event
        // Called by SecurityWrapper on client-side when suspicious behavior is detected.
        [AllowAnonymous]
        [HttpPost("security-event")]
        public async Task<IActionResult> LogSecurityEvent([FromBody] SecurityEventRequest req)
        {
            var userId = TryGetUserId();
            var clientIp = GetClientIp();

            // Rate limit: max 5 events per IP per minute to prevent spam
            var oneMinuteAgo = DateTime.UtcNow.AddMinutes(-1);
            var recentCount = await _context.SecurityEvents
                .CountAsync(e => e.ClientIp == clientIp && e.OccurredAt >= oneMinuteAgo);

            if (recentCount >= 5) return Ok(new { ok = true }); // silently ignore

            var allowed = new[] { "DevToolsOpened", "SuspiciousActivity" };
            if (!allowed.Contains(req.EventType)) return BadRequest();

            _context.SecurityEvents.Add(new SecurityEvent
            {
                UserId = userId,
                EventType = req.EventType,
                LessonId = req.LessonId,
                ClientIp = clientIp,
                Detail = req.Detail
            });
            await _context.SaveChangesAsync();

            return Ok(new { ok = true });
        }
    }

    public record StartSessionRequest(int LessonId);
    public record HeartbeatRequest(string SessionToken);
    public record SecurityEventRequest(string EventType, int? LessonId, string? Detail);
}
