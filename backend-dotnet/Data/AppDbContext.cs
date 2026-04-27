using Microsoft.EntityFrameworkCore;
using ArtLab.Backend.Models;

namespace ArtLab.Backend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Course> Courses { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            // Decimal precision configuration
            modelBuilder.Entity<Course>()
                .Property(c => c.Price)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Course>()
                .Property(c => c.OriginalPrice)
                .HasPrecision(18, 2);
        }
    }
}
