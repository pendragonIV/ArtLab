using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ArtLab.Backend.Data;
using ArtLab.Backend.Models;

namespace ArtLab.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public class GoogleSyncRequest
        {
            public required string Email { get; set; }
            public required string Name { get; set; }
            public string? AvatarUrl { get; set; }
            public string? ProviderId { get; set; }
        }

        [HttpPost("google-sync")]
        public async Task<IActionResult> GoogleSync([FromBody] GoogleSyncRequest request)
        {
            // Verify Sync Secret
            var providedSecret = Request.Headers["X-Sync-Secret"].FirstOrDefault();
            var expectedSecret = _configuration["ApiSyncSecret"];

            if (string.IsNullOrEmpty(providedSecret) || providedSecret != expectedSecret)
            {
                return Unauthorized("Invalid Sync Secret");
            }

            if (string.IsNullOrEmpty(request.Email))
            {
                return BadRequest("Email is required");
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null)
            {
                // Create new user from Google profile
                // If this is the very first user in the database, make them an Admin!
                bool isFirstUser = !await _context.Users.AnyAsync();

                user = new User
                {
                    Email = request.Email,
                    Username = request.Name,
                    AvatarUrl = request.AvatarUrl,
                    ProviderId = request.ProviderId,
                    Role = isFirstUser ? "Admin" : "Student"
                };
                
                _context.Users.Add(user);
                await _context.SaveChangesAsync();
            }
            else
            {
                if (user.IsBanned)
                {
                    return Forbid("User account is banned.");
                }

                // Optionally update avatar or name if they changed
                bool updated = false;
                if (user.AvatarUrl != request.AvatarUrl)
                {
                    user.AvatarUrl = request.AvatarUrl;
                    updated = true;
                }
                if (user.ProviderId == null && request.ProviderId != null)
                {
                    user.ProviderId = request.ProviderId;
                    updated = true;
                }

                if (updated)
                {
                    await _context.SaveChangesAsync();
                }
            }

            // Generate JWT Token
            var tokenHandler = new JwtSecurityTokenHandler();
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var key = Encoding.UTF8.GetBytes(jwtSettings["Secret"]!);
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                    new Claim(JwtRegisteredClaimNames.Email, user.Email),
                    new Claim(ClaimTypes.Name, user.Username),
                    new Claim(ClaimTypes.Role, user.Role),
                    new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
                }),
                Expires = DateTime.UtcNow.AddDays(7),
                Issuer = jwtSettings["Issuer"],
                Audience = jwtSettings["Audience"],
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            var jwtString = tokenHandler.WriteToken(token);

            return Ok(new { message = "User synced successfully", userId = user.Id, token = jwtString, role = user.Role });
        }
    }
}
