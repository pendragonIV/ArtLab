using System.ComponentModel.DataAnnotations.Schema;

namespace ArtLab.Backend.Models
{
    public class Series
    {
        public int Id { get; set; }
        public required string Title { get; set; }
        public string? Description { get; set; }
        public required string ThumbnailUrl { get; set; }
        public decimal Price { get; set; }
        public decimal OriginalPrice { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Many-to-many: a series contains many courses
        public ICollection<SeriesCourse> SeriesCourses { get; set; } = new List<SeriesCourse>();
    }

    /// <summary>Join table: Series ↔ Course</summary>
    public class SeriesCourse
    {
        public int Id { get; set; }

        public int SeriesId { get; set; }
        [ForeignKey("SeriesId")]
        public Series? Series { get; set; }

        public int CourseId { get; set; }
        [ForeignKey("CourseId")]
        public Course? Course { get; set; }

        public int OrderIndex { get; set; } = 1;
    }
}
