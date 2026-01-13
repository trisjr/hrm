# Database Layer Documentation

Thư mục này quản lý toàn bộ cấu trúc dữ liệu, kết nối và các tác vụ liên quan đến cơ sở dữ liệu của hệ thống HRM sử dụng **Drizzle ORM**.

## Cấu trúc thư mục

- `schema.ts`: Định nghĩa cấu trúc các bảng (tables), quan hệ (relations) và các kiểu dữ liệu (enums).
- `index.ts`: Khởi tạo kết nối database sử dụng `postgres-js` và cấu hình Drizzle instance.
- `seed.ts`: Script chứa dữ liệu mẫu để khởi tạo database (Roles, Admin User, Teams...).
- `reset.ts`: Script dùng để xoá sạch toàn bộ dữ liệu trong các bảng và reset các trường ID.
- `migrations/`: Chứa các file SQL được sinh ra bởi Drizzle Kit để đồng bộ hóa schema với database.

## Công nghệ sử dụng

- **Database**: PostgreSQL
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Driver**: `postgres.js`
- **Migration & Tooling**: `drizzle-kit`

## Các câu lệnh quan trọng (Commands)

Các câu lệnh này được cấu hình trong `package.json` ở thư mục gốc:

### 1. Quản lý Schema & Migrations

- `npm run db:generate`: So sánh code trong `schema.ts` và tạo ra các file migration mới trong thư mục `migrations/`.
- `npm run db:migrate`: Chạy các file migration để cập nhật cấu trúc bảng thực tế trong database.
- `npm run db:push`: Đẩy trực tiếp các thay đổi trong `schema.ts` lên database (phù hợp trong giai đoạn development nhanh, không khuyến khích dùng cho production).
- `npm run db:studio`: Mở giao diện web (GUI) để xem và chỉnh sửa dữ liệu trực tiếp tại: `https://local.drizzle.studio`.

### 2. Quản lý Dữ liệu (Data Management)

- `npm run db:seed`: Chèn dữ liệu mẫu vào các bảng.
- `npm run db:reset`: Xoá sạch toàn bộ dữ liệu trong database và reset tự động tăng (ID).
- `npm run db:refresh`: Phối hợp cả 2 lệnh trên (Reset + Seed) để đưa database về trạng thái khởi tạo chuẩn.

## Quy trình làm việc đề xuất

Khi bạn muốn thay đổi cấu trúc bảng:

1. Chỉnh sửa code trong `src/db/schema.ts`.
2. Chạy `npm run db:generate` để tạo file migration.
3. Chạy `npm run db:migrate` để cập nhật database server.
4. (Tùy chọn) Cập nhật `seed.ts` nếu có thêm các trường dữ liệu bắt buộc mới.

---

_Lưu ý: Luôn đảm bảo bạn đã cấu hình `DATABASE_URL` trong file `.env` trước khi thực hiện các lệnh trên._
