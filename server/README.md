# Backend API - Hệ thống đánh giá đa người

## Cấu trúc thư mục

```
server/
├── index.js                 # Main server file
├── routes/                  # API routes
│   ├── templates.js         # Template routes
│   ├── sessions.js          # Session routes
│   └── evaluations.js       # Evaluation routes
├── controllers/             # Business logic
│   ├── templateController.js
│   ├── sessionController.js
│   └── evaluationController.js
├── utils/                   # Utilities
│   └── storage.js          # File storage utilities
└── data/                    # JSON data storage
    ├── templates.json
    ├── sessions.json
    └── evaluations.json
```

## API Endpoints

### Templates API (`/api/templates`)
- `GET /` - Lấy tất cả templates
- `GET /:id` - Lấy template theo ID
- `POST /` - Tạo template mới
- `PUT /:id` - Cập nhật template
- `DELETE /:id` - Xóa template

### Sessions API (`/api/sessions`)
- `GET /` - Lấy tất cả sessions
- `GET /:id` - Lấy session theo ID
- `GET /token/:token` - Lấy session theo token (cho người đánh giá)
- `POST /` - Tạo session mới
- `PUT /:id` - Cập nhật session
- `DELETE /:id` - Xóa session

### Evaluations API (`/api/evaluations`)
- `GET /` - Lấy tất cả evaluations
- `GET /session/:sessionId` - Lấy evaluations theo session
- `GET /session/:sessionId/statistics` - Lấy thống kê của session
- `POST /` - Submit evaluation

### Health Check
- `GET /api/health` - Kiểm tra trạng thái server

## Chạy Backend

### Chỉ backend:
```bash
npm run server
```

### Frontend + Backend cùng lúc:
```bash
npm run dev:all
```

Backend sẽ chạy tại: http://localhost:5000

## Lưu trữ dữ liệu

Backend sử dụng file-based storage (JSON files) để lưu trữ dữ liệu trong thư mục `server/data/`:
- `templates.json` - Bộ câu hỏi
- `sessions.json` - Phiên đánh giá
- `evaluations.json` - Kết quả đánh giá

## Testing API

Sử dụng Postman hoặc curl để test:

```bash
# Health check
curl http://localhost:5000/api/health

# Get all templates
curl http://localhost:5000/api/templates

# Create template
curl -X POST http://localhost:5000/api/templates \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Template","description":"Test","roles":[],"questions":[]}'
```
