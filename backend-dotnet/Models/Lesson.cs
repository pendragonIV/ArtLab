using System.ComponentModel.DataAnnotations.Schema;

namespace ArtLab.Backend.Models
{
    public class Lesson
    {
        public int Id { get; set; }
        
        public required string Title { get; set; }
        
        public int DurationMinutes { get; set; }
        
        public bool IsFreePreview { get; set; } = false;
        
        public string? VideoUrl { get; set; }

        /// <summary>Bunny Stream video GUID — khi set sẽ dùng Bunny player thay vì VideoUrl</summary>
        public string? BunnyVideoId { get; set; }
        
        public int OrderIndex { get; set; }

        public int ChapterId { get; set; }
        [ForeignKey("ChapterId")]
        public Chapter? Chapter { get; set; }
    }
}
