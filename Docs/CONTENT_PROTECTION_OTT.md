# Phân tích bảo vệ video và hình ảnh (OTT — Netflix và nền tảng tương tự)

Tài liệu tham chiếu kiến trúc phòng thủ nội dung stream; không thay thế tư vấn pháp lý. Liên quan trực tiếp tính năng video trong ArtLab: [Features/Video/FEATURE_SPEC.md](Features/Video/FEATURE_SPEC.md) (VdoCipher / DRM).

## 1. Phân biệt hai “cuộc tấn công” khác nhau

| Mục tiêu bảo vệ | Công cụ chủ yếu | Mức độ khả thi |
|-----------------|-----------------|----------------|
| **Chặn tải file gốc** (segment `.m4s`/`.ts`, manifest, key rõ) | Mã hóa luồng (AES-128/256), **DRM** (Widevine, FairPlay, PlayReady), license server, token ngắn hạn, TLS | Cao — đây là tiêu chuẩn ngành |
| **Chặn quay màn hình / chụp / share screen** | “Secure media path” (phần cứng + OS + trình phát), đôi khi cờ ứng dụng (Android) | Trung bình–thấp trên desktop; tốt hơn trên mobile **L1**; **không có giải pháp tuyệt đối** |

Nền tảng thường **ưu tiên chặn tái bản dạng file chất lượng cao**; chống “analog hole” (quay TV bằng camera) gần như không thể bằng kỹ thuật thuần túy.

## 2. Netflix và OTT: lớp kỹ thuật điển hình

- **Định dạng thích ứng**: DASH (và tương đương) — nhiều profile bitrate; segment được **mã hóa**; manifest có thể yêu cầu auth.
- **DRM đa nhà cung cấp**: trình duyệt/app dùng **EME** (Encrypted Media Extensions) + **CDM** (Content Decryption Module): **Widevine** (Google/Android/Chrome…), **FairPlay** (Apple), **PlayReady** (Microsoft). Netflix dùng kết hợp tùy nền tảng (ví dụ Edge + PlayReady, Safari + FairPlay, Android TV + Widevine **L1**).
- **License server**: khóa giải mã không nằm “sẵn” trong JS; client xin license theo thiết bị / phiên / policy (thời hạn, độ phân giải tối đa, cho phép offline hay không).
- **Phân cấp thiết bị (ví dụ Widevine)**:
  - **L1**: crypto + giải mã trong môi trường gắn phần cứng (**TEE** / đường dẫn an toàn tới GPU). Nền tảng để **giảm** khả năng ghi lại vùng đệm giải mã trong phần mềm thường và để một số pipeline **hạn chế** capture ở lớp compositor.
  - **L3**: chủ yếu phần mềm — dễ bị tấn công reverse hơn; nhiều dịch vụ **hạ chất lượng** (ví dụ chỉ SD) trên client L3 để giảm giá trị bản sao.
- **HDCP**: bảo vệ **đường ra vật lý** (HDMI/DisplayPort) — chống sao chép tín hiệu sạch sang thiết bị ghi; liên quan TV/projector hơn là “screenshot trong Chrome”.

## 3. Vì sao đôi khi quay màn hình ra màn hình đen?

Trên một số cấu hình (đặc biệt app/mobile **Widevine L1** hoặc stack tương đương), luồng giải mã đi theo **đường được OS/GPU đánh dấu “protected”** — bộ ghi màn hình hoặc layer capture thường chỉ nhận **khung đen** hoặc bị chặn. Hành vi **phụ thuộc** OS, driver, trình phát, và mức DRM.

**Desktop Chrome** thường ở mức bảo vệ thấp hơn (thường L3) so với app native hoặc một số combo Edge/PlayReady — trải nghiệm “chặn capture” **không đồng nhất**.

## 4. Các nền tảng khác (mô hình tương tự hoặc bổ sung)

- **YouTube Premium / Google TV**: Widevine + policy riêng; nội dung “free” thường ít DRM hơn nội dung trả phí / studio.
- **Apple TV+ / iTunes**: **FairPlay** + hệ sinh thái khép kín (Safari, app iOS/macOS).
- **Amazon Prime, Disney+**: multi-DRM, adaptive streaming, giới hạn độ phân giải theo trust level thiết bị.
- **Hội nghị (Zoom/Teams)**: watermark tên, cảnh báo, policy tổ chức; **không** tương đương DRM Hollywood — OS vẫn có thể ghi màn hình tùy quyền.

