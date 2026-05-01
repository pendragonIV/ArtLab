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


        
        /// <summary>VdoCipher video ID</summary>
        public string? VdoCipherVideoId { get; set; }
        
        public int OrderIndex { get; set; }

        public int ChapterId { get; set; }
        [ForeignKey("ChapterId")]
        public Chapter? Chapter { get; set; }
    }
}
