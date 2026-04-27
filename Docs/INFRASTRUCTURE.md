# Tài Liệu Hướng Dẫn Tích Hợp Hạ Tầng & Triển Khai (Infrastructure)

Tài liệu này hướng dẫn cách kết nối hệ thống ArtLab (Next.js + C#) với cơ sở hạ tầng hiện có của bạn (Tên miền `artlab.com.vn` và WordPress Server).

## 1. Phương án Xử Lý Tên Miền (Domain)

Theo quyết định sử dụng **Hướng 1 (Đập đi xây lại)**:
- Tên miền chính **`artlab.com.vn`** sẽ trỏ về hệ thống Frontend (Next.js).
- Tên miền phụ **`api.artlab.com.vn`** sẽ trỏ về hệ thống Backend (C#).

### Các bước cấu hình trên trang quản lý Domain (như Mắt Bão, Tenten, v.v.):
1. Đăng nhập vào trang quản trị DNS của tên miền `artlab.com.vn`.
2. Xóa các bản ghi (Record) A cũ đang trỏ về IP của server WordPress hiện tại.
3. Tạo bản ghi mới:
   - **Tên (Host):** `@` (hoặc `www`)
   - **Loại (Type):** `A` (hoặc `CNAME` nếu deploy Next.js qua Vercel).
   - **Giá trị (Value):** `IP của server Next.js` (hoặc CNAME của Vercel cung cấp).
4. Tạo thêm một bản ghi cho API:
   - **Tên (Host):** `api`
   - **Loại (Type):** `A`
   - **Giá trị (Value):** `IP của VPS/Server chạy C#`.

---

## 2. Setup Máy Chủ (Server) cho Backend C#

Do máy chủ WordPress hiện tại là Share Hosting (giả định), bạn không thể chạy C# trên đó. Bạn cần thuê một **VPS Linux (Ubuntu 22.04 / 24.04)** hoặc dùng **Azure**. Nếu dùng VPS, thực hiện các bước sau:

### Bước 2.1: Cài đặt Môi trường trên VPS (Ubuntu)
- Kết nối SSH vào VPS.
- Cài đặt `.NET 8/9 SDK` theo tài liệu chính thức của Microsoft.
- Cài đặt `PostgreSQL` (nếu dùng DB này) hoặc chuẩn bị chuỗi kết nối tới Azure SQL.

### Bước 2.2: Thiết lập Nginx (Lễ tân)
Nginx sẽ đóng vai trò là Reverse Proxy để hứng request `api.artlab.com.vn` và đẩy vào cổng 5000 của C#.
```bash
sudo apt update
sudo apt install nginx
```

### Bước 2.3: Tạo File Cấu hình Nginx
Tạo file `/etc/nginx/sites-available/api.artlab.com.vn`:
```nginx
server {
    listen 80;
    server_name api.artlab.com.vn;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection keep-alive;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
Kích hoạt:
```bash
sudo ln -s /etc/nginx/sites-available/api.artlab.com.vn /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Bước 2.4: Bảo mật với HTTPS (Let's Encrypt)
Chạy lệnh Certbot để tự động mã hóa SSL:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.artlab.com.vn
```

## 3. Tích hợp VdoCipher (DRM Video)
- Đăng ký tài khoản VdoCipher.
- Lấy `API Secret Key` từ dashboard của họ, lưu vào biến môi trường của C# (`appsettings.json`).
- Backend C# gọi API lấy mã OTP.
- Frontend Next.js dùng mã OTP để render `iframe` của trình phát VdoCipher kèm Watermark.
