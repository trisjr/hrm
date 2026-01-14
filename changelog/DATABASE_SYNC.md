# Hướng dẫn Đồng bộ Database (Database Sync Guide)

Hướng dẫn này mô tả cách cài đặt và đồng bộ hóa schemas vào cơ sở dữ liệu PostgreSQL sử dụng Drizzle ORM.

## 1. Cài đặt Dependencies

Trước tiên, hãy cài đặt các thư viện cần thiết:

```bash
pnpm add drizzle-orm postgres
pnpm add -D drizzle-kit
```

## 2. Cấu hình Môi trường

Đảm bảo file `.env` của bạn có biến `DATABASE_URL` chính xác. Ví dụ:

```env
DATABASE_URL="postgres://hrm_user:hrm_password@localhost:5432/hrm_database"
```

## 3. Các bước Đồng bộ (Sync)

Có hai cách chính để đồng bộ schema vào database:

### Cách A: Push trực tiếp (Khuyên dùng cho Development)

Cách này sẽ tự động thay đổi cấu trúc database để khớp với file `schema.ts`.

```bash
pnpm run db:push
```

### Cách B: Tạo Migration (Khuyên dùng cho Production)

1. **Tạo file migration SQL**:

   ```bash
   pnpm run db:generate
   ```

   Lệnh này sẽ tạo thư mục `src/db/migrations` chứa các file SQL.

2. **Chạy migration**:
   ```bash
   pnpm run db:migrate
   ```
   (Lưu ý: Bạn có thể cần chạy lệnh này hoặc dùng công cụ CI/CD để apply migration).

## 4. Kiểm tra dữ liệu

Bạn có thể sử dụng Drizzle Studio để xem và quản lý dữ liệu trực quan:

```bash
pnpm run db:studio
```

## 5. Cấu trúc Schema

File schema chính nằm tại: `src/db/schema.ts`
File kết nối database: `src/db/index.ts`
Config Drizzle: `drizzle.config.ts`
