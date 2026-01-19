# CV Builder & PDF Export Specification

## 1. Executive Summary

Tính năng CV Builder cho phép nhân viên tự động tạo CV chuyên nghiệp từ dữ liệu đã nhập trong hệ thống (Profile, Skills, Education, Experience, Achievements). Hệ thống hỗ trợ preview trực tiếp và export PDF chất lượng cao.

## 2. User Stories

### Employee

- **Là một nhân viên**, tôi muốn **xem CV của mình** được tạo tự động từ dữ liệu đã nhập để tiết kiệm thời gian.
- **Là một nhân viên**, tôi muốn **export CV thành PDF** để gửi cho nhà tuyển dụng hoặc lưu trữ.
- **Là một nhân viên**, tôi muốn **thấy warning nếu thiếu thông tin** để biết cần bổ sung gì.
- **Là một nhân viên**, tôi muốn **chỉnh sửa summary/objective** ngắn gọn về bản thân.

### Future (Phase 2)

- Chọn template khác nhau (Modern, Classic, Minimalist).
- Tùy chỉnh màu sắc, font chữ.
- Share CV link công khai.

## 3. Database Design

### 3.1. Schema Updates

**Add field to `profiles` table**:

```sql
ALTER TABLE profiles ADD COLUMN summary TEXT;
```

- `summary`: Đoạn giới thiệu ngắn về bản thân (1-3 câu).

### 3.2. Existing Tables Used

- `profiles`: Basic info (name, email, phone, dob, address, avatar).
- `user_skills` + `master_skills`: Technical & soft skills.
- `education_experience`: Education & Work history.
- `achievements`: Awards, Certifications.

## 4. API Design

### 4.1. Get CV Data

- **Endpoint**: `POST /api/server/cv/get-data`
- **Params**: `{ userId?: number }` (Optional, default current user)
- **Response**:

```json
{
  "success": true,
  "data": {
    "profile": { ... },
    "skills": [ ... ],
    "education": [ ... ],
    "experience": [ ... ],
    "achievements": [ ... ]
  }
}
```

### 4.2. Update Profile Summary

- **Endpoint**: `POST /api/server/profile/update-summary`
- **Payload**: `{ summary: string }`
- **Response**: `{ success: true }`

## 5. UI Components

### 5.1. CV Preview Page (`/my-cv`)

- **Header**: Title + Export PDF button.
- **CV Preview Section**: Render CV template với data thực.
- **Edit Summary Dialog**: Cho phép sửa summary nhanh.

### 5.2. CV Template Component

**Sections** (theo thứ tự):

1. **Header**: Avatar (optional) + Name + Contact Info.
2. **Summary**: 1-3 câu giới thiệu.
3. **Skills**: Grouped by type (Hard/Soft), show level.
4. **Experience**: Work history (reverse chronological).
5. **Education**: Academic background.
6. **Achievements**: Awards, Certifications.

### 5.3. PDF Export

- Use `@react-pdf/renderer`.
- Separate component: `CVPDFDocument.tsx`.
- Trigger download via `pdf(document).toBlob()`.

## 6. Implementation Plan

### Phase 1: Core Features (MVP)

**Step 1**: Database Migration

- Add `summary` field to `profiles`.

**Step 2**: Backend API

- `src/server/cv.impl.ts`: Logic to aggregate CV data.
- `src/server/cv.server.ts`: Server function wrappers.

**Step 3**: Frontend - CV Preview

- Route: `/my-cv`.
- Component: `CVPreview` (HTML/CSS version).

**Step 4**: PDF Export

- Install `@react-pdf/renderer`.
- Component: `CVPDFDocument` (PDF version).
- Button: "Download PDF".

**Step 5**: Edit Summary

- Dialog to update `profile.summary`.

### Phase 2: Enhancements (Future)

- Multiple templates.
- Customization (colors, fonts).
- Public CV link.

## 7. Tech Stack

### Libraries

- **`@react-pdf/renderer`**: PDF generation from React components.
- **`file-saver`**: Trigger file download in browser.
- **`date-fns`**: Date formatting.

### Styling

- Tailwind CSS for web preview.
- `@react-pdf` built-in styling for PDF.

## 8. Hidden Requirements

### 8.1. Data Completeness Check

- If `profile` is incomplete -> Show banner: "Complete your profile first".
- If no `skills` -> Suggest: "Add skills to make your CV stand out".

### 8.2. Avatar Handling

- If `avatarUrl` exists -> Fetch and convert to Base64 for PDF embedding.
- If no avatar -> Use placeholder or skip.

### 8.3. Date Formatting

- Education/Experience dates: `MM/YYYY - MM/YYYY` or `MM/YYYY - Present`.

### 8.4. Empty States

- If user has no data in a section -> Show "No [section] added yet" in preview.

### 8.5. Loading & Error States

- PDF generation: Show spinner + "Generating PDF...".
- If error -> Toast: "Failed to generate PDF. Please try again."

## 9. Security & Privacy

### 9.1. Access Control

- User can only view/export their own CV.
- Admin/HR can view any user's CV (for internal purposes).

### 9.2. Data Validation

- Sanitize `summary` input (prevent XSS).
- Validate PDF generation (prevent malicious data injection).

## 10. Build Checklist

- [ ] Database migration: Add `summary` to `profiles`.
- [ ] Backend: `cv.impl.ts` + `cv.server.ts`.
- [ ] Frontend: `/my-cv` route.
- [ ] Component: `CVPreview` (web version).
- [ ] Component: `CVPDFDocument` (PDF version).
- [ ] Component: `EditSummaryDialog`.
- [ ] Install: `@react-pdf/renderer`, `file-saver`.
- [ ] Test: PDF export quality.
- [ ] Test: Empty states, error handling.
- [ ] Navigation: Add "My CV" to menu.
