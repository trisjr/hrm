# Mailbox Tracker Specification

## 1. Executive Summary

Xây dựng công cụ "Hộp thư hệ thống" (Mailbox Tracker) dành cho Developer và QA để kiểm tra và theo dõi các email được gửi từ hệ thống mà không cần integration với SMTP server thực tế trong môi trường dev.

## 2. User Stories

- **Là Developer**, tôi muốn nhập một địa chỉ email để xem các thư hệ thống đã gửi tới đó, giúp tôi debug luồng đăng ký hoặc thông báo.
- **Là QA**, tôi muốn xem nội dung HTML của email gửi đi để kiểm tra việc hiển thị và các biến số (placeholders) có được thay thế đúng hay không.

## 3. Database Design

Sử dụng bảng `email_logs` hiện có:

- `id`: Primary Key.
- `recipient_email`: Dùng để filter.
- `subject`: Tiêu đề.
- `body`: Nội dung HTML/Text của email.
- `status`: SENT, FAILED, QUEUED.
- `sent_at`: Timestamp.

## 4. API Contract

### `getMailboxLogsFn` (POST)

- **Input**: `{ token: string, recipientEmail: string }`
- **Output**:
  ```json
  [
    {
      "id": 1,
      "subject": "Xác nhận tài khoản",
      "body": "<html>...</html>",
      "status": "SENT",
      "sentAt": "2024-03-20T10:00:00Z"
    }
  ]
  ```

## 5. UI Components Hierarchy

- **`MailboxSearch`**: Input field để nhập email tracking (lưu vào query params hoặc local state).
- **`MailboxList`**: Danh sách thư thu gọn ở sidebar trái.
- **`MailboxViewer`**: Khung hiển thị nội dung chi tiết bên phải, hỗ trợ:
  - Hiển thị Subject, To, Sent At.
  - Một `iframe` hoặc `div` để render nội dung HTML an toàn (Sanitized).

## 6. Route Structure

- **URL**: `/mailbox`
- **Access**: Global (dành cho môi trường dev/test).

## 7. Implementation Plan

1. **Backend**: Viết `getMailboxLogsImpl` để query dữ liệu từ `email_logs`.
2. **Frontend UI**:
   - Thiết kế layout 2 cột.
   - Xử lý trạng thái loading và empty state (chưa nhập email hoặc không có mail).
3. **Navigation**: Thêm menu link "Mailbox Tracker" (có thể chỉ hiện ở DEV mode nếu cần).

## 8. Tech Stack

- **Radix UI/Shadcn**: Card, ScrollArea, Input, Badge.
- **Lucide React**: Mail, Search, Inbox icons.
