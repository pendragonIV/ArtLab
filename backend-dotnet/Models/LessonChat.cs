using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ArtLab.Backend.Models
{
    /// <summary>
    /// Chat message gắn với một timestamp cụ thể trong video bài học.
    /// </summary>
    public class LessonChat
    {
        [Key]
        public int Id { get; set; }

        public int LessonId { get; set; }
        [JsonIgnore]
        public Lesson? Lesson { get; set; }

        public int UserId { get; set; }
        [JsonIgnore]
        public User? User { get; set; }

        /// <summary>Thời điểm trong video (giây) khi user gửi chat.</summary>
        public int VideoTimestamp { get; set; }

        [Required]
        [MaxLength(300)]
        public required string Content { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
