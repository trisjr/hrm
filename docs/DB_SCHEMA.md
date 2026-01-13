# Database Schema – HRM System for Tech House

## 1. Sơ đồ thực thể (Entities)

### 1.1. Bảng `roles` (Vai trò hệ thống)

Lưu trữ các cấp bậc quyền hạn trong hệ thống.

- `id`: INT (PK)
- `role_name`: VARCHAR (Admin, HR, Leader, Dev)
- `description`: TEXT
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP
- `deleted_at`: TIMESTAMP

### 1.2. Bảng `teams` (Team chuyên môn)

Quản lý các đơn vị chuyên môn. Leader và Dev sẽ được gắn vào đây.

- `id`: INT (PK)
- `team_name`: VARCHAR (FE, BE, Design, QA, DevOps...)
- `description`: TEXT
- `leader_id`: INT (FK - Liên kết đến bảng `users`) - Người đứng đầu team.
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP
- `deleted_at`: TIMESTAMP

### 1.3. Bảng `users` (Tài khoản người dùng)

Thông tin đăng nhập và định danh cơ bản.

- `id`: INT (PK)
- `employee_code`: VARCHAR (Unique) - Mã nhân viên.
- `email`: VARCHAR (Unique) - Email công ty.
- `phone`: VARCHAR.
- `password_hash`: VARCHAR.
- `role_id`: INT (FK) - Liên kết `roles`.
- `team_id`: INT (FK) - Liên kết `teams` (Mỗi người thuộc 1 team).
- `status`: ENUM ('ACTIVE', 'INACTIVE', 'ON_LEAVED', 'RETIRED').
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP
- `deleted_at`: TIMESTAMP

### 1.4. Bảng `verification_tokens` (Mã xác thực)

Lưu trữ token hoặc mã OTP để xác thực email và đặt lại mật khẩu.

- `id`: INT (PK)
- `user_id`: INT (FK)
- `token`: VARCHAR - Mã xác thực (được mã hóa nếu cần).
- `type`: ENUM ('ACTIVATION', 'RESET_PASSWORD') - Loại xác thực.
- `expires_at`: TIMESTAMP - Thời gian hết hạn.
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP
- `deleted_at`: TIMESTAMP

---

## 2. Thông tin Hồ sơ & Chuyên môn

### 2.1. Bảng `profiles` (Hồ sơ cá nhân)

Thông tin chi tiết của nhân viên.

- `id`: INT (PK)
- `user_id`: INT (FK - Unique) - Liên kết 1-1 với `users`.
- `full_name`: VARCHAR.
- `dob`: DATE - Ngày sinh.
- `gender`: VARCHAR.
- `id_card_number`: VARCHAR (CCCD/CMND).
- `address`: TEXT.
- `join_date`: DATE - Ngày bắt đầu làm việc (Ngày vào công ty).
- `union_join_date`: DATE - Ngày gia nhập công đoàn.
- `union_position`: VARCHAR - Chức vụ công đoàn.
- `avatar_url`: VARCHAR
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP
- `deleted_at`: TIMESTAMP

### 2.2. Bảng `cv_attachments` (Quản lý CV)

Lưu trữ các phiên bản CV của nhân viên.

- `id`: INT (PK)
- `user_id`: INT (FK)
- `file_name`: VARCHAR.
- `file_path`: VARCHAR (Lưu đường dẫn file PDF/DOC).
- `version`: VARCHAR (Cập nhật phiên bản).
- `is_current`: BOOLEAN - Đánh dấu bản CV mới nhất.
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP
- `deleted_at`: TIMESTAMP

### 2.3. Quản lý Kỹ năng (Skill Management)

#### 2.3.1. Bảng `master_skills` (Danh mục kỹ năng)

Danh sách định nghĩa các kỹ năng (cả chuyên môn và kỹ năng mềm).

- `id`: INT (PK)
- `name`: VARCHAR (React, Giao tiếp, Tiếng Anh...).
- `type`: ENUM ('HARD_SKILL', 'SOFT_SKILL').
- `category`: VARCHAR (Frontend, Backend, Soft Skill...).
- `description`: TEXT.
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP
- `deleted_at`: TIMESTAMP

#### 2.3.2. Bảng `skill_levels` (Cấp độ kỹ năng)

Định nghĩa các level cho từng kỹ năng cụ thể (VD: React có Junior/Senior, Tiếng Anh có IELTS 6.0/7.0).

- `id`: INT (PK)
- `skill_id`: INT (FK) - Liên kết `master_skills`.
- `name`: VARCHAR (Junior, Senior, Level 1, Level 2...).
- `level_order`: INT - Dùng để sắp xếp thứ tự thấp đến cao (1, 2, 3...).
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP
- `deleted_at`: TIMESTAMP

#### 2.3.3. Bảng `skill_criteria` (Tiêu chí đánh giá)

Các yêu cầu chi tiết để đạt được level tương ứng.

- `id`: INT (PK)
- `level_id`: INT (FK) - Liên kết `skill_levels`.
- `content`: TEXT - Nội dung yêu cầu (VD: "Hiểu rõ về React Hooks").
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP
- `deleted_at`: TIMESTAMP

#### 2.3.4. Bảng `user_skills` (Kỹ năng nhân viên)

Lưu trữ đánh giá kỹ năng của từng nhân sự.

- `id`: INT (PK)
- `user_id`: INT (FK)
- `skill_id`: INT (FK) - Liên kết `master_skills`.
- `level_id`: INT (FK) - Liên kết `skill_levels` (Level hiện tại của nhân viên).
- `assessed_at`: DATE - Ngày đánh giá gần nhất.
- `note`: TEXT - Ghi chú thêm.
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP
- `deleted_at`: TIMESTAMP

