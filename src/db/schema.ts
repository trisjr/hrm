import {
  boolean,
  date,
  integer,
  json,
  pgEnum,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core'
import { isNull, relations } from 'drizzle-orm'

// --- Enums ---
export const userStatusEnum = pgEnum('user_status', [
  'ACTIVE',
  'INACTIVE',
  'ON_LEAVED',
  'RETIRED',
])

export const verificationTypeEnum = pgEnum('verification_type', [
  'ACTIVATION',
  'RESET_PASSWORD',
])

export const skillTypeEnum = pgEnum('skill_type', ['HARD_SKILL', 'SOFT_SKILL'])

export const attendanceStatusEnum = pgEnum('attendance_status', [
  'ON_TIME',
  'LATE',
  'EARLY_LEAVE',
  'ABSENT',
])

export const requestTypeEnum = pgEnum('request_type', [
  'LEAVE',
  'WFH',
  'LATE',
  'EARLY',
  'OVERTIME',
])

export const requestStatusEnum = pgEnum('request_status', [
  'PENDING',
  'APPROVED',
  'REJECTED',
])

export const educationExperienceTypeEnum = pgEnum('education_experience_type', [
  'Education',
  'Experience',
])

export const achievementTypeEnum = pgEnum('achievement_type', [
  'Award',
  'Discipline',
])

export const emailStatusEnum = pgEnum('email_status', [
  'SENT',
  'FAILED',
  'QUEUED',
])

export const profileUpdateStatusEnum = pgEnum('profile_update_status', [
  'PENDING',
  'APPROVED',
  'REJECTED',
])

export const assessmentCycleStatusEnum = pgEnum('assessment_cycle_status', [
  'DRAFT',
  'ACTIVE',
  'COMPLETED',
])

export const assessmentStatusEnum = pgEnum('assessment_status', [
  'SELF_ASSESSING',
  'LEADER_ASSESSING',
  'DISCUSSION',
  'DONE',
])

export const idpStatusEnum = pgEnum('idp_status', [
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
])

export const idpActivityTypeEnum = pgEnum('idp_activity_type', [
  'TRAINING',
  'MENTORING',
  'PROJECT_CHALLENGE',
  'SELF_STUDY',
])

export const idpActivityStatusEnum = pgEnum('idp_activity_status', [
  'PENDING',
  'DONE',
])

// --- 1.1 Career Bands ---
export const careerBands = pgTable('career_bands', {
  id: serial('id').primaryKey(),
  bandName: varchar('band_name', { length: 50 }).notNull(), // Band 0, Band 1, ...
  title: varchar('title', { length: 100 }).notNull(), // Intern, Junior, Middle, Senior, Expert/Lead
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// --- 1.2 Roles ---
export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  roleName: varchar('role_name', { length: 50 }).notNull(), // Admin, HR, Leader, Dev
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
})

// --- 1.2 Teams ---
export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  teamName: varchar('team_name', { length: 100 }).notNull(),
  description: text('description'),
  leaderId: integer('leader_id'), // Linked to users.id but defined here as simple int to avoid circular dep in definition
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
})

// --- 1.4 Users ---
export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    employeeCode: varchar('employee_code', { length: 50 }).notNull(),
    email: varchar('email', { length: 150 }).notNull(),
    phone: varchar('phone', { length: 20 }),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    roleId: integer('role_id').references(() => roles.id),
    teamId: integer('team_id').references(() => teams.id),
    careerBandId: integer('career_band_id').references(() => careerBands.id),
    status: userStatusEnum('status').default('ACTIVE'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    uniqueEmployeeCode: uniqueIndex('users_employee_code_unique')
      .on(table.employeeCode)
      .where(isNull(table.deletedAt)),
    uniqueEmail: uniqueIndex('users_email_unique')
      .on(table.email)
      .where(isNull(table.deletedAt)),
  }),
)

// --- Relations for Users/Teams/Roles ---
export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
}))

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
  profileUpdateRequests: many(profileUpdateRequests, {
    relationName: 'profile_update_owner',
  }),
  leadingTeam: one(teams, {
    fields: [users.id],
    references: [teams.leaderId],
    relationName: 'team_leader',
  }),
  requestsToApprove: many(workRequests, { relationName: 'request_approver' }),
  profileUpdatesToReview: many(profileUpdateRequests, {
    relationName: 'profile_update_reviewer',
  }),
  sentEmails: many(emailLogs),
  careerBand: one(careerBands, {
    fields: [users.careerBandId],
    references: [careerBands.id],
  }),
  userAssessments: many(userAssessments),
  individualDevelopmentPlans: many(individualDevelopmentPlans),
}))

