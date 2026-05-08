using Microsoft.EntityFrameworkCore;
using ArtLab.Backend.Models;

namespace ArtLab.Backend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Course> Courses { get; set; }
        public DbSet<CartItem> CartItems { get; set; }
        public DbSet<Chapter> Chapters { get; set; }
        public DbSet<Lesson> Lessons { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<Enrollment> Enrollments { get; set; }
        public DbSet<Series> Series { get; set; }
        public DbSet<SeriesCourse> SeriesCourses { get; set; }
        public DbSet<LessonProgress> LessonProgresses { get; set; }
        public DbSet<Coupon> Coupons { get; set; }
        public DbSet<LessonChat> LessonChats { get; set; }

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
