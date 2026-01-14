# Users API Documentation

## Overview

API quản lý người dùng (Users) trong hệ thống HRM. API này xử lý CRUD operations cho users, bao gồm quản lý profile và xác thực tài khoản qua email.

## Key Features

- ✅ CRUD operations cho User với Profile
- ✅ Email verification workflow
- ✅ Soft delete (không xóa vĩnh viễn)
- ✅ Pagination & Filtering
- ✅ Transaction safety cho data integrity
- ✅ Response luôn bao gồm Profile data

## API Endpoints

### 1. Create User

**Endpoint:** `POST /api/users`

**Mô tả:** Tạo tài khoản người dùng mới với status INACTIVE. User cần verify email để active.

**Request Body:**

```typescript
{
  employeeCode: string      // Mã nhân viên (A-Z, 0-9, viết HOA)
  email: string             // Email công ty
  phone?: string            // Số điện thoại (optional)
  password: string          // Mật khẩu (min 8 ký tự, có chữ hoa+thường+số)
  roleId?: number           // ID vai trò (optional)
  teamId?: number           // ID team (optional)
  careerBandId?: number     // ID cấp bậc (optional)
  profile: {
    fullName: string        // Họ tên (required)
    dob?: string            // Ngày sinh (YYYY-MM-DD)
    gender?: string         // Giới tính
    idCardNumber?: string   // CCCD/CMND
    address?: string        // Địa chỉ
    joinDate?: string       // Ngày vào công ty
    unionJoinDate?: string  // Ngày vào công đoàn
    unionPosition?: string  // Chức vụ công đoàn
    avatarUrl?: string      // URL avatar
  }
}
```

**Response:**

```typescript
{
  user: {
    id: number
    employeeCode: string
    email: string
    phone: string | null
    roleId: number | null
    teamId: number | null
    careerBandId: number | null
    status: "INACTIVE"      // Mặc định INACTIVE
    createdAt: Date
    updatedAt: Date
    profile: {
      fullName: string
      dob: string | null
      gender: string | null
      // ... other profile fields
    }
  },
  verifyToken: string        // Token để verify (dùng cho gửi email)
}
```

**Business Logic:**

1. Validate dữ liệu đầu vào (employeeCode viết hoa, email unique, password strong)
2. Check email & employeeCode đã tồn tại chưa
3. Hash password
4. **Transaction:**
   - Insert user với status = 'INACTIVE'
   - Insert profile liên kết với user
   - Generate verification token (UUID)
   - Insert token vào `verification_tokens` (type='ACTIVATION', expires in 24h)
5. Return user data + verifyToken

**Errors:**

- `Email đã tồn tại trong hệ thống`
- `Mã nhân viên đã tồn tại trong hệ thống`
- Validation errors (email không hợp lệ, password yếu, v.v.)

---

### 2. List Users

**Endpoint:** `GET /api/users`

**Mô tả:** Lấy danh sách users với pagination và filtering.

**Query Parameters:**

```typescript
{
  page?: number             // Trang hiện tại (default: 1)
  limit?: number            // Số user mỗi trang (default: 10, max: 100)
  status?: string           // Filter theo status (ACTIVE, INACTIVE, ON_LEAVED, RETIRED)
  teamId?: number           // Filter theo team
  roleId?: number           // Filter theo role
  search?: string           // Tìm kiếm (email, employeeCode, fullName)
}
```

**Response:**

```typescript
{
  users: [
    {
      id: number
      employeeCode: string
      email: string
      phone: string | null
      roleId: number | null
      teamId: number | null
      careerBandId: number | null
      status: string
      createdAt: Date
      updatedAt: Date
      profile: {
        fullName: string
        // ... other profile fields
      },
      role: { id, roleName, description },      // Populated
      team: { id, teamName, description },      // Populated
      careerBand: { id, bandName, title }       // Populated
    },
    // ... more users
  ],
  pagination: {
    page: number
    limit: number
    total: number           // Tổng số users
    totalPages: number      // Tổng số trang
  }
}
```

**Business Logic:**

1. Parse query params
2. Build WHERE conditions (filter by status, team, role, search)
3. Count total records
4. Fetch users với pagination & relations (profile, role, team, careerBand)
5. Transform response (loại bỏ passwordHash, deletedAt)