export const careerBandsRelations = relations(careerBands, ({ many }) => ({
  users: many(users),
  competencyRequirements: many(competencyRequirements),
}))

export const teamsRelations = relations(teams, ({ one, many }) => ({
  leader: one(users, {
    fields: [teams.leaderId],
    references: [users.id],
    relationName: 'team_leader',
  }),
  members: many(users, { relationName: 'team_members' }),
}))

// --- 1.4 Verification Tokens ---
export const verificationTokens = pgTable('verification_tokens', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  token: varchar('token', { length: 255 }).notNull(),
  type: verificationTypeEnum('type').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
})

export const verificationTokensRelations = relations(
  verificationTokens,
  ({ one }) => ({
    user: one(users, {
      fields: [verificationTokens.userId],
      references: [users.id],
    }),
  }),
)

// --- 2.1 Profiles ---
export const profiles = pgTable('profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .unique()
    .notNull(),
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
})

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}))

// --- 2.2 CV Attachments ---
export const cvAttachments = pgTable('cv_attachments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  version: varchar('version', { length: 50 }),
  isCurrent: boolean('is_current').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
})

export const cvAttachmentsRelations = relations(cvAttachments, ({ one }) => ({
  user: one(users, {
    fields: [cvAttachments.userId],
    references: [users.id],
  }),
}))

// --- 3.1 Competency Groups ---
export const competencyGroups = pgTable('competency_groups', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(), // Core, Technical, Leadership
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
})

// --- 3.2 Competencies ---
export const competencies = pgTable('competencies', {
  id: serial('id').primaryKey(),
  groupId: integer('group_id')
    .references(() => competencyGroups.id)
    .notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
})

// --- 3.3 Competency Levels ---
export const competencyLevels = pgTable('competency_levels', {
  id: serial('id').primaryKey(),
  competencyId: integer('competency_id')
    .references(() => competencies.id)
    .notNull(),
  levelNumber: integer('level_number').notNull(), // 1-5
  behavioralIndicator: text('behavioral_indicator'),
  createdAt: timestamp('created_at').defaultNow(),
})

// --- 3.4 Competency Requirements ---
export const competencyRequirements = pgTable('competency_requirements', {
  id: serial('id').primaryKey(),
  roleId: integer('role_id')
    .references(() => roles.id)
    .notNull(),
  careerBandId: integer('career_band_id')
    .references(() => careerBands.id)
    .notNull(),
  competencyId: integer('competency_id')
    .references(() => competencies.id)
    .notNull(),
  requiredLevel: integer('required_level').notNull(), // 1-5
  createdAt: timestamp('created_at').defaultNow(),
})

// --- 3.5 Assessment Cycles ---
export const assessmentCycles = pgTable('assessment_cycles', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  status: assessmentCycleStatusEnum('status').default('DRAFT'),
  createdAt: timestamp('created_at').defaultNow(),
})

// --- 3.6 User Assessments ---
export const userAssessments = pgTable('user_assessments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  cycleId: integer('cycle_id')
    .references(() => assessmentCycles.id)
    .notNull(),
  selfScoreAvg: real('self_score_avg'),
  leaderScoreAvg: real('leader_score_avg'),
  finalScoreAvg: real('final_score_avg'),
  status: assessmentStatusEnum('status').default('SELF_ASSESSING'),
  feedback: text('feedback'),
  createdAt: timestamp('created_at').defaultNow(),
})

// --- 3.7 User Assessment Details ---
export const userAssessmentDetails = pgTable('user_assessment_details', {
  id: serial('id').primaryKey(),
  userAssessmentId: integer('user_assessment_id')
    .references(() => userAssessments.id)
    .notNull(),
  competencyId: integer('competency_id')
    .references(() => competencies.id)
    .notNull(),
  selfScore: integer('self_score'),
  leaderScore: integer('leader_score'),
  finalScore: integer('final_score'),
  gap: integer('gap'),
  note: text('note'),
})

// --- 3.8 Individual Development Plans (IDP) ---
export const individualDevelopmentPlans = pgTable(
  'individual_development_plans',
  {
    id: serial('id').primaryKey(),
    userAssessmentId: integer('user_assessment_id').references(
      () => userAssessments.id,
    ),
    userId: integer('user_id')
      .references(() => users.id)
      .notNull(),
    goal: text('goal').notNull(),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    status: idpStatusEnum('status').default('IN_PROGRESS'),
    createdAt: timestamp('created_at').defaultNow(),
  },
)

