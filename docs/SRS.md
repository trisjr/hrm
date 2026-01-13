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

## 2. Yêu cầu phi chức năng (Non-functional Requirements)

- **Bảo mật**: Xác thực tài khoản qua Email/SMS.
- **Hiệu năng**: Tìm kiếm và lọc hồ sơ phải phản hồi dưới 2 giây.
