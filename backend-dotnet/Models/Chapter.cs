using System.ComponentModel.DataAnnotations.Schema;

namespace ArtLab.Backend.Models
{
    public class Chapter
    {
        public int Id { get; set; }
        
        public required string Title { get; set; }
        
        public int OrderIndex { get; set; }
        
        public decimal Price { get; set; } = 0; // Price for this chapter if Classcut is enabled

        public int CourseId { get; set; }
        [ForeignKey("CourseId")]
        public Course? Course { get; set; }

        public ICollection<Lesson> Lessons { get; set; } = new List<Lesson>();
    }
}
