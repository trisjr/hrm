# Forgot Password Feature Specification

## 1. Executive Summary

Provide a secure mechanism for users to reset their forgotten passwords via email verification. This ensures users can regain access to their accounts without administrator intervention, reducing support overhead.

## 2. User Stories

### 2.1. Request Reset

- **As a User**, I want to enter my email address to request a password reset link.
- **As a User**, I want to receive an email with clear instructions and a secure link to reset my password.
- **As a System**, I want to obscure whether an email exists in the database to prevent email enumeration attacks (always return "If your email is registered, you will receive a link").

### 2.2. Reset Password

- **As a User**, I want to click the link in my email and be directed to a page where I can set a new password.
- **As a User**, I want to see an error if the link is expired or invalid.
- **As a User**, I want to be redirected to the login page after a successful password reset.

## 3. Database Design

We will utilize the existing `verification_tokens` table.

```sql
-- Existing Schema Ref
TABLE verification_tokens (
  id SERIAL PK,
  user_id INT FK -> users.id,
  token VARCHAR(255) NOT NULL,
  type verification_type_enum ('RESET_PASSWORD'),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  ...
)
```

No new tables needed. We will use the `RESET_PASSWORD` enum value for `verification_type`.

## 4. Logic Flow & Architecture

### 4.1. Request Reset Flow (Backend: `requestPasswordResetFn`)

1. **Input**: `email` (string).
2. **Validation**: Check if email format is valid.
3. **User Lookup**: Find user by `email`.
   - If User NOT FOUND or INACTIVE:
     - Log activity internally.
     - Return **Success** (Fake success) to UI to prevent enumeration.
4. **Token Generation**:
   - Generate a secure random string (UUID or similar).
   - Expiry: `NOW() + 15 minutes`.
5. **Database**: Insert into `verification_tokens`.
6. **Email Sending**:
   - Fetch `email_templates` with code `RESET_PASSWORD`.
   - Replace variables: `{fullName}`, `{resetLink}`.
   - Send Email (via `sendEmail` utility).
7. **Response**: `{ success: true, message: "If an account exists, an email has been sent." }`

### 4.2. Verify Token Flow (Frontend Load / Pre-check)

- When user visits `/reset-password?token=xyz`:
- Frontend can optionally call a "check token" API, or just wait for submission.
- _Decision_: We will validate on submission to keep it simple, or checking simply if formatting is correct. Better UX: Validate on load.
- **Backend: `verifyResetTokenFn`** (Optional, for UX)
  - Check if token exists in DB and `expires_at > NOW()`.
  - Return `{ valid: true/false }`.

### 4.3. Confirm Reset Flow (Backend: `resetPasswordFn`)

1. **Input**: `token`, `newPassword`.
2. **Validation**: Validate password strength.
3. **Token Verification**:
   - Find token in `verification_tokens`.
   - Check `type == 'RESET_PASSWORD'`.
   - Check `expires_at > NOW()`.
   - If invalid/expired: Throw Error("Invalid or expired link").
4. **Action**:
   - Hash `newPassword`.
   - Update `users.passwordHash`.
   - **Delete** the used token from `verification_tokens` (prevent replay).
   - (Optional) Invalidate other sessions (out of scope for now).
5. **Email Notification** (Optional): Send "Password Changed" email.
6. **Response**: `{ success: true }`.

## 5. API Contract

### 5.1. Request Reset

```typescript
// POST /api/auth/forgot-password
input: { email: string }
output: { success: boolean, message: string }
```

### 5.2. Reset Password

```typescript
// POST /api/auth/reset-password
input: { token: string, newPassword: string }
output: { success: boolean }
```

## 6. UI Components

### 6.1. `ForgotPasswordPage` (`/forgot-password`)

- Clean, centered card layout (similar to Login).
- Input: Email.
- Button: "Send Reset Link".
- State:
  - Idle: Form visible.
  - Loading: Button disabled, spinner.
  - Success: Hide form, show "Check your email" message.
  - Back to Login link.

### 6.2. `ResetPasswordPage` (`/reset-password`)

- URL Query Param: `?token=...`
- Input: New Password, Confirm Password.
- Button: "Reset Password".
- State:
  - Error (Invalid Token): Show "Link expired/invalid" and "Back to Login" button.
  - Success: Show "Password reset successfully" and redirect to Login after 3s.

## 7. Email Templates

We need to seed a new email template.

- **Code**: `RESET_PASSWORD`
- **Subject**: Reset your password for HRM
- **Body**:
  ```html
  <p>Hi {fullName},</p>
  <p>You requested to reset your password.</p>
  <p>Click the link below to proceed (valid for 15 minutes):</p>
  <p><a href="{resetLink}">Reset Password</a></p>
  <p>If you didn't request this, please ignore this email.</p>
  ```
- **Variables**: `["fullName", "resetLink"]`

## 8. Build Checklist

- [ ] Create/Confirm `RESET_PASSWORD` template seeding.
- [ ] Implement `requestPasswordResetFn` in `src/server/auth.server.ts`.
- [ ] Implement `resetPasswordFn` in `src/server/auth.server.ts`.
- [ ] Create UI Page: `src/routes/forgot-password.tsx`.
- [ ] Create UI Page: `src/routes/reset-password.tsx`.
- [ ] Add "Forgot Password?" link on Login page.
- [ ] Test flow: Request -> Email Mock Log -> Click Link -> Reset -> Login.
