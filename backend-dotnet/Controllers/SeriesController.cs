using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ArtLab.Backend.Data;
using ArtLab.Backend.Models;

namespace ArtLab.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SeriesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SeriesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/series
        [HttpGet]
        public async Task<IActionResult> GetAllSeries()
        {
            // Auto-seed if empty
            if (!await _context.Series.AnyAsync())
            {
                await SeedSeries();
            }

            var series = await _context.Series
                .Include(s => s.SeriesCourses)
                    .ThenInclude(sc => sc.Course)
                .OrderByDescending(s => s.CreatedAt)
                .Select(s => new
                {
                    s.Id,
                    s.Title,
                    s.Description,
                    s.ThumbnailUrl,
                    s.Price,
                    s.OriginalPrice,
                    CourseCount = s.SeriesCourses.Count,
                    Courses = s.SeriesCourses
                        .OrderBy(sc => sc.OrderIndex)
                        .Select(sc => new {
                            sc.Course!.Id,
                            sc.Course.Title,
                            sc.Course.Author,
                            sc.Course.ThumbnailUrl,
                            sc.Course.Price,
                            sc.Course.Category,
                            sc.OrderIndex
                        })
                })
                .ToListAsync();

            return Ok(series);
        }

        // GET: api/series/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetSeries(int id)
        {
            var series = await _context.Series
                .Include(s => s.SeriesCourses)
                    .ThenInclude(sc => sc.Course)
                        .ThenInclude(c => c!.Chapters)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (series == null) return NotFound();

            return Ok(new
            {
                series.Id,
                series.Title,
                series.Description,
                series.ThumbnailUrl,
                series.Price,
                series.OriginalPrice,
                CourseCount = series.SeriesCourses.Count,
                Courses = series.SeriesCourses
                    .OrderBy(sc => sc.OrderIndex)
                    .Select(sc => new {
                        sc.Course!.Id,
                        sc.Course.Title,
                        sc.Course.Author,
                        sc.Course.ThumbnailUrl,
                        sc.Course.Price,
                        sc.Course.OriginalPrice,
                        sc.Course.Category,
                        ChapterCount = sc.Course.Chapters.Count,
                        sc.OrderIndex
                    })
            });
        }

        private async Task SeedSeries()
        {
            var courses = await _context.Courses.ToListAsync();
            if (!courses.Any()) return;

            var series1 = new Series
            {
                Title = "The Ultimate Digital Art Pipeline",
                Description = "From character concept to final render. Master illustration, 3D modeling, and cinematic concept art in one complete bundle designed for professional artists.",
                ThumbnailUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop",
                Price = 199.00m,
                OriginalPrice = 350.00m,
            };

            _context.Series.Add(series1);
            await _context.SaveChangesAsync();

            // Link all available courses to this series
            for (int i = 0; i < courses.Count; i++)
            {
                _context.SeriesCourses.Add(new SeriesCourse
                {
                    SeriesId = series1.Id,
                    CourseId = courses[i].Id,
                    OrderIndex = i + 1
                });
            }

            if (courses.Count >= 2)
            {
                var series2 = new Series
                {
                    Title = "Concept Art Foundations Bundle",
                    Description = "Build a rock-solid foundation in concept art and illustration. Perfect for beginners wanting a guided learning path to industry-level skills.",
                    ThumbnailUrl = "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200&auto=format&fit=crop",
                    Price = 129.00m,
                    OriginalPrice = 260.00m,
                };

                _context.Series.Add(series2);
                await _context.SaveChangesAsync();

                _context.SeriesCourses.Add(new SeriesCourse { SeriesId = series2.Id, CourseId = courses[0].Id, OrderIndex = 1 });
                _context.SeriesCourses.Add(new SeriesCourse { SeriesId = series2.Id, CourseId = courses[1].Id, OrderIndex = 2 });
            }

            await _context.SaveChangesAsync();
        }
    }
}
