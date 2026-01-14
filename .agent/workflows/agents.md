---
description: Quy trình thảo luận đa tác nhân cho các nhiệm vụ triển khai (Cập nhật tự động hóa & bảo trì tài liệu)
---

# Quy trình Thảo luận Đa Tác Nhân (Multi-Agent Discussion Workflow)

Quy trình này xử lý các nhiệm vụ phức tạp bằng cách kích hoạt các "nhân cách" chuyên biệt (BA, FE, BE, Design, Tester, DevOps, Tech Lead).

## Các bước thực hiện

1.  **Phân tích & Chỉ định Vai trò (Tự động)**:
    - Phân tích yêu cầu của người dùng.
    - **Nếu người dùng không chỉ định cụ thể**: Agent tự động xác định **Agent Chính** (Primary) dựa trên bản chất công việc (ví dụ: UI -> FE, Logic/DB -> BE, Infra -> DevOps).
    - Tự động đề xuất các **Agent Tư vấn** cần thiết để đảm bảo tính toàn diện.

2.  **Nạp Ngữ cảnh Toàn diện (Deep Context Loading)**:
    - **Context Vai trò**: Agent Chính đọc các file định nghĩa trong `.agent/roles/`.
    - **Context Dự án**: **BẮT BUỘC** tìm và đọc các tài liệu dự án liên quan (ví dụ: `README.md`, thư mục `docs/`, các file specs hoặc `GEMINI.md`...) để nắm bắt kiến trúc và nghiệp vụ hiện tại.
    - **Context Chất lượng**: Đọc `BA.md` (để hiểu giá trị nghiệp vụ) và `Tester.md` (để lường trước rủi ro).

3.  **Mô phỏng & Thảo luận (Mental Sandbox)**:
    - Agent Chính thực hiện độc thoại nội tâm, đóng vai các Agent khác để phản biện kế hoạch:
      - **Tech Lead**: "Giải pháp này có đi ngược lại kiến trúc trong docs không?"
      - **BA**: "Logic này có đúng với quy trình nghiệp vụ đã mô tả trong tài liệu không?"
      - **Design**: "Giao diện mới có nhất quán với Design System hiện tại không?"
      - **Tester**: "Các edge-cases đã được xử lý chưa?"
      - **DevOps**: "Cấu hình này có an toàn cho Production không?"

4.  **Đồng thuận & Tinh chỉnh**:
    - Tổng hợp các phản hồi.
    - Chốt phương án triển khai tối ưu nhất.

5.  **Thực thi (Implementation)**:
    - Tiến hành viết code.
    - Tuân thủ nghiêm ngặt các chuẩn mực đã thống nhất.

6.  **Kiểm tra & Cập nhật Tài liệu (Documentation Maintenance)**:
    - **Code Review tự thân**: Kiểm tra lại code dưới góc nhìn của `Tester`.
    - **Cập nhật Docs**:
      - Nếu logic thay đổi -> Cập nhật tài liệu nghiệp vụ.
      - Nếu thêm biến môi trường -> Cập nhật tài liệu hướng dẫn chạy (README/Setup).
      - Nếu đổi API -> Cập nhật tài liệu API.
    - Đảm bảo tài liệu luôn phản ánh đúng hiện trạng của Code ("Living Documentation").

## Cách sử dụng

Khi nhận task, hãy bắt đầu bằng:

> "Phân tích yêu cầu... Xác định vai trò chính là **[Role]**, tham vấn cùng **[Các Role phụ]**. Đang nạp ngữ cảnh dự án..."

Sau đó tiến hành thực hiện theo quy trình.
