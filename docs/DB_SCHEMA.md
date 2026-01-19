# Database Schema – HRM System for Tech House

## 1. Sơ đồ thực thể (Entities)

### 1.1. Bảng `career_bands` (Cấp bậc nghề nghiệp)

Định nghĩa dải cấp bậc trong công ty từ Intern đến Senior/Lead.

- `id`: INT (PK)
- `band_name`: VARCHAR (Band 0, Band 1, Band 2, Band 3, Band 4)
- `title`: VARCHAR (Intern, Junior, Middle, Senior, Expert/Lead)
- `description`: TEXT
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### 1.2. Bảng `roles` (Vai trò hệ thống)

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
- `employee_code`: VARCHAR (Unique where deleted_at is NULL) - Mã nhân viên.
- `email`: VARCHAR (Unique where deleted_at is NULL) - Email công ty.
- `phone`: VARCHAR.
- `password_hash`: VARCHAR.
- `role_id`: INT (FK) - Liên kết `roles`.
- `team_id`: INT (FK) - Liên kết `teams` (Mỗi người thuộc 1 team).
- `career_band_id`: INT (FK) - Liên kết `career_bands`.
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

---

## 3. Quản trị Khung năng lực & Đánh giá (Competency & Assessment)

### 3.1. Bảng `competency_groups` (Nhóm năng lực)

Phân loại năng lực (VD: Cốt lõi, Chuyên môn, Lãnh đạo).

- `id`: INT (PK)
- `name`: VARCHAR (Core Competency, Technical, Leadership)
- `description`: TEXT
- `created_at`: TIMESTAMP

### 3.2. Bảng `competencies` (Từ điển năng lực)

Danh sách các năng lực cụ thể.

- `id`: INT (PK)
- `group_id`: INT (FK) - Liên kết `competency_groups`.
- `name`: VARCHAR (Giải quyết vấn đề, Tư duy logic, ReactJS...)
- `description`: TEXT
- `created_at`: TIMESTAMP

### 3.3. Bảng `competency_levels` (Cấp độ năng lực)

Định nghĩa các mức độ từ 1 đến 5 cho từng năng lực.

- `id`: INT (PK)
- `competency_id`: INT (FK)
- `level_number`: INT (1-5)
- `behavioral_indicator`: TEXT - Hành vi minh chứng cho cấp độ này.
- `created_at`: TIMESTAMP

### 3.4. Bảng `competency_requirements` (Yêu cầu năng lực)

Xác định mức độ (Required Level) tối thiểu cho mỗi Role và Career Band.

- `id`: INT (PK)
- `role_id`: INT (FK)
- `career_band_id`: INT (FK)
- `competency_id`: INT (FK)
- `required_level`: INT (1-5)
- `created_at`: TIMESTAMP

### 3.5. Bảng `assessment_cycles` (Chu kỳ đánh giá)

Quản lý các đợt đánh giá định kỳ.

- `id`: INT (PK)
- `name`: VARCHAR (Đánh giá định kỳ Q1/2024)
- `start_date`: DATE
- `end_date`: DATE
- `status`: ENUM ('DRAFT', 'ACTIVE', 'COMPLETED')
- `created_at`: TIMESTAMP

### 3.6. Bảng `user_assessments` (Kết quả đánh giá tổng hợp)

- `id`: INT (PK)
- `user_id`: INT (FK)
- `cycle_id`: INT (FK)
- `self_score_avg`: FLOAT - Trung bình điểm tự đánh giá.
- `leader_score_avg`: FLOAT - Trung bình điểm quản lý đánh giá.
- `final_score_avg`: FLOAT - Điểm thống nhất cuối cùng.
- `status`: ENUM ('SELF_ASSESSING', 'LEADER_ASSESSING', 'DISCUSSION', 'DONE')
- `feedback`: TEXT
- `created_at`: TIMESTAMP

### 3.7. Bảng `user_assessment_details` (Chi tiết điểm từng năng lực)

- `id`: INT (PK)
- `user_assessment_id`: INT (FK)
- `competency_id`: INT (FK)
- `self_score`: INT (1-5)
- `leader_score`: INT (1-5)
- `final_score`: INT (1-5)
- `gap`: INT - Khoảng cách (Final - Required Level).
- `note`: TEXT

