namespace ArtLab.Backend.Models
{
    /// <summary>
    /// Tracks active video playback sessions per user per lesson.
    /// Used to enforce concurrent session limit (max 1 device at a time).
    /// </summary>
    public class ActiveSession
    {
        public int Id { get; set; }

        public int UserId { get; set; }
        public User? User { get; set; }

        public int LessonId { get; set; }

        /// <summary>Unique token for this session (UUID), sent to frontend, used for heartbeat auth.</summary>
        public required string SessionToken { get; set; }

        /// <summary>IP address of the client who started this session.</summary>
        public string? ClientIp { get; set; }

        public DateTime StartedAt { get; set; } = DateTime.UtcNow;

        /// <summary>Updated every 20s by client heartbeat. Sessions with LastPingAt > 60s ago are considered dead.</summary>
        public DateTime LastPingAt { get; set; } = DateTime.UtcNow;
    }
}
