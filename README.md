# Hệ Thống Đánh Giá Multi-Subject

🎯 **Hệ thống đánh giá đa người (Multi-Subject Evaluation System)** - Ứng dụng web cho phép tạo và quản lý phiên đánh giá hiệu suất cho nhiều nhân viên với các bộ câu hỏi linh hoạt.

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

### Clone và cài đặt dependencies

```bash
# Clone repository
git clone <repository-url>
cd he-thong-danh-gia

# Cài đặt dependencies
npm install

# Hoặc dùng yarn
yarn install
```

## 🏃 Chạy ứng dụng

### Development mode

```bash
# Chạy frontend (Vite dev server)
npm run dev

# Ứng dụng sẽ chạy tại http://localhost:3000
```

### Build cho production

```bash
# Build frontend
npm run build

# Preview production build
npm run preview
```

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
npm run dev          # Start dev server

# Build
npm run build        # Build for production
npm run preview      # Preview production build

# Backend (khi có)
npm run server       # Start Express server
```

## 📝 Notes

- Hiện tại đang dùng mock data cho demo
- Cần implement backend API cho production
- Database schema cần được thiết kế cho các entities: Templates, Sessions, Subjects, Responses

## 🎯 Future Enhancements

- [ ] Backend API với Express + MongoDB/PostgreSQL
- [ ] Authentication & Authorization
- [ ] Email notifications
- [ ] Real-time collaboration
- [ ] Advanced analytics & reporting
- [ ] PDF export với charts
- [ ] Multi-language support
- [ ] Dark mode

## 👨‍💻 Author

**Khánh - MKT Software**

## 📄 License

MIT License

---

**Version:** 1.0.0  
**Last Updated:** 2026-01-21
