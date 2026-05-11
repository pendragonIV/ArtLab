using ArtLab.Backend.Data;

namespace ArtLab.Backend.Services
{
    /// <summary>
    /// Background service that purges expired ActiveSessions every 60 seconds.
    /// A session is considered expired if LastPingAt is older than 90 seconds
    /// (giving a 30s grace period beyond the 60s heartbeat timeout).
    /// </summary>
    public class SessionCleanupService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<SessionCleanupService> _logger;

        // Run cleanup every 60 seconds
        private static readonly TimeSpan CleanupInterval = TimeSpan.FromSeconds(60);

        // Sessions are considered dead after 90 seconds without a ping
        private static readonly TimeSpan SessionTimeout = TimeSpan.FromSeconds(90);

        public SessionCleanupService(IServiceScopeFactory scopeFactory, ILogger<SessionCleanupService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("SessionCleanupService started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                await Task.Delay(CleanupInterval, stoppingToken);

                try
                {
                    await CleanupExpiredSessionsAsync(stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    // Normal shutdown
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error during session cleanup.");
                }
            }

            _logger.LogInformation("SessionCleanupService stopped.");
        }

        private async Task CleanupExpiredSessionsAsync(CancellationToken ct)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var expiredBefore = DateTime.UtcNow - SessionTimeout;

            var expired = db.ActiveSessions
                .Where(s => s.LastPingAt < expiredBefore);

            var count = expired.Count();
            if (count > 0)
            {
                db.ActiveSessions.RemoveRange(expired);
                await db.SaveChangesAsync(ct);
                _logger.LogInformation("Cleaned up {Count} expired sessions.", count);
            }
        }
    }
}