## 5. Hình ảnh (ảnh tĩnh, poster, thư viện ảnh)

Ảnh **không** có pipeline “secure decode” như video DRM ở quy mô web. Thường gặp:

- **URL có chữ ký / TTL ngắn** — khó hotlink hàng loạt; không chặn người đã tải được một lần.
- **Độ phân giải / chất lượng theo tier** — preview thấp, full size sau auth.
- **Watermark** (hiện hoặc **forensic**) để truy vết sau khi rò rỉ.
- **Robots / ToS / DMCA** — xử lý pháp lý sau sự kiện.

## 6. Giới hạn (quan trọng khi thiết kế sản phẩm)

- **Quay camera hướng vào màn hình**, capture card analog, thiết bị **root/jailbreak / kernel patch**: rủi ro còn lại (“analog hole”).
- **Accessibility & OS**: trade-off bảo mật, quyền riêng tư, khả năng tiếp cận.
- **Máy ảo / driver giả / debug CDM**: tấn công có chủ đích — bảo vệ tăng chi phí, không triệt tiêu.

## 7. Bài học tổng quát

- **Video giá trị cao**: **DRM thương mại** + encoding phù hợp + giới hạn theo thiết bị; **chống quay màn hình 100%** là không thực tế.
- **Ảnh / portfolio**: **watermark**, **quyền truy cập**, **chất lượng theo người dùng**, **theo dõi / gỡ xuống** thay vì chỉ “chặn F12”.

## 8. ArtLab — hiện trạng và thiết kế tùy chọn (DRM tự host)

### 8.1 Hiện trạng (đã chọn hướng vendor)

ArtLab dùng **VdoCipher** để gói Widevine/FairPlay + OTP playback, tránh phải tự vận hành license server và tích hợp CDM sâu. Chi tiết triển khai: [Features/Video/FEATURE_SPEC.md](Features/Video/FEATURE_SPEC.md).

### 8.2 Nếu sau này tự host DRM (ngoài phạm vi phân tích OTT — checklist thiết kế)

Chỉ xem xét khi có yêu cầu rõ (chi phí vận hành, tuân thủ, đội encoder/player):

1. **Packaging**: DASH hoặc HLS với **CENC** / encryption tương thích Widevine + FairPlay + (tuỳ chọn) PlayReady.
2. **Key & license**: key server hoặc dịch vụ license (Google Widevine/FairPlay Streaming/PlayReady) — **không** lộ key trong API công khai; policy theo user/session/bitrate.
3. **Player**: HTML5 **EME** (Shaka Player, video.js + FairPlay plugin, v.v.); kiểm thử Safari (FairPlay), Chrome/Android (Widevine), Edge (PlayReady nếu cần).
4. **Backend ArtLab**: endpoint cấp “quyền xem” + token ngắn hạn nối với license; map `lessonId` → `contentId` DRM.
5. **Giám sát & watermark**: forensic watermark (vendor hoặc SDK) nếu cần truy vết rò rỉ.
6. **Kiểm thử thiết bị**: ma trận L1/L3, desktop vs mobile, offline (nếu bật).

Mục 8.2 là **thiết kế mức checklist**; triển khai thực tế cần RFC riêng, ngân sách, và pháp lý nội dung.

## 9. Mục tiêu “chặn hoàn toàn” quay màn hình, chụp, Discord / Zoom — khả thi thực tế

### 9.1 Kết luận ngắn

- **Không** tồn tại phương án đảm bảo **100%** trên mọi thiết bị, mọi ứng dụng chia sẻ màn hình, và mọi cách ghi (camera hướng vào màn hình, máy quay ngoài, thiết bị root, v.v.). Điều này khớp mục 1, 6 và 7 ở trên.
- Có thể đạt **mức cao nhất khả dụng** theo từng nền tảng: DRM + đường phát được OS đánh dấu protected, cờ chặn screenshot trên một số OS, và **kiểm soát tổ chức** (MDM, kiosk, cấm cài Discord) — đó là giới hạn thực tế.

### 9.2 Video (giảm tối đa capture phần mềm thường)