### 2.9. Chấm công & Yêu cầu nghỉ phép (Time & Attendance)

#### 2.9.1. Bảng `attendance_logs` (Nhật ký chấm công)

Ghi nhận thời gian vào/ra của nhân viên.

- `id`: INT (PK)
- `user_id`: INT (FK)
- `check_in_time`: TIMESTAMP - Thời gian vào.
- `check_out_time`: TIMESTAMP - Thời gian ra.
- `date`: DATE - Ngày làm việc.
- `status`: ENUM ('ON_TIME', 'LATE', 'EARLY_LEAVE', 'ABSENT') - Trạng thái.
- `total_hours`: FLOAT - Tổng số giờ làm việc trong ngày.
- `note`: TEXT.
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP
- `deleted_at`: TIMESTAMP

#### 2.9.2. Bảng `work_requests` (Yêu cầu nghỉ phép/WFH/OT)

Quản lý các yêu cầu nghỉ phép, làm việc từ xa, hoặc làm thêm giờ.

- `id`: INT (PK)
- `user_id`: INT (FK) - Người tạo yêu cầu.
- `type`: ENUM ('LEAVE', 'WFH', 'LATE', 'EARLY', 'OVERTIME').
- `start_date`: TIMESTAMP - Thời gian bắt đầu.
- `end_date`: TIMESTAMP - Thời gian kết thúc.
- `reason`: TEXT - Lý do.
- `approver_id`: INT (FK) - Người duyệt (Leader hoặc HR).
- `status`: ENUM ('PENDING', 'APPROVED', 'REJECTED').
- `rejection_reason`: TEXT - Lý do từ chối.
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP
- `deleted_at`: TIMESTAMP

---

### 2.4. Bảng `education_experience` (Học vấn & Kinh nghiệm)

Gộp các thông tin về trình độ và quá trình công tác.

- `id`: INT (PK)
- `user_id`: INT (FK)
- `type`: ENUM ('Education', 'Experience') - Loại thông tin.
- `organization_name`: VARCHAR (Tên trường hoặc tên công ty cũ).
- `position_major`: VARCHAR (Chuyên ngành hoặc Chức vụ cũ).
- `start_date`: DATE
- `end_date`: DATE (Null nếu đang làm việc)
- `description`: TEXT.
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP
- `deleted_at`: TIMESTAMP

### 2.5. Bảng `achievements` (Thành tích - Khen thưởng - Kỷ luật)

Ghi lại các biến động về thi đua khen thưởng.

- `id`: INT (PK)
- `user_id`: INT (FK)
- `type`: ENUM ('Award', 'Discipline').
- `title`: VARCHAR.
- `content`: TEXT.
- `issued_date`: DATE.
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP
- `deleted_at`: TIMESTAMP

### 2.6. Bảng `email_templates` (Mẫu Email)

Quản lý các mẫu email dùng chung trong hệ thống.

- `id`: INT (PK)
- `code`: VARCHAR (Unique) - Mã định danh mẫu email (VD: WELCOME_NEW_USER).
- `name`: VARCHAR - Tên mẫu email.
- `subject`: VARCHAR - Tiêu đề email.
- `body`: TEXT - Nội dung HTML.
- `variables`: TEXT - Mô tả JSON các biến số sử dụng trong mẫu.
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP
- `deleted_at`: TIMESTAMP

### 2.7. Bảng `email_logs` (Lịch sử gửi Email)

Lưu trữ lịch sử gửi email của hệ thống.

- `id`: INT (PK)
- `sender_id`: INT (FK) - Người gửi (Admin/System).
- `recipient_email`: VARCHAR - Email người nhận.
- `subject`: VARCHAR - Tiêu đề email đã gửi.
- `status`: ENUM ('SENT', 'FAILED', 'QUEUED').
- `sent_at`: TIMESTAMP - Thời gian gửi.
- `error_message`: TEXT - Ghi lại lỗi nếu gửi thất bại.
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP
- `deleted_at`: TIMESTAMP

- `deleted_at`: TIMESTAMP

### 2.8. Bảng `profile_update_requests` (Yêu cầu cập nhật hồ sơ)

Lưu trữ các thay đổi thông tin cá nhân cần được phê duyệt.

- `id`: INT (PK)
- `user_id`: INT (FK) - Người yêu cầu cập nhật.
- `data_changes`: JSON - Chứa các trường thông tin thay đổi (VD: `{"phone": "098...", "address": "New Address"}`).
- `status`: ENUM ('PENDING', 'APPROVED', 'REJECTED') - Trạng thái yêu cầu.
- `reviewer_id`: INT (FK) - Người phê duyệt (Admin/HR).
- `rejection_reason`: TEXT - Lý do từ chối (nếu có).
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP
- `deleted_at`: TIMESTAMP

---

## 3. Mối quan hệ giữa các bảng (Relationships)

- **Users - Roles**: N-1 (Nhiều nhân viên có cùng 1 vai trò).
- **Users - Teams**: N-1 (Nhiều nhân viên thuộc về 1 team chuyên môn).
- **Users - Profiles**: 1-1 (Mỗi tài khoản có duy nhất một hồ sơ chi tiết).
- **Users - CVs/Skills/Education/Achievements**: 1-N (Một nhân viên có nhiều bản CV, nhiều kỹ năng và lịch sử công tác).

## 4. Ghi chú thiết kế cho Developer

- **Chỉ mục (Indexing)**: Nên đánh index cho `employee_code`, `email` và `team_id` để tối ưu hóa việc tìm kiếm và lọc nâng cao theo yêu cầu của Admin/HR.
- **Phân quyền dữ liệu**: Khi truy vấn, hệ thống cần check `role_id`. Nếu là **Leader**, chỉ được phép query các `users` có cùng `team_id` với mình.
