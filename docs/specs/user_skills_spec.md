# User Skills Management Specification

## 1. Executive Summary

Tính năng cho phép nhân viên tự quản lý hồ sơ kỹ năng (Stack/Skills) của mình. Đây là dữ liệu nền tảng cho việc tạo CV tự động, đánh giá năng lực và quy hoạch phát triển nhân sự.

## 2. User Stories

### Employee

- **Là một nhân viên**, tôi muốn **tìm kiếm và chọn kỹ năng** từ danh sách có sẵn để thêm vào hồ sơ của mình.
- **Là một nhân viên**, tôi muốn **đánh giá trình độ** của mình cho từng kỹ năng (ví dụ: Beginner, Intermediate, Expert) để thể hiện rõ năng lực.
- **Là một nhân viên**, tôi muốn **xem biểu đồ radar** về năng lực của mình để nhận biết điểm mạnh/yếu.
- **Là một nhân viên**, tôi muốn **xóa kỹ năng** không còn phù hợp khỏi hồ sơ.

### Admin/HR (Future)

- **Là Admin**, tôi muốn **quản lý danh sách Master Skills** để đảm bảo dữ liệu chuẩn hóa (tránh trùng lặp như "ReactJS", "React.js", "React JS").

## 3. Database Design (Existing)

Hệ thống sử dụng các bảng đã có trong `schema.ts`:

- **master_skills**: `id`, `name`, `type` (HARD/SOFT), `category`.
- **skill_levels**: `id`, `skill_id` (FK), `name`, `levelOrder`.
  - _Note_: Hiện tại `skill_levels` đang link 1-n với `master_skills`. Điều này có nghĩa mỗi skill phải định nghĩa bộ level riêng? Hay nên dùng bộ level chung (Global Levels)?
  - _Recommendation_: Để đơn giản cho MVP Phase 1, ta nên dùng **Global Levels** (1 bộ level chung cho tất cả skill) nếu có thể, hoặc seed data cho từng skill một cách tự động. Tuy nhiên, schema hiện tại ràng buộc level theo skill. Ta sẽ tuân thủ schema hiện tại.

- **user_skills**: `id`, `userId`, `skillId`, `levelId`, `note`.

## 4. API Design

### 4.1. Get Master Skills & Levels

- **Endpoint**: `POST /api/server/skills/get-master`
- **Params**: `{ match?: string, type?: 'HARD_SKILL' | 'SOFT_SKILL' }`
- **Response**: List of `master_skills` with their associated `skill_levels`.

### 4.2. Get User Skills

- **Endpoint**: `POST /api/server/skills/get-user-skills`
- **Params**: `{ userId?: number }` (Optional, default current user)
- **Response**: List of `user_skills` enriched with master skill name and level info.

### 4.3. Upsert User Skill

- **Endpoint**: `POST /api/server/skills/upsert`
- **Payload**:
  ```json
  {
    "skillId": 123,
    "levelId": 456,
    "note": "Optional note"
  }
  ```
- **Logic**: Nếu user đã có skill này -> Update level. Nếu chưa -> Insert.

### 4.4. Delete User Skill

- **Endpoint**: `POST /api/server/skills/delete`
- **Payload**: `{ id: number }` (UserSkill ID)

## 5. UI Components

### 5.1. Skill Management Page (`/my-profile/skills` or `/competencies/skills`)

- **Header**: Stats summary (Total Skills, Top Strength).
- **Chart Section**: Radar Chart use `recharts`.
- **Skill Groups**: 2 cột hoặc Tabs (Hard Skills vs Soft Skills).
- **Add Skill Button**: Mở Dialog chọn skill.

### 5.2. Add/Edit Skill Dialog

- **Combobox**: Search `master_skills` (client-side filtering hoặc server-side search).
- **Level Select**: Radio group hoặc Slider chọn Level.
- **Note Input**: Textarea.

## 6. Implementation Plan

### Step 1: Seeding Data (CRITICAL)

- Tạo script `seed-skills.ts`.
- Seed 20+ common Hard Skills (React, Node, SQL...) và 10+ Soft Skills.
- Seed Levels cho mỗi skill (1: Beginner, 2: Intermediate, 3: Advanced, 4: Expert, 5: Master).

### Step 2: Backend Implementation

- Tạo `src/server/skills.impl.ts` và `src/server/skills.server.ts`.
- Implement CRUD functions.

### Step 3: Frontend Implementation

- Route: `/competencies/my-skills`.
- Components: `SkillRadarChart`, `SkillList`, `SkillDialog`.

### Step 4: Integration & Polish

- Connect API.
- Add Loading skeletons.
- Error handling.
