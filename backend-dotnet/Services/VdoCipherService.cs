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
            
            // Add tất cả các thông số signature
            bool hasSuccessActionStatus = false;
            foreach (var prop in payload.EnumerateObject())
            {
                if (prop.Name != "uploadLink")
                {
                    if (prop.Name == "success_action_status") hasSuccessActionStatus = true;
                    
                    var content = new StringContent(prop.Value.ToString());
                    content.Headers.ContentType = null; // S3 rejects requests if text/plain is sent
                    formData.Add(content, prop.Name);
                }
            }
            
            if (!hasSuccessActionStatus)
            {
                var content = new StringContent("201");
                content.Headers.ContentType = null;
                formData.Add(content, "success_action_status");
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

            return videoId;
        }

        public async Task<(string otp, string playbackInfo)> GetPlaybackInfoAsync(string videoId)
        {
            var request = new HttpRequestMessage(HttpMethod.Post, $"https://dev.vdocipher.com/api/videos/{videoId}/otp");
            request.Headers.Add("Authorization", $"Apisecret {_apiKey}");
            var jsonBody = "{\"ttl\": 7200}";
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
    }
}
