# User Guide: Team Management System

## Overview

The Team Management System helps HR and Administrators organize employees into functional teams, assign leaders, and track team performance. This guide explains how to use the key features available in the Admin Dashboard.

## 1. Accessing Team Management

1. Log in with an **Admin** or **HR** account.
2. Navigate to the **Admin Dashboard** via the top navigation bar.
3. Click on **Teams** in the sidebar menu or use the "Manage Teams" quick action.

---

## 2. Managing Teams

### 2.1 View All Teams

- The main **Teams** page displays a list of all active teams.
- **Search**: Use the search bar (or press `Cmd+K` / `Ctrl+K`) to find teams by name.
- **Filter**: Use the dropdown filter to see teams "With Leader" or "Without Leader".
- **Views**:
  - **Desktop**: Detailed table view with columns for Team Name, Leader, Members, and Created Date.
  - **Mobile**: Card-based view for easy browsing on smaller screens.

### 2.2 Create a New Team

1. Click the **+ New Team** button.
2. Enter a unique **Team Name** (required).
3. Add a **Description** (optional).
4. (Optional) Select an initial **Leader** from the user list.
5. Click **Create Team**.

### 2.3 Edit a Team

1. Click the **Actions** menu (three dots) on a team row or card.
2. Select **Edit Team**.
3. Update the name or description.
4. Click **Save Changes**.

### 2.4 Delete a Team

1. Click the **Actions** menu (three dots) on a team row or card.
2. Select **Delete Team**.
3. A confirmation dialog will appear.
   - **Warning**: If the team has members, you will see a warning count.
   - **Consequence**: Deleting a team automatically unassigns all its current members (their Team field becomes empty).
4. Click **Yes, Delete Team** to confirm.
   - _Note: Email notifications are sent to all affected members._

---

## 3. Managing Team Members

Navigate to a specific team's detail page by clicking its name in the list.

### 3.1 Team Overview

The Team Detail page shows:

- **Statistics**: Total Members, Active Work Requests, and Average Attendance.
- **Leader Card**: Shows the current leader or a prompt to assign one.
- **Members List**: All current members with their role and status.

### 3.2 Add Member

1. Click the **Add Member** button in the Members section.
2. Search for a user by name, email, or employee ID.
3. **Reassignment Warning**: If you select a user who is already in another team, a warning dialog will appear asking you to confirm they should be moved to this new team.
4. Click **Add** to confirm.

### 3.3 Remove Member

1. Locate the member in the list.
2. Click the **Trash** icon (Remove).
3. Confirm the action in the dialog.
   - _Note: If you remove a Team Leader, the team's leader position will become vacant._

---

## 4. Leader Assignment

### 4.1 Assign or Change Leader

1. Click **Assign Leader** (or **Change Leader**) on the Leader Card.
2. Select a user from the list.
   - **Requirement**: A leader _must_ be an existing member of the team. If the person you want isn't listed, add them as a member first.
3. Select **No Leader** to leave the position vacant.
4. Click **Assign Leader** to save.

- **Impact**: The assigned user's system role is updated to **LEADER** (if not already higher). They will receive an email notification.

---

## 5. Analytics & Notifications

### 5.1 Analytics

- **Member Count**: Track team growth over time.
- **Active Requests**: Monitor pending leave or work requests for the team.
- **Attendance**: View average attendance/punctuality for the last 30 days.

### 5.2 Email Notifications

The system automatically sends email notifications for:

- Being added to a team.
- Being removed from a team.
- Being assigned as a Team Leader.
- Team deletion (sent to all former members).

---

## Troubleshooting

- **"User not found" when assigning leader**: Ensure the user is first added to the team's member list.
- **Cannot delete team**: Ensure you have Admin/HR permissions. Network issues may also prevent deletion if the member count is very high (contact IT support).
- **Email not received**: Check Spam/Junk folder. Notifications are sent immediately upon action.
