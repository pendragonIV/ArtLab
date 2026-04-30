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
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public ICollection<Chapter> Chapters { get; set; } = new List<Chapter>();
    }
}
