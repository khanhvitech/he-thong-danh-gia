# Backend Setup với PostgreSQL

## Cài đặt PostgreSQL

### Windows:
1. Tải PostgreSQL từ https://www.postgresql.org/download/windows/
2. Cài đặt với mật khẩu mặc định: `postgres`
3. Tạo database:
```bash
psql -U postgres
CREATE DATABASE he_thong_danh_gia;
\q
```

### macOS (Homebrew):
```bash
brew install postgresql@14
brew services start postgresql@14
createdb he_thong_danh_gia
```

### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo -u postgres psql
CREATE DATABASE he_thong_danh_gia;
\q
```

## Cấu hình

1. Copy file `.env.example` thành `.env`:
```bash
cp server/.env.example server/.env
```

2. Chỉnh sửa file `.env` với thông tin database của bạn:
```
DB_USER=postgres
DB_HOST=localhost
DB_NAME=he_thong_danh_gia
DB_PASSWORD=your_password_here
DB_PORT=5432
PORT=5000
```

## Khởi tạo Database

Chạy script để tạo các bảng:
```bash
npm run init-db
```

Script sẽ tạo các bảng:
- `question_templates` - Lưu bộ câu hỏi
- `evaluation_sessions` - Lưu phiên đánh giá
- `evaluation_responses` - Lưu kết quả đánh giá

## Chạy Server

### Chạy riêng backend:
```bash
npm run server
```

### Chạy cả frontend + backend:
```bash
npm run dev:all
```

Server sẽ chạy tại: http://localhost:5000

## API Endpoints

### Templates
- `GET /api/templates` - Lấy tất cả templates
- `GET /api/templates/:id` - Lấy template theo ID
- `POST /api/templates` - Tạo template mới
- `PUT /api/templates/:id` - Cập nhật template
- `DELETE /api/templates/:id` - Xóa template

### Sessions
- `GET /api/sessions` - Lấy tất cả sessions
- `GET /api/sessions/:id` - Lấy session theo ID
- `GET /api/sessions/token/:token` - Lấy session theo token
- `POST /api/sessions` - Tạo session mới
- `PUT /api/sessions/:id` - Cập nhật session
- `DELETE /api/sessions/:id` - Xóa session

### Evaluations
- `GET /api/evaluations` - Lấy tất cả evaluations
- `GET /api/evaluations/session/:sessionId` - Lấy evaluations theo session
- `POST /api/evaluations` - Submit evaluation
- `GET /api/evaluations/session/:sessionId/statistics` - Thống kê

## Kiểm tra kết nối

```bash
curl http://localhost:5000/api/health
```

Nếu thành công sẽ trả về:
```json
{
  "status": "ok",
  "message": "Hệ thống đánh giá API đang hoạt động",
  "timestamp": "2024-01-21T..."
}
```

## Troubleshooting

### Lỗi kết nối database:
- Kiểm tra PostgreSQL đã chạy: `pg_ctl status` (Windows) hoặc `brew services list` (macOS)
- Kiểm tra thông tin trong file `.env`
- Kiểm tra firewall không chặn port 5432

### Lỗi port đã được sử dụng:
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5000 | xargs kill -9
```
