using System.ComponentModel.DataAnnotations.Schema;

namespace ArtLab.Backend.Models
{
    public class Order
    {
        public int Id { get; set; }

        public int UserId { get; set; }
        [ForeignKey("UserId")]
        public User? User { get; set; }

        public decimal TotalAmount { get; set; }
        
        public string Status { get; set; } = "Completed"; // "Pending", "Completed", "Cancelled"

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    }
}
