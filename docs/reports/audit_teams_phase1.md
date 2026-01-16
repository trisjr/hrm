# Audit Report - Teams Management Phase 1

## Summary

- 🔴 Critical Issues: 0
- 🟡 Warnings: 2
- 🟢 Suggestions: 3

## 🟡 Warnings (Potential Issues)

1. **N+1 Query Potential in `getTeamsFn`**
   - **File:** `src/server/teams.server.ts`
   - **Mô tả:** Mặc dù đã optimize bằng cách fetch member counts riêng, nhưng việc join `users` và `profiles` trong vòng lặp hoặc query lớn có thể gây chậm nếu không đánh index.
   - **Cách sửa:** Đảm bảo database indexes cho columns `teamId`, `leaderId`, `deletedAt` đã được tạo.

2. **Incomplete Email Notification Implementation**
   - **File:** `src/server/teams.server.ts`
   - **Mô tả:** Code logic gửi email đang được đánh dấu bằng `TODO`. Tính năng chưa hoàn thiện.
   - **Cách sửa:** Cần implement ngay trong Phase 6 như kế hoạch.

## 🟢 Suggestions (Cải thiện)

1. **Transaction Wrapping**
   - **File:** `src/server/teams.server.ts`
   - **Mô tả:** Các thao tác delete team hoặc update leader nên được bọc trong database transaction để đảm bảo tính toàn vẹn dữ liệu (nếu 1 bước fail thì rollback tất cả).
   - **Ví dụ:** `await db.transaction(async (tx) => { ... })`

2. **Strict Type Safety for Drizzle Joins**
   - **File:** `src/server/teams.server.ts`
   - **Mô tả:** Drizzle ORM trả về type có thể null, hiện tại đang dùng tính năng non-null assertion `!` ở một số chỗ.
   - **Cách sửa:** Kiểm tra `null` an toàn hơn (Safe parsing).

3. **Performance Optimization for Stats**
   - **File:** `src/server/teams.server.ts` (getTeamByIdFn)
   - **Mô tả:** Việc tính toán `avgAttendance` realtime trên dữ liệu lớn có thể chậm.
   - **Cách sửa:** Cân nhắc cache kết quả hoặc tính định kỳ (batch job).

## Next Steps

- Implement Transaction support cho critical actions.
- Hoàn thiện phần Email Notification.
