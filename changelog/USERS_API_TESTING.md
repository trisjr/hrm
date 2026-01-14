/\*\*

- Manual Testing Guide for Users API
-
- Hướng dẫn test thủ công các endpoint Users API
  \*/

// ============================================
// 1. CREATE USER
// ============================================

/\*
POST http://localhost:3000/api/users

Body:
{
"employeeCode": "EMP001",
"email": "test@hrm.com",
"password": "Test@123456",
"profile": {
"fullName": "Nguyễn Văn Test",
"dob": "1990-01-01",
"gender": "Nam",
"address": "123 Test Street"
}
}

Expected Response:
{
"user": {
"id": 1,
"employeeCode": "EMP001",
"email": "test@hrm.com",
"status": "INACTIVE",
"profile": {
"fullName": "Nguyễn Văn Test",
...
}
},
"verifyToken": "uuid-token-here"
}

✅ Test:

- User created với status = INACTIVE
- Profile data được tạo kèm
- Verify token được return
  \*/

// ============================================
// 2. TRY LOGIN (SHOULD FAIL - User chưa verify)
// ============================================

/\*
POST http://localhost:3000/api/auth/login

Body:
{
"email": "test@hrm.com",
"password": "Test@123456"
}

Expected Response:
{
"error": "Tài khoản chưa được xác thực. Vui lòng kiểm tra email để kích hoạt tài khoản."
}

✅ Test:

- Login bị block
- Error message yêu cầu verify email
  \*/

// ============================================
// 3. VERIFY ACCOUNT
// ============================================

/\*
POST http://localhost:3000/api/users/verify

Body:
{
"token": "uuid-token-from-step-1"
}

Expected Response:
{
"success": true,
"message": "Xác thực tài khoản thành công. Bạn có thể đăng nhập ngay bây giờ.",
"alreadyVerified": false
}

✅ Test:

- Verify thành công
- User status changed: INACTIVE → ACTIVE
- Token được mark as used (deletedAt set)
  \*/

// ============================================
// 4. LOGIN (SHOULD SUCCESS)
// ============================================

/\*
POST http://localhost:3000/api/auth/login

Body:
{
"email": "test@hrm.com",
"password": "Test@123456"
}

Expected Response:
{
"user": {
"id": 1,
"email": "test@hrm.com",
"status": "ACTIVE",
...
},
"token": "jwt-token-here"
}

✅ Test:

- Login thành công
- JWT token được return
- User data với profile
  \*/

// ============================================
// 5. LIST USERS
// ============================================

/\*
GET http://localhost:3000/api/users?page=1&limit=10

Expected Response:
{
"users": [
{
"id": 1,
"email": "test@hrm.com",
"status": "ACTIVE",
"profile": {
"fullName": "Nguyễn Văn Test",
...
},
"role": {...},
"team": {...}
}
],
"pagination": {
"page": 1,
"limit": 10,
"total": 1,
"totalPages": 1
}
}

✅ Test:

- Users list returned
- Profile always included
- Pagination working
  \*/

// ============================================
// 6. GET USER BY ID
// ============================================

/\*
GET http://localhost:3000/api/users/1

Expected Response:
{
"user": {
"id": 1,
"email": "test@hrm.com",
"status": "ACTIVE",
"profile": {...},
"role": {...},
"team": {...},
"careerBand": {...}
}
}

✅ Test:

- User detail returned
- All relations populated
- No passwordHash in response
  \*/

// ============================================
// 7. UPDATE USER
// ============================================

/\*
POST http://localhost:3000/api/users/1

Body:
{
"id": "1",
"phone": "0123456789",
"profile": {
"address": "456 New Address"
}
}

Expected Response:
{
"user": {
"id": 1,
"phone": "0123456789",
"profile": {
"address": "456 New Address",
...
},
...
}
}

✅ Test:

- User data updated
- Profile data updated
- Changes persisted
  \*/

// ============================================
// 8. DELETE USER
// ============================================

/\*
POST http://localhost:3000/api/users/1/delete

Body:
{
"id": "1"
}

Expected Response:
{
"success": true,
"message": "Xóa người dùng thành công"
}

✅ Test:

- User soft deleted (deletedAt set)
- User not shown in list anymore
- Data still in database
  \*/

// ============================================
// 9. VERIFY PAGE UI TEST
// ============================================

/\*
Manual UI Test:

1. Open browser: http://localhost:3000/verify?token=valid-token
   ✅ Loading state → Success → Auto redirect sau 5s

2. Open browser: http://localhost:3000/verify?token=invalid-token
   ✅ Loading state → Error → Buttons "Thử lại" + "Quay lại"

3. Open browser: http://localhost:3000/verify?token=expired-token
   ✅ Error message: "Token không hợp lệ hoặc đã hết hạn"

4. Click "Đăng nhập ngay" during countdown
   ✅ Immediately redirect to /login
   \*/

// ============================================
// 10. EDGE CASES
// ============================================

/\*
Test Case 1: Duplicate Email
POST /api/users with email already exists
Expected: Error "Email đã tồn tại trong hệ thống"

Test Case 2: Duplicate EmployeeCode
POST /api/users with employeeCode already exists
Expected: Error "Mã nhân viên đã tồn tại trong hệ thống"

Test Case 3: Weak Password
POST /api/users with password "12345"
Expected: Validation error

Test Case 4: Invalid Email
POST /api/users with email "notanemail"
Expected: Validation error

Test Case 5: Verify Already Active User
POST /api/users/verify with token of ACTIVE user
Expected: Success with alreadyVerified=true

Test Case 6: Resend Verification
POST /api/users/resend-verification with email
Expected: New token generated, old tokens invalidated
\*/

// ============================================
// TESTING CHECKLIST
// ============================================

/\*
Backend:
[ ] Create user → status INACTIVE, token generated
[ ] Login before verify → blocked
[ ] Verify account → status ACTIVE
[ ] Login after verify → success
[ ] List users → profile included
[ ] Get user by ID → all relations
[ ] Update user → changes saved
[ ] Delete user → soft delete
[ ] Resend verification → new token

Validation:
[ ] Duplicate email → error
[ ] Duplicate employeeCode → error
[ ] Weak password → error
[ ] Invalid email → error
[ ] Missing required fields → error

Security:
[ ] passwordHash not in response
[ ] deletedAt not in response
[ ] Token expires after 24h
[ ] Token invalidated after use
[ ] Transaction rollback on error

Frontend:
[ ] Verify page loads
[ ] Loading state shows
[ ] Success state with countdown
[ ] Error state with retry
[ ] Auto redirect works
[ ] Manual redirect button works

Integration:
[ ] Full flow: create → verify → login
[ ] Update flow: create → update → verify data
[ ] Delete flow: create → delete → not in list
\*/

export {}
