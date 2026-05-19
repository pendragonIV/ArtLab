using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;

namespace ArtLab.Backend.Services
{
    /// <summary>
    /// Service lấy tỉ giá USD/VND theo thời gian thực.
    /// Cache 1 giờ để tránh gọi API quá nhiều.
    /// Có 3 lớp fallback: Frankfurter → ExchangeRate-API → config.
    /// </summary>
    public interface IExchangeRateService
    {
        /// <summary>Trả về tỉ giá USD→VND hiện tại (VD: 25420.0)</summary>
        Task<decimal> GetUsdToVndRateAsync();
    }

    public class ExchangeRateService : IExchangeRateService
    {
        private readonly IMemoryCache _cache;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _config;
        private readonly ILogger<ExchangeRateService> _logger;

        private const string CACHE_KEY = "exchange_rate_usd_vnd";
        private static readonly TimeSpan CACHE_DURATION = TimeSpan.FromHours(1);

        public ExchangeRateService(
            IMemoryCache cache,
            IHttpClientFactory httpClientFactory,
            IConfiguration config,
            ILogger<ExchangeRateService> logger)
        {
            _cache = cache;
            _httpClientFactory = httpClientFactory;
            _config = config;
            _logger = logger;
        }

        public async Task<decimal> GetUsdToVndRateAsync()
        {
            // 1. Trả về từ cache nếu còn hạn
            if (_cache.TryGetValue(CACHE_KEY, out decimal cachedRate) && cachedRate > 0)
            {
                _logger.LogDebug("ExchangeRate: cache hit — {Rate} VND/USD", cachedRate);
                return cachedRate;
            }

            decimal rate = 0;

            // 2. Thử Frankfurter API (primary — miễn phí, không cần key)
            rate = await TryFrankfurterAsync();

            // 3. Fallback: ExchangeRate-API v4 (không cần key)
            if (rate <= 0)
                rate = await TryExchangeRateApiAsync();

            // 4. Fallback cuối: đọc từ config (default 25000)
            if (rate <= 0)
            {
                rate = _config.GetValue<decimal>("VNPay:UsdToVndRate", 25000m);
                _logger.LogWarning("ExchangeRate: tất cả API thất bại, dùng config fallback: {Rate}", rate);
            }

            // Cache kết quả
            _cache.Set(CACHE_KEY, rate, CACHE_DURATION);
            _logger.LogInformation("ExchangeRate: cập nhật tỉ giá USD/VND = {Rate}", rate);

            return rate;
        }

        /// <summary>
        /// Frankfurter — https://api.frankfurter.dev/latest?from=USD&to=VND
        /// Nguồn: European Central Bank, cập nhật hàng ngày.
        /// Không cần API key, hoàn toàn miễn phí.
        /// </summary>
        private async Task<decimal> TryFrankfurterAsync()
        {
            try
            {
                var client = _httpClientFactory.CreateClient("ExchangeRate");
                var res = await client.GetAsync("https://api.frankfurter.dev/latest?from=USD&to=VND");

                if (!res.IsSuccessStatusCode) return 0;

                var json = await res.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(json);

                if (doc.RootElement.TryGetProperty("rates", out var rates) &&
                    rates.TryGetProperty("VND", out var vnd))
                {
                    var rate = vnd.GetDecimal();
                    _logger.LogInformation("ExchangeRate [Frankfurter]: {Rate} VND/USD", rate);
                    return rate;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning("ExchangeRate [Frankfurter] lỗi: {Message}", ex.Message);
            }
            return 0;
        }

        /// <summary>
        /// ExchangeRate-API v4 — https://api.exchangerate-api.com/v4/latest/USD
        /// Không cần key cho v4, cập nhật hàng ngày.
        /// </summary>
        private async Task<decimal> TryExchangeRateApiAsync()
        {
            try
            {
                var client = _httpClientFactory.CreateClient("ExchangeRate");
                var res = await client.GetAsync("https://api.exchangerate-api.com/v4/latest/USD");

                if (!res.IsSuccessStatusCode) return 0;

                var json = await res.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(json);

                if (doc.RootElement.TryGetProperty("rates", out var rates) &&
                    rates.TryGetProperty("VND", out var vnd))
                {
                    var rate = vnd.GetDecimal();
                    _logger.LogInformation("ExchangeRate [ExchangeRate-API]: {Rate} VND/USD", rate);
                    return rate;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning("ExchangeRate [ExchangeRate-API] lỗi: {Message}", ex.Message);
            }
            return 0;
        }
    }
}
