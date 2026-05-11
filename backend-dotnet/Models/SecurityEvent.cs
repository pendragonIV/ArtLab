namespace ArtLab.Backend.Models
{
    /// <summary>
    /// Log of suspicious/piracy-related security events for admin review.
    /// </summary>
    public class SecurityEvent
    {
        public int Id { get; set; }

        /// <summary>Nullable — events can happen before authentication (e.g. DevTools on public page).</summary>
        public int? UserId { get; set; }
        public User? User { get; set; }

        /// <summary>
        /// Event type:
        /// "DevToolsOpened" — client-side DevTools detection
        /// "ConcurrentSessionBlocked" — second device tried to open same lesson
        /// "OtpRateLimited" — too many OTP requests in short period
        /// "SuspiciousIpChange" — IP changed between lesson requests
        /// </summary>
        public required string EventType { get; set; }

        public string? Detail { get; set; }  // JSON or free-text details
        public string? ClientIp { get; set; }
        public int? LessonId { get; set; }

        public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
    }
}