// --- 3.9 IDP Activities ---
export const idpActivities = pgTable('idp_activities', {
  id: serial('id').primaryKey(),
  idpId: integer('idp_id')
    .references(() => individualDevelopmentPlans.id)
    .notNull(),
  competencyId: integer('competency_id')
    .references(() => competencies.id)
    .notNull(),
  activityType: idpActivityTypeEnum('activity_type').notNull(),
  description: text('description').notNull(),
  evidence: text('evidence'),
  status: idpActivityStatusEnum('status').default('PENDING'),
  dueDate: date('due_date'),
})

// --- Competency Relations ---
export const competencyGroupsRelations = relations(
  competencyGroups,
  ({ many }) => ({
    competencies: many(competencies),
  }),
)

export const competenciesRelations = relations(
  competencies,
  ({ one, many }) => ({
    group: one(competencyGroups, {
      fields: [competencies.groupId],
      references: [competencyGroups.id],
    }),
    levels: many(competencyLevels),
    requirements: many(competencyRequirements),
    assessmentDetails: many(userAssessmentDetails),
    idpActivities: many(idpActivities),
  }),
)

export const competencyLevelsRelations = relations(
  competencyLevels,
  ({ one }) => ({
    competency: one(competencies, {
      fields: [competencyLevels.competencyId],
      references: [competencies.id],
    }),
  }),
)

export const competencyRequirementsRelations = relations(
  competencyRequirements,
  ({ one }) => ({
    role: one(roles, {
      fields: [competencyRequirements.roleId],
      references: [roles.id],
    }),
    careerBand: one(careerBands, {
      fields: [competencyRequirements.careerBandId],
      references: [careerBands.id],
    }),
    competency: one(competencies, {
      fields: [competencyRequirements.competencyId],
      references: [competencies.id],
    }),
  }),
)

export const assessmentCyclesRelations = relations(
  assessmentCycles,
  ({ many }) => ({
    userAssessments: many(userAssessments),
  }),
)

export const userAssessmentsRelations = relations(
  userAssessments,
  ({ one, many }) => ({
    user: one(users, {
      fields: [userAssessments.userId],
      references: [users.id],
    }),
    cycle: one(assessmentCycles, {
      fields: [userAssessments.cycleId],
      references: [assessmentCycles.id],
    }),
    details: many(userAssessmentDetails),
    idp: one(individualDevelopmentPlans, {
      fields: [userAssessments.id],
      references: [individualDevelopmentPlans.userAssessmentId],
    }),
  }),
)

export const userAssessmentDetailsRelations = relations(
  userAssessmentDetails,
  ({ one }) => ({
    userAssessment: one(userAssessments, {
      fields: [userAssessmentDetails.userAssessmentId],
      references: [userAssessments.id],
    }),
    competency: one(competencies, {
      fields: [userAssessmentDetails.competencyId],
      references: [competencies.id],
    }),
  }),
)

export const individualDevelopmentPlansRelations = relations(
  individualDevelopmentPlans,
  ({ one, many }) => ({
    user: one(users, {
      fields: [individualDevelopmentPlans.userId],
      references: [users.id],
    }),
    userAssessment: one(userAssessments, {
      fields: [individualDevelopmentPlans.userAssessmentId],
      references: [userAssessments.id],
    }),
    activities: many(idpActivities),
  }),
)

export const idpActivitiesRelations = relations(idpActivities, ({ one }) => ({
  idp: one(individualDevelopmentPlans, {
    fields: [idpActivities.idpId],
    references: [individualDevelopmentPlans.id],
  }),
  competency: one(competencies, {
    fields: [idpActivities.competencyId],
    references: [competencies.id],
  }),
}))

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
})

// --- 2.3.2 Skill Levels ---
export const skillLevels = pgTable('skill_levels', {
  id: serial('id').primaryKey(),
  skillId: integer('skill_id')
    .references(() => masterSkills.id)
    .notNull(),
  name: varchar('name', { length: 50 }).notNull(),
  levelOrder: integer('level_order').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
})

// --- 2.3.3 Skill Criteria ---
export const skillCriteria = pgTable('skill_criteria', {
  id: serial('id').primaryKey(),
  levelId: integer('level_id')
    .references(() => skillLevels.id)
    .notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
})

// --- 2.3.4 User Skills ---
export const userSkills = pgTable('user_skills', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  skillId: integer('skill_id')
    .references(() => masterSkills.id)
    .notNull(),
  levelId: integer('level_id')
    .references(() => skillLevels.id)
    .notNull(),
  assessedAt: date('assessed_at'),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
})

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
}))

