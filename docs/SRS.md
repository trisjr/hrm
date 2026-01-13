# Software Requirements Specification (SRS)

## 1. Chức năng hệ thống (Functional Requirements)

### 1.1 Phân hệ Người dùng [cite: 1, 2]

- **F1**: Đăng ký/Đăng nhập/Quên mật khẩu.
- **F2**: Quản lý thông tin định danh (CCCD, mã cán bộ, đơn vị công tác).
- **F3**: Quản lý hồ sơ chuyên môn (Tải lên/Tải về CV PDF/DOC).
- **F4**: Cập nhật kỹ năng, thành tích, khen thưởng và kỷ luật.
- **F12**: Checkin/Checkout hàng ngày.
- **F13**: Gửi yêu cầu nghỉ phép/WFH (Request Off/WFH).

### 1.2 Phân hệ Admin & Leader [cite: 3, 4]

- **F5**: Quản lý danh sách nhân viên theo Team.
- **F6**: Phân quyền (Admin, Leader, Dev).
- **F7**: Theo dõi biến động nhân sự (Chuyển team, nghỉ việc).
- **F8**: Thống kê và lọc nâng cao theo tiêu chí chuyên môn.
- **F9**: Quản lý Email Templates (Thêm, xóa, sửa mẫu email).
- **F10**: Gửi Email (Gửi hàng loạt hoặc gửi cá nhân từ hệ thống).
- **F11**: Phê duyệt yêu cầu cập nhật hồ sơ từ nhân viên.
- **F14**: Phê duyệt yêu cầu nghỉ phép/WFH (Phân quyền: Leader duyệt Member, Admin/HR duyệt Leader).

### 1.3 Quản trị Khung năng lực (Competency Management)

- **F15**: Quản lý Từ điển năng lực (Nhóm năng lực, Năng lực, Hành vi minh chứng).
- **F16**: Thiết lập Career Band (Band 0-4) và định nghĩa yêu cầu năng lực cho từng Role/Level.
- **F17**: Tạo và quản lý Chu kỳ đánh giá (Assessment Cycles).
- **F18**: Thực hiện Đánh giá đa chiều (Tự đánh giá, Quản lý đánh giá, Chốt điểm Final score).
- **F19**: Dashboard phân tích khoảng cách năng lực (Gap Analysis).
- **F20**: Quản lý Kế hoạch phát triển cá nhân (IDP) - Đăng ký khóa học, mentor, dự án thử thách.
- **F21**: Theo dõi lộ trình thăng tiến (Career Roadmap) và điều kiện thăng cấp.
- **F22**: Cảnh báo nhân sự đủ điều kiện thăng cấp dựa trên điểm năng lực.

## 2. Yêu cầu phi chức năng (Non-functional Requirements)

- **Bảo mật**: Xác thực tài khoản qua Email/SMS.
- **Hiệu năng**: Tìm kiếm và lọc hồ sơ phải phản hồi dưới 2 giây.
