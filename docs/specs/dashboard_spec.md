# Dashboard Specification

## 1. Executive Summary

Xây dựng màn hình Dashboard trung tâm, cung cấp cái nhìn tổng quan được cá nhân hóa cho từng vai trò (Employee, Leader, Admin/HR). Dashboard tập trung vào các thông tin "Actionable" (cần xử lý ngay) và "Informational" (thông tin trong ngày/tháng).

## 2. User Stories

### Employee (All Roles)

- **Là nhân viên**, tôi muốn xem **tình trạng làm việc hôm nay** (WFH/Office) để xác nhận hệ thống đã ghi nhận đúng.
- **Là nhân viên**, tôi muốn xem **số ngày nghỉ/WFH đã dùng** trong tháng để quản lý quỹ thời gian.
- **Là nhân viên**, tôi muốn xem **trạng thái các yêu cầu** (Leave/WFH) mình đã gửi.
- **Là nhân viên**, tôi muốn biết **ngày lễ sắp tới** là gì.

### Leader

- **Là Leader**, tôi muốn biết **hôm nay ai trong team vắng mặt** để phân bổ công việc.
- **Là Leader**, tôi muốn thấy danh sách **Request cần duyệt** ngay trên dashboard.

### Admin/HR

- **Là HR**, tôi muốn xem **tổng số nhân sự** và biến động nhân sự mới.

## 3. API Design

### 3.1. Dashboard Stats API

- **Endpoint**: `POST /api/server/dashboard/stats`
- **Params**: `{ token: string }`
- **Response Structure**:
  ```json
  {
    "user": { ...basicProfile },
    "role": "DEV" | "LEADER" | "ADMIN",
    "stats": {
       "leaveTakenMonth": 2,
       "wfhTakenMonth": 5,
       "totalSkills": 12,
       "pendingMyRequests": 1
    },
    "todayStatus": {
       "status": "WORKING" | "LEAVE" | "WFH",
       "request": { ...detail }
    },
    "upcomingHolidays": [ ...next 2 holidays ],
    // Leader/Admin Only
    "teamStats": {
       "totalMembers": 10,
       "absentToday": [ ...users ],
       "wfhToday": [ ...users ],
       "pendingApprovalsCount": 3
    }
  }
  ```

## 4. UI Design (Component Hierarchy)

### 4.1. Layout Grid

Dùng CSS Grid hoặc Flexbox chia layout:

- **Header**: Welcome Message + Quick Actions (Create Request).
- **Top Row (KPI Cards)**: 3-4 Cards (Leave Taken, WFH, Team Present (Leader), Pending Approvals (Leader)).
- **Main Section (Left 2/3)**:
  - **Chart**: Work Trend (Optional - Phase 2) or Quick Access Grid.
  - **My Request Status**: List of recent requests.
- **Sidebar Section (Right 1/3)**:
  - **Who's Off Today?** (Leader view) or **My Skills Summary** (Employee view).
  - **Upcoming Holidays**.

### 4.2. Components

1.  **`StatCard`**: (Icon, Label, Value, Trend/Description).
2.  **`WelcomeBanner`**: (Greeting, Date, Quote).
3.  **`RequestListWidget`**: Compact list of requests.
4.  **`TeamStatusWidget`**: List users with status indicators.
5.  **`HolidayWidget`**: Simple list card.

## 5. Implementation Plan

### Step 1: Backend (`dashboard.impl.ts`)

- Aggregate data queries:
  - Count Leave/WFH requests in current month.
  - Identify today's status based on Date ranges.
  - Fetch next holidays.
  - (Leader) Query team members' requests intersecting today.

### Step 2: Backend Wrappers (`dashboard.server.ts`)

- Standard server function wrapper.

### Step 3: Frontend (`routes/index.tsx`)

- Thay thế trang Home hiện tại.
- Integrate `StatsCards`.
- Integrate `Widgets`.

## 6. Hidden Requirements

- **Performance**: Dashboard load phải nhanh (<1s). Tối ưu query, không select `*` dư thừa.
- **Empty States**: Xử lý trường hợp chưa có dữ liệu (New user).
- **Timezone**: Xử lý cẩn thận `today` status theo server time vs client time. (MVP: Server time).

## 7. Tech Stack

- **Icons**: Lucide React / Tabler Icons.
- **Charts**: Recharts (nếu cần).
- **Components**: Shadcn/ui (Card, Badge, Avatar).
