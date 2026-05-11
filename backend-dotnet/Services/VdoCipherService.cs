using System.Text.Json;

namespace ArtLab.Backend.Services
{
    public class VdoCipherService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;

        public VdoCipherService(HttpClient httpClient, IConfiguration config)
        {
            _httpClient = httpClient;
            _apiKey = config.GetValue<string>("VdoCipherApiKey");
        }

        public async Task<string> UploadVideoAsync(string title, Stream fileStream, string fileName)
        {
            // 1. Lấy thông tin chứng chỉ upload từ VdoCipher
            var request = new HttpRequestMessage(HttpMethod.Put, $"https://dev.vdocipher.com/api/videos?title={Uri.EscapeDataString(title)}");
            request.Headers.Add("Authorization", $"Apisecret {_apiKey}");
            
            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                var err = await response.Content.ReadAsStringAsync();
                throw new Exception($"VdoCipher API Error: {response.StatusCode} - {err} (You might have reached your account limit of 4 videos)");
            }
            
            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            var videoId = root.GetProperty("videoId").GetString();
            var payload = root.GetProperty("clientPayload");
            var uploadLink = payload.GetProperty("uploadLink").GetString();

            // 2. Upload file trực tiếp lên Amazon S3 (mà VdoCipher cung cấp qua payload)
            using var formData = new MultipartFormDataContent();
            
            // Track which fields have been added from the payload
            bool hasSuccessActionStatus = false;
            bool hasSuccessActionRedirect = false;

            // Add tất cả các thông số signature từ VdoCipher payload
            foreach (var prop in payload.EnumerateObject())
            {
                if (prop.Name == "uploadLink") continue;

                if (prop.Name == "success_action_status")   hasSuccessActionStatus = true;
                if (prop.Name == "success_action_redirect") hasSuccessActionRedirect = true;

                var content = new StringContent(prop.Value.ToString());
                content.Headers.ContentType = null; // S3 rejects requests if text/plain is sent
                formData.Add(content, prop.Name);
            }

            // S3 policy điều kiện: ["starts-with", "$success_action_status", ""]
            // → BẮT BUỘC phải có field này dù VdoCipher không trả về
            if (!hasSuccessActionStatus)
            {
                var c = new StringContent("201");
                c.Headers.ContentType = null;
                formData.Add(c, "success_action_status");
            }

            // S3 policy điều kiện: ["starts-with", "$success_action_redirect", ""]
            // → BẮT BUỘC phải có field này (giá trị rỗng) để thoả mãn policy
            if (!hasSuccessActionRedirect)
            {
                var c = new StringContent("");
                c.Headers.ContentType = null;
                formData.Add(c, "success_action_redirect");
            }

            // File bắt buộc phải add cuối cùng
            var streamContent = new StreamContent(fileStream);
            formData.Add(streamContent, "file", fileName);
            
            var uploadResponse = await _httpClient.PostAsync(uploadLink, formData);
            if (!uploadResponse.IsSuccessStatusCode)
            {
                var errorContent = await uploadResponse.Content.ReadAsStringAsync();
                throw new Exception($"VdoCipher S3 Upload failed: {uploadResponse.StatusCode} - {errorContent}");
            }

            return videoId!;
        }

        /// <summary>
        /// Lấy credentials để browser upload thẳng lên S3 (không qua backend).
        /// Trả về videoId + toàn bộ clientPayload (uploadLink, policy, signature...).
        /// </summary>
        public async Task<(string videoId, JsonElement clientPayload)> GetUploadCredentialsAsync(string title)
        {
            var request = new HttpRequestMessage(HttpMethod.Put,
                $"https://dev.vdocipher.com/api/videos?title={Uri.EscapeDataString(title)}");
            request.Headers.Add("Authorization", $"Apisecret {_apiKey}");

            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                var err = await response.Content.ReadAsStringAsync();
                throw new Exception($"VdoCipher API Error: {response.StatusCode} - {err}");
            }

            var json = await response.Content.ReadAsStringAsync();
            // Parse vào JsonDocument — caller chịu trách nhiệm dispose
            var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            var videoId = root.GetProperty("videoId").GetString()!;
            var payload = root.GetProperty("clientPayload").Clone(); // Clone để doc có thể dispose
            doc.Dispose();

            return (videoId, payload);
        }

        /// <summary>
        /// Lấy OTP + playbackInfo từ VdoCipher, kèm theo forensic watermark.
        /// Annotation với alpha=0.0 vô hình với mắt thường nhưng tồn tại trong recording.
        /// Hoạt động trên VdoCipher Business plan trở lên.
        /// </summary>
        public async Task<(string otp, string playbackInfo)> GetPlaybackInfoAsync(
            string videoId,
            int? userId = null,
            string? userEmail = null,
            string? clientIp = null)
        {
            var request = new HttpRequestMessage(HttpMethod.Post, $"https://dev.vdocipher.com/api/videos/{videoId}/otp");
            request.Headers.Add("Authorization", $"Apisecret {_apiKey}");

            // Build forensic watermark annotation (invisible, alpha=0.0)
            // Text format: "UID:123|user@example.com|1.2.3.4" — traceable if video is leaked
            string annotateJson = "";
            if (userId.HasValue || !string.IsNullOrEmpty(userEmail))
            {
                var parts = new System.Text.StringBuilder();
                if (userId.HasValue)   parts.Append($"UID:{userId.Value}");
                if (!string.IsNullOrEmpty(userEmail)) parts.Append($"|{userEmail}");
                if (!string.IsNullOrEmpty(clientIp))  parts.Append($"|{clientIp}");

                // Escape for JSON string embedding
                var watermarkText = parts.ToString()
                    .Replace("\\", "\\\\")
                    .Replace("\"", "\\\"");

                // Build annotate JSON using concatenation to avoid C# brace-escaping issues
                // VdoCipher annotate format: JSON array as string value
                var annotateArray = "[{\"type\":\"rtext\",\"text\":\"" + watermarkText
                    + "\",\"alpha\":\"0.00\",\"color\":\"0xFFFFFF\",\"size\":20,\"interval\":8000}]";
                annotateJson = ",\"annotate\":\"" + annotateArray.Replace("\"", "\\\"") + "\"";
            }

            var jsonBody = $"{{\"ttl\": 3600{annotateJson}}}";
            request.Content = new StringContent(jsonBody, System.Text.Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            return (root.GetProperty("otp").GetString()!, root.GetProperty("playbackInfo").GetString()!);
        }

        public async Task DeleteVideoAsync(string videoId)
        {
            var request = new HttpRequestMessage(HttpMethod.Delete, $"https://dev.vdocipher.com/api/videos?videos={videoId}");
            request.Headers.Add("Authorization", $"Apisecret {_apiKey}");
            await _httpClient.SendAsync(request);
        }

        /// <summary>
        /// Lấy thời lượng video (giây) từ VdoCipher.
        /// Trả về 0 nếu video chưa encode xong hoặc API lỗi.
        /// </summary>
        public async Task<int> GetVideoDurationSecondsAsync(string videoId)
        {
            try
            {
                var request = new HttpRequestMessage(HttpMethod.Get, $"https://dev.vdocipher.com/api/videos/{videoId}");
                request.Headers.Add("Authorization", $"Apisecret {_apiKey}");

                var response = await _httpClient.SendAsync(request);
                if (!response.IsSuccessStatusCode) return 0;

                var json = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;

                // VdoCipher trả về duration tính bằng giây (float)
                if (root.TryGetProperty("length", out var lengthProp))
                    return (int)Math.Round(lengthProp.GetDouble());

                return 0;
            }
            catch { return 0; }
        }
    }
}
