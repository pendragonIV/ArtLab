using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace ArtLab.Backend.Services
{
    /// <summary>
    /// Wrapper cho Bunny.net Stream API — upload video, lấy thông tin, generate signed URL
    /// </summary>
    public class BunnyStreamService
    {
        private readonly HttpClient _http;
        private readonly IConfiguration _config;
        private readonly string _apiKey;
        private readonly string _libraryId;
        private readonly string _cdnHostname;

        public BunnyStreamService(IConfiguration config, HttpClient http)
        {
            _http = http;
            _config = config;
            var section = config.GetSection("BunnyStream");
            _apiKey = section["ApiKey"] ?? throw new Exception("BunnyStream:ApiKey not configured");
            _libraryId = section["LibraryId"] ?? throw new Exception("BunnyStream:LibraryId not configured");
            _cdnHostname = section["CdnHostname"] ?? throw new Exception("BunnyStream:CdnHostname not configured");

            _http.BaseAddress = new Uri("https://video.bunnycdn.com/");
            _http.DefaultRequestHeaders.Add("AccessKey", _apiKey);
        }

        // ── 1. Tạo video slot trên Bunny (trả về guid) ──────────────────────
        public async Task<string> CreateVideoAsync(string title)
        {
            var body = JsonSerializer.Serialize(new { title });
            var content = new StringContent(body, Encoding.UTF8, "application/json");

            var res = await _http.PostAsync($"library/{_libraryId}/videos", content);
            res.EnsureSuccessStatusCode();

            var json = await res.Content.ReadAsStringAsync();
            var doc = JsonDocument.Parse(json);
            return doc.RootElement.GetProperty("guid").GetString()
                ?? throw new Exception("Bunny did not return a video GUID");
        }

        // ── 2. Upload file lên Bunny (streaming, không load toàn bộ vào RAM) ─
        public async Task UploadVideoAsync(string videoId, Stream fileStream, string contentType = "video/mp4")
        {
            var content = new StreamContent(fileStream);
            content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(contentType);

            var res = await _http.PutAsync($"library/{_libraryId}/videos/{videoId}", content);
            res.EnsureSuccessStatusCode();
        }

        // ── 3. Lấy thông tin video (encoding status, thumbnail URL...) ───────
        public async Task<BunnyVideoInfo> GetVideoInfoAsync(string videoId)
        {
            var res = await _http.GetAsync($"library/{_libraryId}/videos/{videoId}");
            res.EnsureSuccessStatusCode();

            var json = await res.Content.ReadAsStringAsync();
            var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            return new BunnyVideoInfo
            {
                VideoId = videoId,
                Title = root.TryGetProperty("title", out var t) ? t.GetString() ?? "" : "",
                Status = root.TryGetProperty("status", out var s) ? s.GetInt32() : 0,
                // Status: 0=Created, 1=Uploaded, 2=Processing, 3=Transcoding, 4=Finished, 5=Error
                ThumbnailUrl = $"https://{_cdnHostname}/{videoId}/thumbnail.jpg",
                Duration = root.TryGetProperty("length", out var l) ? l.GetInt32() : 0,
                EmbedUrl = GetEmbedUrl(videoId)
            };
        }

        // ── 4. Xoá video khỏi Bunny ──────────────────────────────────────────
        public async Task DeleteVideoAsync(string videoId)
        {
            var res = await _http.DeleteAsync($"library/{_libraryId}/videos/{videoId}");
            res.EnsureSuccessStatusCode();
        }

        /// <summary>
        /// Generate signed embed URL theo đúng format của Bunny Stream Token Authentication.
        /// Hash = SHA256(TokenAuthKey + VideoId + Expires).
        /// TTL = 30 phút (đủ để xem 1 bài học, ngắn đủ để giới hạn cửa sổ nếu URL bị leak).
        /// QUAN TRỌNG: Token này chỉ protect embed page (iframe.mediadelivery.net).
        /// Để chặn Cốc Cốc intercept HLS stream, phải bật "Token Authentication" trên
        /// Bunny CDN Pull Zone trong Dashboard: CDN → Pull Zone → Security → Token Auth.
        /// Ref: https://docs.bunny.net/docs/stream-embed-token-authentication
        /// </summary>
        public string GetEmbedUrl(string videoId, string? userIp = null, int expiresInMinutes = 30)
        {
            var tokenAuthKey = _config["BunnyStream:TokenAuthKey"] ?? "";

            var baseUrl = $"https://iframe.mediadelivery.net/embed/{_libraryId}/{videoId}";
            var queryParams = "?autoplay=false&loop=false&muted=false&preload=true&responsive=true";

            if (!string.IsNullOrEmpty(tokenAuthKey))
            {
                var expiry = DateTimeOffset.UtcNow.AddMinutes(expiresInMinutes).ToUnixTimeSeconds();

                // Bunny chính thức: SHA256(tokenAuthKey + videoId + expiry)
                var hashInput = tokenAuthKey + videoId + expiry.ToString();
                var tokenBytes = SHA256.HashData(Encoding.UTF8.GetBytes(hashInput));
                var token = Convert.ToHexString(tokenBytes).ToLower();

                queryParams += $"&token={token}&expires={expiry}";
            }

            return baseUrl + queryParams;
        }

        public string GetLibraryId() => _libraryId;
        public string GetCdnHostname() => _cdnHostname;
    }

    public class BunnyVideoInfo
    {
        public string VideoId { get; set; } = "";
        public string Title { get; set; } = "";
        public int Status { get; set; }
        public string StatusLabel => Status switch {
            0 => "Created", 1 => "Uploaded", 2 => "Processing",
            3 => "Transcoding", 4 => "Finished", 5 => "Error", _ => "Unknown"
        };
        public bool IsReady => Status == 4;
        public string ThumbnailUrl { get; set; } = "";
        public int Duration { get; set; }
        public string EmbedUrl { get; set; } = "";
    }
}
