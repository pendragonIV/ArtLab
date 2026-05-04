# 🎨 ArtLab — Hướng dẫn Cài đặt & Sử dụng

Tài liệu này hướng dẫn toàn bộ quá trình cài đặt và chạy dự án **ArtLab** — nền tảng học tập trực tuyến (E-learning) tích hợp video DRM và hệ thống thanh toán tự động.

---

## 📐 Kiến trúc tổng quan

```
artlab/
├── frontend-nextjs/          # Frontend: Next.js 16 + TypeScript
├── backend-dotnet/           # Backend: ASP.NET Core 9 + EF Core
│   └── docker-compose.yml    # Database: PostgreSQL 15 (Docker)
└── SETUP.md                  # Tài liệu này
```

| Layer       | Công nghệ                           | Port mặc định |
|-------------|--------------------------------------|---------------|
| Frontend    | Next.js 16, React 19, next-auth      | `3000`        |
| Backend     | ASP.NET Core 9, EF Core 9            | `5149`        |
| Database    | PostgreSQL 15 (Docker)               | `5432`        |

---

## ⚙️ Yêu cầu hệ thống

| Phần mềm            | Phiên bản tối thiểu | Ghi chú                              |
|---------------------|---------------------|--------------------------------------|
| **Docker Desktop**  | 4.x trở lên         | Để chạy PostgreSQL                   |
| **Node.js**         | 20 LTS              | Để chạy frontend Next.js             |
| **.NET SDK**        | 9.0                 | Để chạy backend ASP.NET Core         |
| **Git**             | Bất kỳ              | Để clone repository                  |

> **Kiểm tra phiên bản:**
> ```bash
> docker --version
> node --version
> dotnet --version
> ```

---

## 🚀 Bước 1 — Clone Repository

```bash
git clone <your-repo-url>
cd artlab
```

---

## 🐘 Bước 2 — Khởi động Database (Docker)

PostgreSQL được chạy hoàn toàn qua Docker — **không cần cài đặt Postgres thủ công**.

```bash
cd backend-dotnet
docker-compose up -d
```

Lệnh này sẽ tạo container `artlab_postgres` với:

| Thông số     | Giá trị            |
|--------------|--------------------|
| Host         | `localhost`        |
| Port         | `5432`             |
| Database     | `artlab_db`        |
| Username     | `postgres`         |
| Password     | `postgrespassword` |

**Kiểm tra container đang chạy:**
```bash
docker ps
# Kết quả mong muốn: container artlab_postgres đang ở trạng thái "Up"
```

**Xem logs database:**
```bash
docker logs artlab_postgres
```

**Dừng database:**
```bash
docker-compose down
# Giữ nguyên dữ liệu (volume postgres_data được bảo lưu)
```

**Xóa toàn bộ dữ liệu và reset:**
```bash
docker-compose down -v
```

---

## 🔧 Bước 3 — Cài đặt Backend (ASP.NET Core 9)

### 3.1. Cấu hình `appsettings.json`

File cấu hình nằm tại `backend-dotnet/appsettings.json`. Các giá trị mặc định đã khớp với Docker Compose ở trên.

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=artlab_db;Username=postgres;Password=postgrespassword"
  },
  "JwtSettings": {
    "Secret": "ArtLab_Very_Long_Super_Secret_Key_For_JWT_Authentication_2026",
    "Issuer": "http://localhost:5149",
    "Audience": "http://localhost:3000"
  },
  "ApiSyncSecret": "ArtLab_Super_Secret_Sync_Key_2026",
  "VdoCipherApiKey": "<your_vdocipher_api_key>",
  "VNPay": {
    "TmnCode": "<your_vnpay_merchant_code>",
    "HashSecret": "<your_vnpay_hash_secret>",
    "BaseUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    "ReturnUrl": "http://localhost:3000/checkout/payment-return"
  }
}
```

> ⚠️ **Lưu ý bảo mật:** Không commit `appsettings.json` có chứa key thật lên Git. Sử dụng `appsettings.Development.json` hoặc biến môi trường cho môi trường production.

### 3.2. Chạy Migration (tạo schema database)

```bash
cd backend-dotnet

# Restore packages
dotnet restore

# Tạo bảng trong database (lần đầu tiên hoặc sau khi có migration mới)
dotnet ef database update
```

> ⚠️ Đảm bảo container Docker **đang chạy** trước khi chạy lệnh này.

### 3.3. Chạy Backend Server

```bash
cd backend-dotnet
dotnet run
```

Backend sẽ khởi động tại: **`http://localhost:5149`**

**Kiểm tra backend hoạt động:**
```bash
curl http://localhost:5149/api/courses
# Kết quả mong muốn: JSON array (có thể rỗng [])
```

---

## 🌐 Bước 4 — Cài đặt Frontend (Next.js 16)

### 4.1. Tạo file `.env.local`

```bash
cd frontend-nextjs
```

Tạo file `frontend-nextjs/.env.local` với nội dung sau:

