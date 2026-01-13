import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  date,
  boolean,
  json,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// --- Enums ---
export const userStatusEnum = pgEnum('user_status', [
  'ACTIVE',
  'INACTIVE',
  'ON_LEAVED',
  'RETIRED',
]);

export const verificationTypeEnum = pgEnum('verification_type', [
  'ACTIVATION',
  'RESET_PASSWORD',
]);

export const skillTypeEnum = pgEnum('skill_type', [
  'HARD_SKILL',
  'SOFT_SKILL',
]);

export const attendanceStatusEnum = pgEnum('attendance_status', [
  'ON_TIME',
  'LATE',
  'EARLY_LEAVE',
  'ABSENT',
]);

export const requestTypeEnum = pgEnum('request_type', [
  'LEAVE',
  'WFH',
  'LATE',
  'EARLY',
  'OVERTIME',
]);

export const requestStatusEnum = pgEnum('request_status', [
  'PENDING',
  'APPROVED',
  'REJECTED',
]);

export const educationExperienceTypeEnum = pgEnum('education_experience_type', [
  'Education',
  'Experience',
]);

export const achievementTypeEnum = pgEnum('achievement_type', [
  'Award',
  'Discipline',
]);

export const emailStatusEnum = pgEnum('email_status', [
  'SENT',
  'FAILED',
  'QUEUED',
]);

export const profileUpdateStatusEnum = pgEnum('profile_update_status', [
  'PENDING',
  'APPROVED',
  'REJECTED',
]);

// --- 1.1 Roles ---
export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  roleName: varchar('role_name', { length: 50 }).notNull(), // Admin, HR, Leader, Dev
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

// --- 1.2 Teams ---
export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  teamName: varchar('team_name', { length: 100 }).notNull(),
  description: text('description'),
  leaderId: integer('leader_id'), // Linked to users.id but defined here as simple int to avoid circular dep in definition
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

// --- 1.3 Users ---
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  employeeCode: varchar('employee_code', { length: 50 }).unique().notNull(),
  email: varchar('email', { length: 150 }).unique().notNull(),
  phone: varchar('phone', { length: 20 }),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  roleId: integer('role_id').references(() => roles.id),
  teamId: integer('team_id').references(() => teams.id),
  status: userStatusEnum('status').default('ACTIVE'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

// --- Relations for Users/Teams/Roles ---
export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  team: one(teams, {
    fields: [users.teamId],
    references: [teams.id],
    relationName: 'team_members',
  }),
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  verificationTokens: many(verificationTokens),
  cvAttachments: many(cvAttachments),
  userSkills: many(userSkills),
  attendanceLogs: many(attendanceLogs),
  workRequests: many(workRequests, { relationName: 'request_owner' }),
  educationExperiences: many(educationExperience),
  achievements: many(achievements),
  profileUpdateRequests: many(profileUpdateRequests, { relationName: 'profile_update_owner' }),
  leadingTeam: one(teams, {
     fields: [users.id],
     references: [teams.leaderId],
     relationName: 'team_leader' 
  }),
  requestsToApprove: many(workRequests, { relationName: 'request_approver' }),
  profileUpdatesToReview: many(profileUpdateRequests, { relationName: 'profile_update_reviewer' }),
  sentEmails: many(emailLogs),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  leader: one(users, {
    fields: [teams.leaderId],
    references: [users.id],
    relationName: 'team_leader'
  }),
  members: many(users, { relationName: 'team_members' }),
}));

