namespace ArtLab.Backend.Models
{
    public class User
    {
        public int Id { get; set; }
        public required string Email { get; set; }
        public required string Username { get; set; }
        public string? PasswordHash { get; set; }
        public string? AvatarUrl { get; set; }
        public string? ProviderId { get; set; } // e.g. Google sub/id
        
        // "Student", "Instructor", "Admin"
        public string Role { get; set; } = "Student";
        
        public bool IsBanned { get; set; } = false;
        
        // Instructor Profile Fields
        public string? Headline { get; set; } // e.g., "Senior Concept Artist at Riot Games"
        public string? Bio { get; set; }      // Detailed introduction
        public string? YoutubeUrl { get; set; }
        public string? TwitterUrl { get; set; }
        public string? PortfolioImagesJson { get; set; } // JSON array of image URLs
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