```env
# NextAuth Configuration
NEXTAUTH_SECRET=artlab_super_secret_key_2026_dev
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (lấy từ Google Cloud Console)
GOOGLE_CLIENT_ID=<your_google_client_id>
GOOGLE_CLIENT_SECRET=<your_google_client_secret>

# Backend sync key (phải khớp với ApiSyncSecret trong appsettings.json)
BACKEND_SYNC_SECRET=ArtLab_Super_Secret_Sync_Key_2026
```

> **Tạo Google OAuth Credentials:**
> 1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
> 2. Tạo project → APIs & Services → Credentials → Create OAuth 2.0 Client ID
> 3. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

### 4.2. Cài đặt dependencies

```bash
cd frontend-nextjs
npm install
```

### 4.3. Chạy Frontend

```bash
npm run dev
```

Frontend sẽ khởi động tại: **`http://localhost:3000`**

---

## ✅ Bước 5 — Xác nhận toàn bộ hệ thống

Mở 3 terminal riêng biệt và chạy:

| Terminal | Thư mục             | Lệnh                         | Kết quả            |
|----------|---------------------|------------------------------|--------------------|
| 1        | `backend-dotnet/`   | `docker-compose up -d`       | DB đang chạy       |
| 2        | `backend-dotnet/`   | `dotnet run`                 | API tại `:5149`    |
| 3        | `frontend-nextjs/`  | `npm run dev`                | Web tại `:3000`    |

Sau đó truy cập `http://localhost:3000` — web đã hoạt động đầy đủ! 🎉

---

## 📡 API Endpoints tham khảo

| Method | Endpoint                              | Mô tả                                    | Auth?    |
|--------|---------------------------------------|------------------------------------------|----------|
| GET    | `/api/courses`                        | Danh sách tất cả khóa học               | Không    |
| GET    | `/api/courses/{id}`                   | Chi tiết khóa học + chapters + lessons  | Không    |
| GET    | `/api/series`                         | Danh sách Series (bundle)               | Không    |
| GET    | `/api/lessons/{id}`                   | Chi tiết bài học (có OTP VdoCipher)     | JWT      |
| GET    | `/api/lessons/course/{courseId}`      | Curriculum của khóa học                 | JWT      |
| POST   | `/api/auth/register`                  | Đăng ký tài khoản                       | Không    |
| POST   | `/api/auth/login`                     | Đăng nhập → trả về JWT token            | Không    |
| GET    | `/api/cart`                           | Xem giỏ hàng                            | JWT      |
| POST   | `/api/cart/{courseId}`                | Thêm vào giỏ hàng                       | JWT      |
| DELETE | `/api/cart/{courseId}`                | Xóa khỏi giỏ hàng                       | JWT      |
| POST   | `/api/checkout`                       | Tạo đơn hàng + URL thanh toán VNPay     | JWT      |
| GET    | `/api/checkout/vnpay-return`          | Callback từ VNPay (xác nhận thanh toán) | Không    |
| GET    | `/api/my-courses`                     | Danh sách khóa học đã mua               | JWT      |

---

## 💳 Cấu hình Thanh toán (VNPay Sandbox)

Dự án tích hợp **VNPay Sandbox** để test thanh toán. Để sử dụng:

