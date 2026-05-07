using System;
using System.ComponentModel.DataAnnotations;

namespace ArtLab.Backend.Models
{
    public class Coupon
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string Code { get; set; } = string.Empty;

        public decimal DiscountPercent { get; set; }
        
        public decimal? MaxDiscountAmount { get; set; }

        public int UsageLimit { get; set; } // 0 means unlimited
        
        public int UsedCount { get; set; } = 0;

        public DateTime ExpiryDate { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
