using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ArtLab.Backend.Models
{
    public class LessonProgress
    {
        [Key]
        public int Id { get; set; }

        public int UserId { get; set; }
        [JsonIgnore]
        public User? User { get; set; }

        public int LessonId { get; set; }
        [JsonIgnore]
        public Lesson? Lesson { get; set; }

        public int WatchedSeconds { get; set; }
        public bool IsCompleted { get; set; }

        public DateTime LastWatchedAt { get; set; } = DateTime.UtcNow;
    }
}
