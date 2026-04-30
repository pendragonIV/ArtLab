using System.ComponentModel.DataAnnotations.Schema;

namespace ArtLab.Backend.Models
{
    public class CartItem
    {
        public int Id { get; set; }

        public int UserId { get; set; }
        [ForeignKey("UserId")]
        public User? User { get; set; }

        public int CourseId { get; set; }
        [ForeignKey("CourseId")]
        public Course? Course { get; set; }

        // Null = full course purchase. Set = Classcut chapter purchase.
        public int? ChapterId { get; set; }
        [ForeignKey("ChapterId")]
        public Chapter? Chapter { get; set; }

        public DateTime AddedAt { get; set; } = DateTime.UtcNow;
    }
}