// --- Relations for Skills ---
export const masterSkillsRelations = relations(masterSkills, ({ many }) => ({
  levels: many(skillLevels),
}))

export const skillLevelsRelations = relations(skillLevels, ({ one, many }) => ({
  skill: one(masterSkills, {
    fields: [skillLevels.skillId],
    references: [masterSkills.id],
  }),
  criteria: many(skillCriteria),
}))

export const skillCriteriaRelations = relations(skillCriteria, ({ one }) => ({
  level: one(skillLevels, {
    fields: [skillCriteria.levelId],
    references: [skillLevels.id],
  }),
}))

// --- 2.9.1 Attendance Logs ---
export const attendanceLogs = pgTable('attendance_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  checkInTime: timestamp('check_in_time'),
  checkOutTime: timestamp('check_out_time'),
  date: date('date').notNull(),
  status: attendanceStatusEnum('status').default('ON_TIME'),
  totalHours: integer('total_hours'), // Using integer for simplicity (minutes) or float/real? Schema says FLOAT. Drizzle real.
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
})

export const attendanceLogsRelations = relations(attendanceLogs, ({ one }) => ({
  user: one(users, {
    fields: [attendanceLogs.userId],
    references: [users.id],
  }),
}))
// Note: totalHours schema says float. Drizzle `real` or `doublePrecision`.
// I'll stick to real or numeric? Text is safer for exact decimals but float is requested.

// --- 2.9.2 Work Requests ---
export const workRequests = pgTable('work_requests', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  type: requestTypeEnum('type').notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  isHalfDay: boolean('is_half_day').default(false),
  reason: text('reason'),
  approverId: integer('approver_id').references(() => users.id),
  status: requestStatusEnum('status').default('PENDING'),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
})

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
}))

// --- 2.4 Education & Experience ---
export const educationExperience = pgTable('education_experience', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  type: educationExperienceTypeEnum('type').notNull(),
  organizationName: varchar('organization_name', { length: 200 }).notNull(),
  positionMajor: varchar('position_major', { length: 150 }),
  startDate: date('start_date'),
  endDate: date('end_date'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
})

export const educationExperienceRelations = relations(
  educationExperience,
  ({ one }) => ({
    user: one(users, {
      fields: [educationExperience.userId],
      references: [users.id],
    }),
  }),
)

// --- 2.5 Achievements ---
export const achievements = pgTable('achievements', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  type: achievementTypeEnum('type').notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content'),
  issuedDate: date('issued_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
})

export const achievementsRelations = relations(achievements, ({ one }) => ({
  user: one(users, {
    fields: [achievements.userId],
    references: [users.id],
  }),
}))

// --- 2.6 Email Templates ---
export const emailTemplates = pgTable('email_templates', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 100 }).unique().notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  subject: varchar('subject', { length: 255 }).notNull(),
  body: text('body').notNull(), // HTML content
  variables: text('variables'), // JSON description of placeholders
  isSystem: boolean('is_system').default(false).notNull(), // System templates cannot be deleted
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
})

// --- 2.7 Email Logs ---
export const emailLogs = pgTable('email_logs', {
  id: serial('id').primaryKey(),
  templateId: integer('template_id').references(() => emailTemplates.id), // Reference to template used
  senderId: integer('sender_id').references(() => users.id), // Nullable for System sends
  recipientEmail: varchar('recipient_email', { length: 150 }).notNull(),
  subject: varchar('subject', { length: 255 }).notNull(),
  body: text('body'), // Actual HTML content sent (for audit trail)
  status: emailStatusEnum('status').default('QUEUED'),
  sentAt: timestamp('sent_at'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
})

export const emailTemplatesRelations = relations(
  emailTemplates,
  ({ many }) => ({
    emailLogs: many(emailLogs),
  }),
)

export const emailLogsRelations = relations(emailLogs, ({ one }) => ({
  template: one(emailTemplates, {
    fields: [emailLogs.templateId],
    references: [emailTemplates.id],
  }),
  sender: one(users, {
    fields: [emailLogs.senderId],
    references: [users.id],
  }),
}))

// --- 2.8 Profile Update Requests ---
export const profileUpdateRequests = pgTable('profile_update_requests', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  dataChanges: json('data_changes').notNull(),
  status: profileUpdateStatusEnum('status').default('PENDING'),
  reviewerId: integer('reviewer_id').references(() => users.id),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
})

export const profileUpdateRequestsRelations = relations(
  profileUpdateRequests,
  ({ one }) => ({
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
  }),
)
