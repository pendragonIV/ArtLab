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
        
        public string Status { get; set; } = "Pending"; // "Pending", "Completed", "Cancelled"
        
        public string? PaymentMethod { get; set; } // "VNPay", "MoMo", "BankTransfer"
        
        public string? PaymentTransactionId { get; set; } // Transaction ID from the payment gateway

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    }
}