1. Đăng ký tài khoản tại [VNPay Sandbox](https://sandbox.vnpayment.vn/)
2. Lấy `TmnCode` và `HashSecret` từ dashboard
3. Cập nhật vào `appsettings.json`

**Thẻ test VNPay:**
| Thông tin       | Giá trị             |
|-----------------|---------------------|
| Ngân hàng       | NCB                 |
| Số thẻ          | `9704198526191432198` |
| Tên chủ thẻ     | `NGUYEN VAN A`      |
| Ngày phát hành  | `07/15`             |
| OTP             | `123456`            |

---

## 🎬 Cấu hình Video (VdoCipher)

ArtLab sử dụng **VdoCipher** để phát video DRM bảo mật.

1. Đăng ký tại [VdoCipher](https://www.vdocipher.com/)
2. Lấy API Key từ dashboard
3. Cập nhật `VdoCipherApiKey` trong `appsettings.json`
4. Upload video qua trang Admin: `http://localhost:3000/admin`

> **Trial Account:** Giới hạn 4 video. Xóa video cũ trước khi upload mới bằng script `clear_vdo.ps1`.

---

## 🔒 Cấu hình Google OAuth

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo OAuth 2.0 Client ID (Web Application)
3. Thêm Authorized redirect URI:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
4. Sao chép `Client ID` và `Client Secret` vào `.env.local`

---

## 👤 Tài khoản Admin mặc định

Sau khi chạy migration, đăng ký tài khoản đầu tiên qua `/api/auth/register`, sau đó cập nhật role thủ công:

```bash
# Kết nối vào container PostgreSQL
docker exec -it artlab_postgres psql -U postgres -d artlab_db

# Cập nhật role admin
UPDATE "Users" SET "Role" = 'Admin' WHERE "Email" = 'your@email.com';
\q
```

Sau đó truy cập trang Admin tại: `http://localhost:3000/admin`

---

## 🛠️ Các lệnh hữu ích

### Backend

```bash
# Thêm migration mới
dotnet ef migrations add <TênMigration>

# Cập nhật database
dotnet ef database update

# Build kiểm tra lỗi compile
dotnet build

# Chạy với hot reload
dotnet watch run
```

### Frontend

```bash
# Chạy development
npm run dev

# Build production
npm run build

# Chạy production build
npm start

# Kiểm tra lỗi TypeScript/ESLint
npm run lint
```

### Docker

```bash
# Khởi động DB
docker-compose up -d

# Dừng DB (giữ data)
docker-compose down

# Xem logs
docker-compose logs -f

# Reset DB (xóa toàn bộ data)
docker-compose down -v && docker-compose up -d

# Kết nối trực tiếp vào DB
docker exec -it artlab_postgres psql -U postgres -d artlab_db
```

---

## 🐛 Xử lý lỗi thường gặp

### ❌ `Connection refused` khi chạy backend

**Nguyên nhân:** Docker container chưa chạy hoặc migration chưa được apply.

```bash
docker-compose up -d                # Khởi động DB
dotnet ef database update           # Apply migration
dotnet run                          # Chạy lại backend
```

### ❌ `401 Unauthorized` khi gọi API

**Nguyên nhân:** JWT token hết hạn hoặc không hợp lệ.

→ Đăng xuất và đăng nhập lại trên frontend.

### ❌ Frontend không kết nối được Backend

**Nguyên nhân:** Backend chưa chạy hoặc sai port.

Kiểm tra backend đang chạy tại `http://localhost:5149`:
```bash
curl http://localhost:5149/api/courses
```

### ❌ `VdoCipher API Error: 403`

**Nguyên nhân:** Sai API Key hoặc đã đạt giới hạn Trial (4 videos).

→ Kiểm tra API Key trong `appsettings.json`
→ Xóa video cũ bằng dashboard VdoCipher hoặc script `clear_vdo.ps1`

### ❌ `dotnet ef` không nhận diện được

```bash
dotnet tool install --global dotnet-ef
```

---

## 📁 Cấu trúc thư mục chi tiết

```
artlab/
├── backend-dotnet/
│   ├── Controllers/
│   │   ├── AuthController.cs           # Đăng ký / Đăng nhập
│   │   ├── CoursesController.cs        # CRUD khóa học
│   │   ├── SeriesController.cs         # CRUD series (bundle)
│   │   ├── LessonsController.cs        # Bài học + VdoCipher OTP
│   │   ├── CartController.cs           # Giỏ hàng
│   │   ├── CheckoutController.cs       # Thanh toán VNPay
│   │   ├── MyCoursesController.cs      # Khóa học đã mua
│   │   ├── AdminController.cs          # Quản trị nội dung
│   │   ├── TutorController.cs          # Dashboard Giáo viên
│   │   └── VdoCipherAdminController.cs # Upload/quản lý video
│   ├── Models/                         # Entity models (EF Core)
│   ├── Data/
│   │   └── AppDbContext.cs             # EF DbContext
│   ├── Services/
│   │   ├── VdoCipherService.cs         # Tích hợp VdoCipher API
│   │   └── VnPayLibrary.cs            # Tạo chữ ký VNPay HMACSHA512
│   ├── Migrations/                     # EF Core migrations
│   ├── appsettings.json               # Cấu hình (DB, JWT, VNPay, VdoCipher)
│   └── docker-compose.yml             # PostgreSQL container
│
├── frontend-nextjs/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx               # Trang chủ
│   │   │   ├── course/[id]/           # Chi tiết khóa học
│   │   │   ├── series/                # Danh sách Series
│   │   │   ├── learn/[courseId]/[lessonId]/  # Xem video bài học
│   │   │   ├── cart/                  # Giỏ hàng + chọn PTTT
│   │   │   ├── checkout/
│   │   │   │   └── payment-return/    # Xử lý callback VNPay
│   │   │   ├── my-courses/            # Khóa học của tôi
│   │   │   ├── admin/                 # Trang quản trị
│   │   │   └── api/auth/              # NextAuth API routes
│   │   └── components/               # Shared components (Header, Footer, ...)
│   ├── .env.local                     # Biến môi trường (tạo thủ công)
│   └── package.json
│
├── SETUP.md                           # Tài liệu này
└── clear_vdo.ps1                      # Script xóa video VdoCipher (PowerShell)
```

---

## 🔄 Luồng hoạt động chính

```
Người dùng truy cập localhost:3000
          │
          ▼
   [Next.js Frontend]
   Gọi API localhost:5149
          │
          ▼
   [ASP.NET Core Backend]
   Xác thực JWT → Xử lý logic
          │
          ├──► [PostgreSQL DB] — Truy vấn dữ liệu qua EF Core
          │
          ├──► [VdoCipher API] — Lấy OTP để phát video DRM
          │
          └──► [VNPay Gateway] — Xử lý thanh toán
```

---

*Cập nhật lần cuối: 2026-05-04*