---

### 3. Get User by ID

**Endpoint:** `GET /api/users/:id`

**Mô tả:** Lấy thông tin chi tiết một user kèm profile.

**Path Parameters:**

- `id`: User ID (number)

**Response:**

```typescript
{
  user: {
    id: number
    employeeCode: string
    email: string
    // ... all user fields
    profile: {
      fullName: string
      // ... all profile fields
    },
    role: { ... },
    team: { ... },
    careerBand: { ... }
  }
}
```

**Errors:**

- `Không tìm thấy người dùng` (user not found hoặc đã bị xóa)

---

### 4. Update User

**Endpoint:** `POST /api/users/:id` (Method POST vì limitation của createServerFn)

**Mô tả:** Cập nhật thông tin user và/hoặc profile.

**Request Body:**

```typescript
{
  id: string                // User ID trong body hoặc path
  email?: string            // Optional fields để update
  phone?: string
  roleId?: number
  teamId?: number
  careerBandId?: number
  status?: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVED' | 'RETIRED'
  profile?: {
    fullName?: string
    dob?: string
    // ... any profile fields (partial update)
  }
}
```

**Response:** Same as Get User by ID

**Business Logic:**

1. Validate user exists và chưa bị xóa
2. Nếu update email, check uniqueness (trừ email hiện tại)
3. **Transaction:**
   - Update user table (nếu có user fields)
   - Update profile table (nếu có profile fields)
4. Fetch full user data with relations
5. Return updated user

**Errors:**

- `Không tìm thấy người dùng`
- `Email đã tồn tại trong hệ thống`

---

### 5. Delete User

**Endpoint:** `POST /api/users/:id/delete` (Or POST with action=delete)

**Mô tả:** Soft delete user (set deletedAt timestamp).

**Request Body:**

```typescript
{
  id: string // User ID
}
```

**Response:**

```typescript
{
  success: true,
  message: "Xóa người dùng thành công"
}
```

**Business Logic:**

1. Check user exists và chưa bị xóa
2. Set `deletedAt = now()`, `updatedAt = now()`
3. Return success message

**Lưu ý:** Đây là soft delete, data vẫn tồn tại trong DB nhưng bị filter ra khỏi queries thông thường.

---

### 6. Verify Account

**Endpoint:** `POST /api/users/verify`

**Mô tả:** Xác thực tài khoản user qua token từ email.

**Request Body:**

```typescript
{
  token: string // UUID token từ email
}
```

**Response:**

```typescript
{
  success: true,
  message: "Xác thực tài khoản thành công. Bạn có thể đăng nhập ngay bây giờ.",
  alreadyVerified: false    // true nếu user đã verify trước đó
}
```

**Business Logic:**

1. Find token in `verification_tokens`:
   - token = input token
   - type = 'ACTIVATION'
   - deletedAt IS NULL
   - expiresAt > NOW()
2. Validate token exists
3. Validate user exists và chưa bị xóa
4. Check if user đã ACTIVE (return success với alreadyVerified=true)
5. **Transaction:**
   - Update user status: INACTIVE → ACTIVE
   - Soft delete token (set deletedAt = now)
6. Return success message

**Errors:**

- `Token không hợp lệ hoặc đã hết hạn`
- `Tài khoản không tồn tại`

---

### 7. Resend Verification Email

**Endpoint:** `POST /api/users/resend-verification`

**Mô tả:** Gửi lại email xác thực (tạo token mới).

**Request Body:**

```typescript
{
  email: string // Email của user
}
```

**Response:**

```typescript
{
  success: true,
  message: "Đã gửi lại email xác thực, vui lòng kiểm tra hộp thư"
}
```

**Business Logic:**

1. Find user by email (không tiết lộ user có tồn tại hay không - security)
2. Return generic success nếu không tìm thấy
3. Check if user đã ACTIVE (throw error)
4. **Transaction:**
   - Soft delete tất cả ACTIVATION tokens cũ
   - Generate token mới (UUID)
   - Insert token mới (expires in 24h)
5. Return success (FE sẽ trigger gửi email thực tế)