| Bối cảnh | Phương án mạnh nhất (vẫn không tuyệt đối) | Ghi chú |
|----------|-------------------------------------------|---------|
| **Android app**, thiết bị **Widevine L1** | Phát trong app native + DRM; OS có thể làm **đen** vùng protected khi ghi màn hình (tuỳ OEM/build) | Root / kernel mod có thể phá vỡ |
| **iOS / iPadOS / tvOS** | FairPlay + app hệ sinh thái Apple | Screen Recording vẫn tồn tại ở cấp OS; policy Apple thay đổi theo thời kỳ |
| **Windows** | Nội dung **PlayReady** / đường “protected” khi trình phát + driver/GPU hỗ trợ (ví dụ một số luồng Edge/UWP) | Nhiều app desktop vẫn capture được UI thường; không đồng nhất |
| **macOS** | FairPlay trong Safari / app dùng stack Apple | Tương tự — không cam kết chặn mọi tool |
| **Trình duyệt desktop (Chrome, v.v.)** | Widevine thường **L3** — **không** coi là chặn hoàn toàn capture; có thể thấy đen hoặc không, tuỳ luồng | Netflix-class vẫn ưu tiên **chặn tải file** hơn là chặn mọi recorder |

**Discord / Zoom** khi dùng “Share screen” hoạt động như **một ứng dụng khác** được OS cấp quyền capture buffer màn hình (hoặc cửa sổ). Ứng dụng ArtLab hay trang web **không thể** ra lệnh cho OS “cấm Discord ghi màn hình” — chỉ có **DRM + protected surface** làm vùng video (đôi khi) ra đen hoặc giảm chất lượng trên **một số** stack; UI HTML thường **không** được bảo vệ như vậy.

### 9.3 Chụp màn hình (screenshot)

- **Android**: `FLAG_SECURE` trên `Window` — chặn screenshot / “Recent apps” thumbnail trong **app của bạn**; không bảo vệ camera quay màn hình vật lý; root có thể bypass.
- **iOS**: không có API công khai tương đương mạnh cho mọi view; phụ thuộc loại nội dung (ví dụ một số luồng được system xử lý đặc biệt).
- **Windows / macOS (desktop)**: ứng dụng bên thứ ba **không** có cơ chế chuẩn “cấm Snipping Tool toàn OS” cho cửa sổ web thường.

### 9.4 Discord, Zoom, Teams — “chặn hoàn toàn” từ phía nội dung (ArtLab)?

- **Không khả thi** chỉ bằng code frontend/backend của một LMS: các công cụ này nhận luồng từ **compositor / API capture** của OS.
- Hướng **tổ chức / doanh nghiệp** (gần nhất với “chặn”): **MDM** cấm cài Discord, chính sách Zoom “chặn share khi X”, kiosk lockdown, máy ảo không dùng cho nội dung nhạy cảm, **watermark** (userId + timestamp) để răn đe và truy vết — đó là **giảm rủi ro**, không phải chặn vật lý.

### 9.5 Nếu vẫn cần “gần như tối đa” cho ArtLab

1. **Video bài học**: giữ **DRM** (VdoCipher / Widevine-FairPlay), ưu tiên **app mobile/TV** trên thiết bị **L1** khi nội dung cực kỳ nhạy cảm; trên web desktop chấp nhận rủi ro cao hơn.
2. **Không hứa “chặn Discord”** trong tài liệu sản phẩm — thay bằng **watermark động**, giới hạn độ phân giải trên client không tin cậy, và **điều khoản / xử lý vi phạm**. Watermark overlay (email + id người dùng từ JWT + thời gian) trên trình phát: `frontend-nextjs/src/app/learn/[courseId]/[lessonId]/page.tsx`.
3. **Phiên thi / kiosk**: thiết bị doanh nghiệp kiểm soát, không quyền admin, không cài tool capture — đây là mô hình duy nhất gần với “chặn hoàn toàn” phần mềm thông thường, với chi phí vận hành cao.

Tóm lại: phương án “mạnh nhất” trùng với mục 2–3 của tài liệu (**DRM + hardware trust + protected path**), cộng **kiểm soát thiết bị tổ chức**; **không** có nút bật để một web app chặn hoàn toàn Discord hay Zoom share trên PC cá nhân.

## 10. Heuristic “cửa sổ không đủ rộng = đang mở DevTools” — hiệu quả, lách hệ thống, và share tab

### 10.1 Cơ chế thường gặp (client-only)

