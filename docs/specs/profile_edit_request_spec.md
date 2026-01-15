# Feature Specification: Profile Edit with Approval Workflow

## 1. Executive Summary

Allow users to edit their profile information. Changes are not applied immediately but created as a `Profile Update Request`. HR or Admin must approve the request for changes to take effect.

## 2. User Stories

### User (Employee)

- As a User, I want to edit my profile details (Full Name, Address, Phone, etc.).
- As a User, I want to see if my changes are pending approval.
- As a User, I want to know if my request was approved or rejected (and why).

### Admin / HR

- As an Admin/HR, I want to view a list of checking profile update requests.
- As an Admin/HR, I want to see exactly what changed (Old Value vs New Value).
- As an Admin/HR, I want to Approve or Reject the request.

## 3. Database Design

We use the existing `profile_update_requests` table.

```typescript
export const profileUpdateRequests = pgTable('profile_update_requests', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  dataChanges: json('data_changes').notNull(), // Stores changes { field: newValue }
  status: profileUpdateStatusEnum('status').default('PENDING'),
  reviewerId: integer('reviewer_id').references(() => users.id),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
})
```

## 4. API / Server Functions

### 4.1. Create Request

- **Function**: `createProfileUpdateRequest`
- **Input**: `ProfileData` (partial)
- **Logic**:
  - Validate input.
  - Check if User already has a PENDING request (Optional: Block if pending? Or overwrite? -> **Decision: Block if pending to avoid complexity**).
  - Create record in `profile_update_requests` with `dataChanges`.

### 4.2. List Requests (Admin/HR)

- **Function**: `getProfileUpdateRequests`
- **Output**: List of requests with User Profile + User Role.

### 4.3. Approve Request

- **Function**: `approveProfileUpdateRequest`
- **Logic**:
  - Verify Permissions (Admin/HR only).
  - Update `profile_update_requests` status = APPROVED.
  - **Apply changes** to `profiles` database table.
  - (Optional) Send email notification.

### 4.4. Reject Request

- **Function**: `rejectProfileUpdateRequest`
- **Logic**:
  - Update `profile_update_requests` status = REJECTED.
  - Save reason.

## 5. UI Components

### 5.1. User Profile

- Add **"Edit Profile"** button.
- If existing PENDING request: Show **"Update Pending Approval"** banner. Disable Edit button.
- **Edit Dialog**:
  - Pre-fill with current data.
  - Form fields: Full Name, Phone, Address, DOB, Gender, ID Card, etc.

### 5.2. Admin Request Management

- Route: `/admin/profile-requests`
- **Table**: Requester, Created At, Status, Action.
- **Detail Dialog**:
  - Show "Before" vs "After".
  - Buttons: Approve, Reject (with reason input).

## 6. Logic Flow

1. User clicks Edit -> Fills Form -> Submit.
2. Server creates `ProfileUpdateRequest` (Status: PENDING).
3. Admin sees request in Dashboard.
4. Admin reviews changes.
   - **If Approved**: Update `profiles` table with `dataChanges`. Request Status -> APPROVED.
   - **If Rejected**: Request Status -> REJECTED.
5. User sees updated profile (if Approved).
