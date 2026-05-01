namespace ArtLab.Backend.Models
{
    public class Course
    {
        public int Id { get; set; }
        public required string Title { get; set; }
        public required string Author { get; set; }
        public required string Category { get; set; }
        public decimal Price { get; set; }
        public decimal OriginalPrice { get; set; }
        public required string ThumbnailUrl { get; set; }
        public string? CoverVideoUrl { get; set; }
        public string? Description { get; set; }
        public bool IsNew { get; set; } = false;
        public bool IsTrending { get; set; } = false;
        public bool IsClasscutEnabled { get; set; } = false;

        // Metadata for Coloso-like UI
        public string? Level { get; set; } = "Basic~Advanced";
        public string? AudioLanguage { get; set; } = "English";
        public string? SubtitleLanguage { get; set; } = "English";
        public bool IncludesMaterials { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Owner (Instructor/Tutor who created this course)
        public int? InstructorId { get; set; }
        public User? Instructor { get; set; }

        public ICollection<Chapter> Chapters { get; set; } = new List<Chapter>();
    }
}