**Errors:**

- `Tài khoản đã được xác thực, vui lòng đăng nhập`

---

## Security & Validation

### Input Validation (Zod Schemas)

- **employeeCode:** Chỉ chữ in HOA và số (`/^[A-Z0-9]+$/`)
- **email:** Valid email format
- **password:** Min 8 ký tự, có chữ hoa, chữ thường, và số
- **pagination:** page >= 1, limit: 1-100

### Data Protection

- ❌ Không bao giờ trả `passwordHash` về client
- ❌ Không bao giờ trả `deletedAt` về client
- ✅ Luôn filter `deletedAt IS NULL` khi query
- ✅ Hash password với bcrypt (từ `auth.utils`)
- ✅ Token expiration (24h cho ACTIVATION)

### Transaction Safety

Tất cả operations có nhiều bước (create user+profile, verify+update status) đều được wrap trong transaction để đảm bảo data consistency.

---

## Integration với Login Flow

### Login Blocking cho INACTIVE Users

File: `/src/server/auth.server.ts`

```typescript
// Trong loginFn
if (user.status === 'INACTIVE') {
  throw new Error(
    'Tài khoản chưa được xác thực. Vui lòng kiểm tra email để kích hoạt tài khoản.',
  )
}
```

FE có thể catch error này và hiển thị toast với option "Gửi lại email xác thực".

---

## Frontend Integration

### Verify Page

Route: `/verify?token=xxx`

File: `/src/routes/verify.tsx`

**States:**

- Loading: Đang xác thực...
- Success: Hiển thị icon success + countdown redirect (5s) → `/login`
- Error: Hiển thị error + button "Thử lại" + "Quay lại đăng nhập"

**Auto-behavior:**

- Auto verify on mount
- Auto redirect sau 5s khi success
- Button "Đăng nhập ngay" để skip countdown

---

## Database Schema

### Tables Involved

```sql
-- Users
users (
  id, employee_code, email, phone, password_hash,
  role_id, team_id, career_band_id, status,
  created_at, updated_at, deleted_at
)

-- Profiles (1-1 with users)
profiles (
  id, user_id, full_name, dob, gender, id_card_number,
  address, join_date, union_join_date, union_position,
  avatar_url, created_at, updated_at, deleted_at
)

-- Verification Tokens
verification_tokens (
  id, user_id, token, type, expires_at,
  created_at, updated_at, deleted_at
)
```

---

## Testing Scenarios

### Happy Path

1. Create user → status=INACTIVE, token generated
2. Verify với token → status=ACTIVE
3. Login → success
4. List users → user hiển thị với profile
5. Update user → thông tin cập nhật
6. Delete user → soft delete

### Edge Cases

1. Create user với email trùng → error
2. Verify với token expired → error
3. Verify với token đã dùng (deletedAt != null) → error
4. Login với user INACTIVE → error với message yêu cầu verify
5. Resend verification cho user đã ACTIVE → error
6. Update user dengan email trùng người khác → error
7. Concurrent verify requests → chỉ 1 request thành công

### Error Handling

- Invalid token format
- User đã bị xóa nhưng token còn
- Token type sai (RESET_PASSWORD thay vì ACTIVATION)
- Profile thiếu khi tạo user (transaction rollback)

---

## TODO / Future Improvements

- [ ] Implement actual email sending (integration với email service)
- [ ] Add rate limiting cho resend verification
- [ ] Add audit log cho user updates
- [ ] Implement user search với full-text search
- [ ] Add bulk operations (bulk create, bulk update status)
- [ ] Implement user export (CSV, Excel)
- [ ] Add avatar upload functionality
- [ ] Implement password reset flow (similar to verify)

---

## Related Files

- **Types:** `/src/lib/user.types.ts`
- **Schemas:** `/src/lib/user.schemas.ts`
- **Server Functions:** `/src/server/users.server.ts`, `/src/server/verify.server.ts`
- **Auth Logic:** `/src/server/auth.server.ts` (updated with INACTIVE check)
- **Frontend:** `/src/routes/verify.tsx`
- **Database Schema:** `/src/db/schema.ts`

---

## Support

Nếu có vấn đề, liên hệ: support@hrm.com