### 3.8. Bảng `individual_development_plans` (Kế hoạch IDP)

- `id`: INT (PK)
- `user_assessment_id`: INT (FK) - IDP được lập dựa trên kết quả đánh giá.
- `user_id`: INT (FK)
- `goal`: TEXT - Mục tiêu phát triển.
- `start_date`: DATE
- `end_date`: DATE
- `status`: ENUM ('IN_PROGRESS', 'COMPLETED', 'CANCELLED')
- `created_at`: TIMESTAMP

### 3.9. Bảng `idp_activities` (Hoạt động phát triển cá nhân)

- `id`: INT (PK)
- `idp_id`: INT (FK)
- `competency_id`: INT (FK) - Năng lực cần cải thiện.
- `activity_type`: ENUM ('TRAINING', 'MENTORING', 'PROJECT_CHALLENGE', 'SELF_STUDY')
- `description`: TEXT
- `evidence`: TEXT - Minh chứng hoàn thành.
- `status`: ENUM ('PENDING', 'DONE')

- `due_date`: DATE

---

## 4. Chấm công & Yêu cầu nghỉ phép (Time & Attendance)

### 4.1. Bảng `attendance_logs` (Nhật ký chấm công)

Ghi nhận thời gian vào/ra của nhân viên.

- `id`: INT (PK)
- `user_id`: INT (FK)
- `check_in_time`: TIMESTAMP
- `check_out_time`: TIMESTAMP
- `date`: DATE
- `status`: ENUM ('ON_TIME', 'LATE', 'EARLY_LEAVE', 'ABSENT')
- `total_hours`: FLOAT
- `created_at`: TIMESTAMP

### 4.2. Bảng `work_requests` (Yêu cầu nghỉ phép/WFH/OT)

- `id`: INT (PK)
- `user_id`: INT (FK)
- `type`: ENUM ('LEAVE', 'WFH', 'LATE', 'EARLY', 'OVERTIME')
- `start_date`: TIMESTAMP
- `end_date`: TIMESTAMP
- `reason`: TEXT
- `approver_id`: INT (FK)
- `status`: ENUM ('PENDING', 'APPROVED', 'REJECTED')
- `created_at`: TIMESTAMP

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

## 5. Mối quan hệ giữa các bảng (Relationships)

- **Users - Career Bands**: N-1 (Nhiều nhân viên thuộc cùng 1 dải cấp bậc).
- **Users - Roles/Teams**: N-1.
- **Users - Profiles**: 1-1.
- **Competency Groups - Competencies**: 1-N.
- **Competencies - Competency Levels**: 1-N (Mỗi năng lực có 5 cấp bậc hành vi).
- **Assessment Cycles - User Assessments**: 1-N.
- **User Assessments - User Assessment Details**: 1-N.
- **User Assessments - IDPs**: 1-1 (Mỗi đợt đánh giá có thể dẫn tới 1 kế hoạch IDP).
- **IDPs - IDP Activities**: 1-N.

- **Phân quyền dữ liệu**: Khi truy vấn, hệ thống cần check `role_id`. Nếu là **Leader**, chỉ được phép query các `users` có cùng `team_id` với mình.

## 6. Kỹ năng & Ngày lễ (Skills & Holidays)

### 6.1. Bảng `master_skills` (Danh sách kỹ năng)

- `id`: INT (PK)
- `name`: VARCHAR - Tên kỹ năng (Java, Leadership...)
- `type`: ENUM ('HARD_SKILL', 'SOFT_SKILL')
- `category`: VARCHAR
- `description`: TEXT

### 6.2. Bảng `skill_levels` (Cấp độ kỹ năng)

- `id`: INT (PK)
- `skill_id`: INT (FK)
- `name`: VARCHAR (Beginner, Intermediate, Advanced...)
- `level_order`: INT

### 6.3. Bảng `user_skills` (Kỹ năng nhân viên)

- `id`: INT (PK)
- `user_id`: INT (FK)
- `skill_id`: INT (FK)
- `level_id`: INT (FK)
- `assessed_at`: DATE
- `note`: TEXT

### 6.4. Bảng `public_holidays` (Ngày lễ chung)

- `id`: INT (PK)
- `date`: DATE
- `name`: VARCHAR
- `country`: VARCHAR
- `is_recurring`: BOOLEAN
