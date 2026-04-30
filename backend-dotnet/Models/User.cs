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
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
