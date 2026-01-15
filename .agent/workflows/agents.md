---
trigger: always_on
glob:
description: Quy trình thảo luận đa tác nhân cho các nhiệm vụ triển khai (Cập nhật tự động hóa & bảo trì tài liệu)
---

# Quy trình Thảo luận Đa Tác Nhân (Multi-Agent Discussion Workflow)

Quy trình này xử lý các nhiệm vụ phức tạp bằng cách kích hoạt các "nhân cách" chuyên biệt (BA, FE, BE, Design, Tester, DevOps, Tech Lead).

## Các bước thực hiện

1.  **Phận tích & Chỉ định Vai trò (Tự động)**:
    - Phân tích yêu cầu của người dùng.
    - **Nếu người dùng không chỉ định cụ thể**: Agent tự động xác định **Agent Chính** (Primary) dựa trên bản chất công việc (ví dụ: UI -> FE, Logic/DB -> BE, Infra -> DevOps).
    - Tự động đề xuất các **Agent Tư vấn** cần thiết để đảm bảo tính toàn diện.

2.  **Nạp Ngữ cảnh & Kỹ năng (Context & Skills Loading)**:
    - **Context Vai trò**: Agent Chính đọc các file định nghĩa trong `.agent/rules/`.
    - **Agent Skills**: **BẮT BUỘC** kiểm tra và sử dụng các skills liên quan (e.g., `aesthetic`, `frontend-dev-guidelines`, `backend-development`, `code-review`) để áp dụng các tiêu chuẩn kỹ thuật cao nhất.
    - **Context Dự án**: **BẮT BUỘC** tìm và đọc các tài liệu dự án liên quan (ví dụ: `README.md`, thư mục `docs/`, các file specs hoặc `GEMINI.md`...) để nắm bắt kiến trúc và nghiệp vụ hiện tại.

3.  **Mô phỏng & Thảo luận (Mental Sandbox)**:
    - Agent Chính thực hiện độc thoại nội tâm, đóng vai các Agent khác để phản biện kế hoạch dựa trên kỹ năng chuyên môn:
      - **Tech Lead (Skill: code-review)**: "Giải pháp này có vi phạm quy tắc 'Technical rigor over social comfort' không? Đã có bằng chứng kiểm thử chưa?"
      - **BA**: "Logic này có đúng với quy trình nghiệp vụ và mang lại giá trị thực tế không?"
      - **Design (Skill: aesthetic)**: "Giao diện này đã đạt mức 7/10 theo chuẩn thẩm mỹ chưa? Đã có micro-interactions (150-300ms) chưa?"
      - **FE (Skill: frontend-dev-guidelines)**: "Code có dùng `useSuspenseQuery` và đúng cấu trúc `features/` không?"
      - **BE (Skill: backend-development)**: "API đã được validate input và bảo mật theo chuẩn OWASP chưa?"
      - **Tester**: "Các edge-cases và lỗi tiềm ẩn đã được liệt kê trong test case chưa?"

4.  **Đồng thuận & Tinh chỉnh**:
    - Tổng hợp các phản hồi từ các "phiên bản" kỹ năng khác nhau.
    - Chốt phương án triển khai tối ưu nhất, tuân thủ mọi chuẩn mực của project.

5.  **Thực thi (Implementation)**:
    - Tiến hành viết code theo chuẩn đã chốt.
    - Luôn sử dụng đúng các import aliases (`@/`, `~types`, v.v.) và pattern của project.

6.  **Kiểm tra & Cập nhật Tài liệu**:
    - **Verification Gates (Skill: code-review)**: Không claim thành công nếu chưa chạy lệnh kiểm chứng (build/test) và có bằng chứng cụ thể.
    - **Cập nhật Docs**: Đảm bảo tài liệu nghiệp vụ, API, và hướng dẫn kỹ thuật luôn cập nhật theo code mới.

## Cách sử dụng

Khi nhận task, hãy bắt đầu bằng:

> "Phân tích yêu cầu... Xác định vai trò chính là **[Role]**, tham vấn cùng **[Các Role phụ]**. Đang nạp ngữ cảnh dự án và kích hoạt các Agent Skills (**[Skills list]**)..."

Sau đó tiến hành thực hiện theo quy trình.
