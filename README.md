# Hệ Thống Đánh Giá Multi-Subject

🎯 **Hệ thống đánh giá đa người (Multi-Subject Evaluation System)** - Ứng dụng web cho phép tạo và quản lý phiên đánh giá hiệu suất cho nhiều nhân viên với các bộ câu hỏi linh hoạt.

---

## 📋 Mục Lục

- [Tính năng chính](#-tính-năng-chính)
- [Cài đặt](#-cài-đặt)
- [Cấu hình Database](#-cấu-hình-database)
- [Build & Deploy](#-build--deploy)
- [Tùy chỉnh](#-tùy-chỉnh)
- [Hướng dẫn sử dụng](#-hướng-dẫn-sử-dụng)

---

## ✨ Tính năng chính

### 🔧 Cho Admin/HR:
- **Quản lý bộ câu hỏi**: Tạo, chỉnh sửa, sao chép template câu hỏi
- **Tạo phiên đánh giá**: Wizard 3 bước dễ sử dụng
  - Bước 1: Nhập thông tin chung (tên phiên, người đánh giá, deadline)
  - Bước 2: Thêm người được đánh giá và gán bộ câu hỏi cho từng người
  - Bước 3: Xem trước và tạo link đánh giá
- **Dashboard quản lý**: Theo dõi trạng thái các phiên đánh giá
- **Xem kết quả**: Biểu đồ, thống kê, so sánh chi tiết
- **Export dữ liệu**: Xuất báo cáo Excel/PDF

### 👤 Cho Người đánh giá:
- **Landing page thân thiện**: Hiển thị tổng quan phiên đánh giá
- **Form đánh giá trực quan**: 
  - Progress bar theo dõi tiến độ
  - Navigation linh hoạt giữa các người
  - Auto-save mỗi 30 giây
  - Nhiều loại câu hỏi: Rating (1-5, 1-10), Text, Multiple choice, v.v.
- **Review trước khi submit**: Xem lại toàn bộ đánh giá
- **Mobile responsive**: Hoạt động tốt trên mọi thiết bị

## 🚀 Cài đặt

### Prerequisites
- Node.js >= 18.0.0
- npm hoặc yarn
- PostgreSQL >= 14

### Clone và cài đặt dependencies

```bash
# Clone repository
git clone <repository-url>
cd he-thong-danh-gia

# Cài đặt dependencies
npm install
```

---

## 🗄️ Cấu hình Database

### 1. Cài đặt PostgreSQL

**Windows:**
1. Tải từ https://www.postgresql.org/download/windows/
2. Cài đặt và nhớ mật khẩu đã đặt

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

### 2. Tạo Database

```bash
# Kết nối PostgreSQL
psql -U postgres

# Tạo database
CREATE DATABASE he_thong_danh_gia;
\q
```

### 3. Cấu hình file .env

Tạo file `server/.env`:

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=he_thong_danh_gia
DB_PASSWORD=your_password_here
DB_PORT=5432
PORT=5000
```

### 4. Khởi tạo bảng

```bash
npm run init-db
```

---

## 🏃 Build & Deploy

### Development mode

```bash
# Chạy cả frontend + backend
npm run dev:all

# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
```

### Build cho Production

```bash
# Build frontend
npm run build

# Kết quả build nằm trong thư mục /dist
```

### Deploy

1. **Build frontend:**
   ```bash
   npm run build
   ```

2. **Upload thư mục `/dist`** lên hosting (Nginx, Apache, Vercel, Netlify...)

3. **Chạy backend server:**
   ```bash
   npm run server
   ```

4. **Cấu hình API URL** trong `src/services/api.ts`:
   ```typescript
   const API_BASE_URL = 'https://your-api-domain.com/api';
   ```

---

## 🎨 Tùy chỉnh

### Thay đổi Logo

1. **Thay file logo:**
   - Đặt logo mới vào `public/assets/logo.png`
   - Kích thước khuyến nghị: 200x50px hoặc tương đương

2. **Cập nhật trong code** (nếu dùng logo ở nhiều nơi):
   ```tsx
   // src/components/layouts/AdminLayout.tsx
   <img src="/assets/logo.png" alt="Logo" className="h-8" />
   ```

3. **Thay đổi favicon:**
   - Đặt favicon mới vào `public/favicon.ico`
   - Hoặc cập nhật trong `index.html`:
     ```html
     <link rel="icon" type="image/png" href="/assets/favicon.png" />
     ```

### Thay đổi Tên & Branding

1. **Tên ứng dụng** - sửa trong các file:
   - `index.html` - thẻ `<title>`
   - `src/components/layouts/AdminLayout.tsx` - header
   - `src/pages/Login.tsx` - trang đăng nhập

2. **Màu sắc chính** - sửa trong `tailwind.config.js`:
   ```javascript
   theme: {
     extend: {
       colors: {
         primary: {
           50: '#eff6ff',
           500: '#3b82f6',  // Màu chính
           600: '#2563eb',
           700: '#1d4ed8',
         }
       }
     }
   }
   ```

### Thay đổi Link API

Sửa file `src/services/api.ts`:

```typescript
// Development
const API_BASE_URL = 'http://localhost:5000/api';

// Production
const API_BASE_URL = 'https://api.yourdomain.com/api';

// Hoặc dùng biến môi trường
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
```

Nếu dùng biến môi trường, tạo file `.env` ở root:
```env
VITE_API_URL=https://api.yourdomain.com/api
```

### Thay đổi Thông tin đăng nhập

Sửa file `src/contexts/AuthContext.tsx`:

```typescript
const ADMIN_CREDENTIALS = {
  username: 'Admin',
  password: 'YourNewPassword@123'
};
```

> ⚠️ **Lưu ý:** Trong production, nên chuyển xác thực sang backend với JWT token.

### Thay đổi Danh sách đối tượng đánh giá

Sửa file `src/pages/admin/CreateTemplate.tsx`:

```typescript
const [allSubjects] = useState<SubjectInTemplate[]>([
  { id: '1', name: 'Nguyễn Văn A', position: 'Giám đốc', department: 'Ban Giám Đốc' },
  { id: '2', name: 'Trần Thị B', position: 'Trưởng phòng', department: 'Phòng Kinh Doanh' },
  // Thêm nhân viên khác...
]);
```

### Thay đổi Danh sách phòng ban

Sửa file `src/pages/evaluator/EvaluationForm.tsx`:

```typescript
const DEPARTMENTS = [
  'Phòng Kỹ thuật',
  'Phòng Kinh doanh',
  'Phòng Marketing',
  // Thêm phòng ban khác...
];
```

---

## 📁 Cấu trúc thư mục

```
he-thong-danh-gia/
├── src/
│   ├── components/
│   │   ├── layouts/
│   │   │   └── AdminLayout.tsx      # Layout chính cho admin
│   │   └── ui/
│   │       ├── Button.tsx           # Component button
│   │       ├── Card.tsx             # Component card
│   │       ├── Input.tsx            # Input, Textarea, Select
│   │       ├── Modal.tsx            # Component modal
│   │       ├── ProgressBar.tsx      # Progress bar
│   │       └── StarRating.tsx       # Star rating component
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── QuestionTemplates.tsx    # Danh sách template
│   │   │   ├── CreateTemplate.tsx       # Tạo/sửa template
│   │   │   ├── CreateSession.tsx        # Tạo phiên đánh giá
│   │   │   ├── SessionDashboard.tsx     # Dashboard quản lý
│   │   │   └── SessionResults.tsx       # Xem kết quả
│   │   └── evaluator/
│   │       ├── EvaluationLanding.tsx    # Landing page
│   │       └── EvaluationForm.tsx       # Form đánh giá
│   ├── types/
│   │   └── index.ts                 # TypeScript types
│   ├── App.tsx                      # Main App component
│   ├── main.tsx                     # Entry point
│   └── index.css                    # Global styles
├── public/                          # Static assets
├── index.html                       # HTML template
├── package.json
├── tsconfig.json                    # TypeScript config
├── vite.config.ts                   # Vite config
├── tailwind.config.js               # Tailwind CSS config
└── README.md
```

## 🎨 Tech Stack

### Frontend:
- **React 18** với TypeScript
- **React Router v6** - Routing
- **Tailwind CSS** - Styling
- **Vite** - Build tool & dev server
- **Lucide React** - Icons
- **Recharts** - Biểu đồ

### UI Components:
- Custom components với Tailwind CSS
- Fully responsive design
- Accessibility support

## 📖 Hướng dẫn sử dụng

### Dành cho Admin:

1. **Tạo bộ câu hỏi**:
   - Truy cập "Bộ câu hỏi" → "Tạo bộ câu hỏi mới"
   - Nhập thông tin: tên, mô tả, vai trò áp dụng
   - Thêm các câu hỏi với loại khác nhau
   - Lưu và có thể tái sử dụng

2. **Tạo phiên đánh giá**:
   - Click "Tạo phiên đánh giá"
   - **Bước 1**: Nhập thông tin chung (tên, người đánh giá, deadline)
   - **Bước 2**: Thêm từng người cần đánh giá và chọn bộ câu hỏi
   - **Bước 3**: Xem trước → Tạo link
   - Copy link và gửi cho người đánh giá

3. **Theo dõi và xem kết quả**:
   - Dashboard hiển thị tất cả phiên đánh giá
   - Lọc theo trạng thái (pending, in-progress, completed)
   - Xem kết quả chi tiết với biểu đồ và thống kê
   - Export báo cáo

### Dành cho Người đánh giá:

1. Nhận link đánh giá qua email/slack
2. Mở link → Xem tổng quan phiên đánh giá
3. Click "Bắt đầu đánh giá"
4. Đánh giá từng người (có thể skip qua lại)
5. Hệ thống tự động lưu nháp mỗi 30 giây
6. Review lại toàn bộ → Submit

## 🔑 Key Features

### Multi-subject Support
- Một link cho nhiều người được đánh giá
- Mỗi người có thể có bộ câu hỏi khác nhau
- Linh hoạt trong việc gán câu hỏi

### Question Types
- ⭐ Rating (1-5, 1-10)
- 📝 Text (với min/max characters)
- ☑️ Single/Multiple choice
- 📊 Slider
- ✅ Yes/No

### UX Features
- ✨ Progress tracking real-time
- 💾 Auto-save draft
- 📱 Mobile responsive
- ♿ Accessibility support
- 🎨 Beautiful UI with Tailwind CSS

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev          # Start frontend dev server
npm run server       # Start backend server
npm run dev:all      # Start cả frontend + backend

# Build
npm run build        # Build for production
npm run preview      # Preview production build

# Database
npm run init-db      # Khởi tạo bảng trong database
```

### Cấu trúc Link đánh giá

Link đánh giá được tạo tự động từ tên bộ câu hỏi:
- Tên: "Đánh giá lãnh đạo Q1/2024"
- Link: `https://form.vitechgroup.vn/danh-gia-lanh-dao-q12024`

---

## 📝 Notes

- **Database:** PostgreSQL với các bảng: question_templates, evaluation_sessions, evaluation_responses
- **Authentication:** Đăng nhập đơn giản cho Admin (có thể mở rộng với JWT)
- **API:** RESTful API với Express.js

---

## 🎯 Future Enhancements

- [ ] JWT Authentication
- [ ] Email notifications
- [ ] Real-time collaboration
- [ ] Advanced analytics & reporting
- [ ] PDF export với charts
- [ ] Multi-language support
- [ ] Dark mode

---

## 👨‍💻 Author

**ViTech Group**

## 📄 License

MIT License

---

**Version:** 1.0.0  
**Last Updated:** 2026-01-22