- So sánh **`window.outerWidth - window.innerWidth`** và/hoặc **`outerHeight - innerHeight`** với ngưỡng (ví dụ > 160px) để **suy đoán** thanh DevTools đang dock bên phải/dưới.
- Đôi khi kết hợp `window.screen`, `devicePixelRatio`, zoom, hoặc `resize` / `devtoolschange` (không chuẩn hóa rộng) để tăng độ tin cậy giả.

Đây là **heuristic**, không phải API OS “DevTools đang mở”. Một số trường hợp **share tab** (Discord, Meet, v.v.) làm thay đổi kích thước vùng hiển thị / scale / chrome — có thể trùng ngưỡng với “có thêm vùng UI lạ” nên site **tưởng** DevTools và chặn; đó là tương quan **ngẫu nhiên có ích**, không đảm bảo cho mọi flow share.

### 10.2 Các hướng “lách” hệ thống (nhóm — để thiết kế phòng thủ lớp)

| Nhóm | Ý tưởng (mức cao) | Hệ quả cho heuristic cửa sổ |
|------|-------------------|-----------------------------|
| **DevTools không dock** | DevTools tách cửa sổ riêng hoặc dock trái / tab riêng | Chênh `outer−inner` có thể **không** vượt ngưỡng → heuristic **im lặng** |
| **Hai màn hình / cửa sổ trên màn hình phụ** | Browser full-screen một màn; DevTools trên màn kia | Không thay đổi kích thước cửa sổ đang phát video |
| **Zoom / DPI / OS scaling** | Làm méo quan hệ pixel giữa inner/outer và kỳ vọng cứng | **False negative** hoặc **false positive** |
| **Giả lập / tự động hóa** | Điều khiển trình duyệt headless hoặc extension can thiệp layout | Bỏ qua hoặc spoof kích thước |
| **Ghi không qua tab** | **Share màn hình toàn desktop**, camera hướng vào màn hình, máy quay ngoài, capture card | JavaScript **không** nhìn thấy → mọi heuristic tab **vô hiệu** |
| **Nội dung đã giải mã DRM** | Một số pipeline chỉ bảo vệ vùng video; UI HTML vẫn capture được | Chặn “tab” không bằng chặn “pixel trên màn hình” |
| **Trình duyệt / nền tảng khác** | WebView in-app, TV browser, cửa sổ rất nhỏ split-screen hợp pháp | Dễ **false positive** nếu block cứng |

Tóm lại: heuristic kích thước chỉ là **lớp gây ma sát nhẹ** với một kiểu tấn công (devtools dock + inspect trên cùng cửa sổ); **không** thay thế DRM, watermark, hay kiểm soát tổ chức.

### 10.3 Share tab / Discord cụ thể

- **Chỉ share tab** trình duyệt: đôi khi bị ảnh hưởng bởi resize hoặc overlay — heuristic có thể “trúng” hoặc không, tùy trình duyệt và cách Discord crop.
- **Share toàn màn hình hoặc vùng**: thường **không** làm thay đổi `outerWidth` của tab video → heuristic **không** liên quan.
- **Ứng dụng desktop Discord** ghi trực tiếp buffer màn hình: không đi qua policy của trang web.

### 10.4 Khuyến nghị nếu ArtLab cân nhắc thêm lớp này

1. **Ưu tiên “mềm”**: cảnh báo + làm mờ video / tạm dừng phát thay vì đá user vĩnh viễn khỏi phiên — giảm **false positive** (chia đôi màn hình, zoom lớn, cửa sổ hẹp laptop).
2. **Ngoại lệ thiết bị**: `matchMedia` mobile nhỏ, PWA — tránh chặn nhầm học viên hợp pháp.
3. **Không marketing** đây là “chống quay/chụp/share”; mô tả đúng: **hạn chế một số kiểu mở công cụ nhà phát triển trên cùng cửa sổ** (và chỉ khi policy nội bộ cho phép).
4. **Kết hợp** với mục 9: DRM (VdoCipher), watermark (`sub` + email + thời gian), ToS — đây vẫn là trụ chính.

Triển khai mã trong repo (listener `resize`, ngưỡng, UX) chỉ nên làm sau RFC riêng vì **ảnh hưởng trải nghiệm học** và **tuân thủ** (một số thị trường nhạy cảm với “anti-inspection” trên web giáo dục).