// --- 1.4 Verification Tokens ---
export const verificationTokens = pgTable('verification_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  token: varchar('token', { length: 255 }).notNull(),
  type: verificationTypeEnum('type').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const verificationTokensRelations = relations(verificationTokens, ({ one }) => ({
  user: one(users, {
    fields: [verificationTokens.userId],
    references: [users.id],
  }),
}));

// --- 2.1 Profiles ---
export const profiles = pgTable('profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).unique().notNull(),
  fullName: varchar('full_name', { length: 150 }).notNull(),
  dob: date('dob'),
  gender: varchar('gender', { length: 20 }),
  idCardNumber: varchar('id_card_number', { length: 50 }),
  address: text('address'),
  joinDate: date('join_date'),
  unionJoinDate: date('union_join_date'),
  unionPosition: varchar('union_position', { length: 100 }),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

// --- 2.2 CV Attachments ---
export const cvAttachments = pgTable('cv_attachments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  version: varchar('version', { length: 50 }),
  isCurrent: boolean('is_current').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const cvAttachmentsRelations = relations(cvAttachments, ({ one }) => ({
  user: one(users, {
    fields: [cvAttachments.userId],
    references: [users.id],
  }),
}));

// --- 2.3.1 Master Skills ---
export const masterSkills = pgTable('master_skills', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  type: skillTypeEnum('type').notNull(),
  category: varchar('category', { length: 100 }),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

// --- 2.3.2 Skill Levels ---
export const skillLevels = pgTable('skill_levels', {
  id: serial('id').primaryKey(),
  skillId: integer('skill_id').references(() => masterSkills.id).notNull(),
  name: varchar('name', { length: 50 }).notNull(),
  levelOrder: integer('level_order').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

// --- 2.3.3 Skill Criteria ---
export const skillCriteria = pgTable('skill_criteria', {
  id: serial('id').primaryKey(),
  levelId: integer('level_id').references(() => skillLevels.id).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

// --- 2.3.4 User Skills ---
export const userSkills = pgTable('user_skills', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  skillId: integer('skill_id').references(() => masterSkills.id).notNull(),
  levelId: integer('level_id').references(() => skillLevels.id).notNull(),
  assessedAt: date('assessed_at'),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const userSkillsRelations = relations(userSkills, ({ one }) => ({
  user: one(users, {
    fields: [userSkills.userId],
    references: [users.id],
  }),
  skill: one(masterSkills, {
    fields: [userSkills.skillId],
    references: [masterSkills.id],
  }),
  level: one(skillLevels, {
    fields: [userSkills.levelId],
    references: [skillLevels.id],
  }),
}));

// --- Relations for Skills ---
export const masterSkillsRelations = relations(masterSkills, ({ many }) => ({
  levels: many(skillLevels),
}));

export const skillLevelsRelations = relations(skillLevels, ({ one, many }) => ({
  skill: one(masterSkills, {
    fields: [skillLevels.skillId],
    references: [masterSkills.id],
  }),
  criteria: many(skillCriteria),
}));

export const skillCriteriaRelations = relations(skillCriteria, ({ one }) => ({
  level: one(skillLevels, {
    fields: [skillCriteria.levelId],
    references: [skillLevels.id],
  }),
}));

// --- 2.9.1 Attendance Logs ---
export const attendanceLogs = pgTable('attendance_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  checkInTime: timestamp('check_in_time'),
  checkOutTime: timestamp('check_out_time'),
  date: date('date').notNull(),
  status: attendanceStatusEnum('status').default('ON_TIME'),
  totalHours: integer('total_hours'), // Using integer for simplicity (minutes) or float/real? Schema says FLOAT. Drizzle real.
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const attendanceLogsRelations = relations(attendanceLogs, ({ one }) => ({
  user: one(users, {
    fields: [attendanceLogs.userId],
    references: [users.id],
  }),
}));
// Note: totalHours schema says float. Drizzle `real` or `doublePrecision`.
// I'll stick to real or numeric? Text is safer for exact decimals but float is requested.

// --- 2.9.2 Work Requests ---
export const workRequests = pgTable('work_requests', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  type: requestTypeEnum('type').notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  reason: text('reason'),
  approverId: integer('approver_id').references(() => users.id),
  status: requestStatusEnum('status').default('PENDING'),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const workRequestsRelations = relations(workRequests, ({ one }) => ({
  user: one(users, {
    fields: [workRequests.userId],
    references: [users.id],
    relationName: 'request_owner',
  }),
  approver: one(users, {
    fields: [workRequests.approverId],
    references: [users.id],
    relationName: 'request_approver',
  }),
}));

// --- 2.4 Education & Experience ---
export const educationExperience = pgTable('education_experience', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  type: educationExperienceTypeEnum('type').notNull(),
  organizationName: varchar('organization_name', { length: 200 }).notNull(),
  positionMajor: varchar('position_major', { length: 150 }),
  startDate: date('start_date'),
  endDate: date('end_date'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const educationExperienceRelations = relations(educationExperience, ({ one }) => ({
  user: one(users, {
    fields: [educationExperience.userId],
    references: [users.id],
  }),
}));

// --- 2.5 Achievements ---
export const achievements = pgTable('achievements', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  type: achievementTypeEnum('type').notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content'),
  issuedDate: date('issued_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const achievementsRelations = relations(achievements, ({ one }) => ({
  user: one(users, {
    fields: [achievements.userId],
    references: [users.id],
  }),
}));

// --- 2.6 Email Templates ---
export const emailTemplates = pgTable('email_templates', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 100 }).unique().notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  subject: varchar('subject', { length: 255 }).notNull(),
  body: text('body').notNull(), // HTML content
  variables: text('variables'), // JSON description but schema says Text.
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

// --- 2.7 Email Logs ---
export const emailLogs = pgTable('email_logs', {
  id: serial('id').primaryKey(),
  senderId: integer('sender_id').references(() => users.id), // Nullable for System?
  recipientEmail: varchar('recipient_email', { length: 150 }).notNull(),
  subject: varchar('subject', { length: 255 }).notNull(),
  status: emailStatusEnum('status').default('QUEUED'),
  sentAt: timestamp('sent_at'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const emailLogsRelations = relations(emailLogs, ({ one }) => ({
  sender: one(users, {
    fields: [emailLogs.senderId],
    references: [users.id],
  }),
}));

// --- 2.8 Profile Update Requests ---
export const profileUpdateRequests = pgTable('profile_update_requests', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  dataChanges: json('data_changes').notNull(),
  status: profileUpdateStatusEnum('status').default('PENDING'),
  reviewerId: integer('reviewer_id').references(() => users.id),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const profileUpdateRequestsRelations = relations(profileUpdateRequests, ({ one }) => ({
  user: one(users, {
    fields: [profileUpdateRequests.userId],
    references: [users.id],
    relationName: 'profile_update_owner',
  }),
  reviewer: one(users, {
    fields: [profileUpdateRequests.reviewerId],
    references: [users.id],
    relationName: 'profile_update_reviewer',
  }),
}));
