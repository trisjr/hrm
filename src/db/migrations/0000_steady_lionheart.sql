CREATE TYPE "public"."achievement_type" AS ENUM('Award', 'Discipline');--> statement-breakpoint
CREATE TYPE "public"."assessment_cycle_status" AS ENUM('DRAFT', 'ACTIVE', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."assessment_status" AS ENUM('SELF_ASSESSING', 'LEADER_ASSESSING', 'DISCUSSION', 'DONE');--> statement-breakpoint
CREATE TYPE "public"."attendance_status" AS ENUM('ON_TIME', 'LATE', 'EARLY_LEAVE', 'ABSENT');--> statement-breakpoint
CREATE TYPE "public"."education_experience_type" AS ENUM('Education', 'Experience');--> statement-breakpoint
CREATE TYPE "public"."email_status" AS ENUM('SENT', 'FAILED', 'QUEUED');--> statement-breakpoint
CREATE TYPE "public"."idp_activity_status" AS ENUM('PENDING', 'DONE');--> statement-breakpoint
CREATE TYPE "public"."idp_activity_type" AS ENUM('TRAINING', 'MENTORING', 'PROJECT_CHALLENGE', 'SELF_STUDY');--> statement-breakpoint
CREATE TYPE "public"."idp_status" AS ENUM('IN_PROGRESS', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."profile_update_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."request_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."request_type" AS ENUM('LEAVE', 'WFH', 'LATE', 'EARLY', 'OVERTIME');--> statement-breakpoint
CREATE TYPE "public"."skill_type" AS ENUM('HARD_SKILL', 'SOFT_SKILL');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('ACTIVE', 'INACTIVE', 'ON_LEAVED', 'RETIRED');--> statement-breakpoint
CREATE TYPE "public"."verification_type" AS ENUM('ACTIVATION', 'RESET_PASSWORD');--> statement-breakpoint
CREATE TABLE "achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" "achievement_type" NOT NULL,
	"title" varchar(200) NOT NULL,
	"content" text,
	"issued_date" date,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "assessment_cycles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" "assessment_cycle_status" DEFAULT 'DRAFT',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "attendance_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"check_in_time" timestamp,
	"check_out_time" timestamp,
	"date" date NOT NULL,
	"status" "attendance_status" DEFAULT 'ON_TIME',
	"total_hours" integer,
	"note" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "career_bands" (
	"id" serial PRIMARY KEY NOT NULL,
	"band_name" varchar(50) NOT NULL,
	"title" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "competencies" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "competency_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "competency_levels" (
	"id" serial PRIMARY KEY NOT NULL,
	"competency_id" integer NOT NULL,
	"level_number" integer NOT NULL,
	"behavioral_indicator" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "competency_requirements" (
	"id" serial PRIMARY KEY NOT NULL,
	"role_id" integer NOT NULL,
	"career_band_id" integer NOT NULL,
	"competency_id" integer NOT NULL,
	"required_level" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cv_attachments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_path" varchar(500) NOT NULL,
	"version" varchar(50),
	"is_current" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "education_experience" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" "education_experience_type" NOT NULL,
	"organization_name" varchar(200) NOT NULL,
	"position_major" varchar(150),
	"start_date" date,
	"end_date" date,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "email_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" integer,
	"recipient_email" varchar(150) NOT NULL,
	"subject" varchar(255) NOT NULL,
	"status" "email_status" DEFAULT 'QUEUED',
	"sent_at" timestamp,
	"error_message" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(100) NOT NULL,
	"name" varchar(200) NOT NULL,
	"subject" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"variables" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	CONSTRAINT "email_templates_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "idp_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"idp_id" integer NOT NULL,
	"competency_id" integer NOT NULL,
	"activity_type" "idp_activity_type" NOT NULL,
	"description" text NOT NULL,
	"evidence" text,
	"status" "idp_activity_status" DEFAULT 'PENDING',
	"due_date" date
);
--> statement-breakpoint
CREATE TABLE "individual_development_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_assessment_id" integer,
	"user_id" integer NOT NULL,
	"goal" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" "idp_status" DEFAULT 'IN_PROGRESS',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "master_skills" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" "skill_type" NOT NULL,
	"category" varchar(100),
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "profile_update_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"data_changes" json NOT NULL,
	"status" "profile_update_status" DEFAULT 'PENDING',
	"reviewer_id" integer,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"full_name" varchar(150) NOT NULL,
	"dob" date,
	"gender" varchar(20),
	"id_card_number" varchar(50),
	"address" text,
	"join_date" date,
	"union_join_date" date,
	"union_position" varchar(100),
	"avatar_url" varchar(500),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	CONSTRAINT "profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"role_name" varchar(50) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "skill_criteria" (
	"id" serial PRIMARY KEY NOT NULL,
	"level_id" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "skill_levels" (
	"id" serial PRIMARY KEY NOT NULL,
	"skill_id" integer NOT NULL,
	"name" varchar(50) NOT NULL,
	"level_order" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_name" varchar(100) NOT NULL,
	"description" text,
	"leader_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_assessment_details" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_assessment_id" integer NOT NULL,
	"competency_id" integer NOT NULL,
	"self_score" integer,
	"leader_score" integer,
	"final_score" integer,
	"gap" integer,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "user_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"cycle_id" integer NOT NULL,
	"self_score_avg" integer,
	"leader_score_avg" integer,
	"final_score_avg" integer,
	"status" "assessment_status" DEFAULT 'SELF_ASSESSING',
	"feedback" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_skills" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"skill_id" integer NOT NULL,
	"level_id" integer NOT NULL,
	"assessed_at" date,
	"note" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_code" varchar(50) NOT NULL,
	"email" varchar(150) NOT NULL,
	"phone" varchar(20),
	"password_hash" varchar(255) NOT NULL,
	"role_id" integer,
	"team_id" integer,
	"career_band_id" integer,
	"status" "user_status" DEFAULT 'ACTIVE',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token" varchar(255) NOT NULL,
	"type" "verification_type" NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "work_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" "request_type" NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"reason" text,
	"approver_id" integer,
	"status" "request_status" DEFAULT 'PENDING',
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_logs" ADD CONSTRAINT "attendance_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competencies" ADD CONSTRAINT "competencies_group_id_competency_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."competency_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competency_levels" ADD CONSTRAINT "competency_levels_competency_id_competencies_id_fk" FOREIGN KEY ("competency_id") REFERENCES "public"."competencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competency_requirements" ADD CONSTRAINT "competency_requirements_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competency_requirements" ADD CONSTRAINT "competency_requirements_career_band_id_career_bands_id_fk" FOREIGN KEY ("career_band_id") REFERENCES "public"."career_bands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competency_requirements" ADD CONSTRAINT "competency_requirements_competency_id_competencies_id_fk" FOREIGN KEY ("competency_id") REFERENCES "public"."competencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cv_attachments" ADD CONSTRAINT "cv_attachments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "education_experience" ADD CONSTRAINT "education_experience_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idp_activities" ADD CONSTRAINT "idp_activities_idp_id_individual_development_plans_id_fk" FOREIGN KEY ("idp_id") REFERENCES "public"."individual_development_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idp_activities" ADD CONSTRAINT "idp_activities_competency_id_competencies_id_fk" FOREIGN KEY ("competency_id") REFERENCES "public"."competencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "individual_development_plans" ADD CONSTRAINT "individual_development_plans_user_assessment_id_user_assessments_id_fk" FOREIGN KEY ("user_assessment_id") REFERENCES "public"."user_assessments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "individual_development_plans" ADD CONSTRAINT "individual_development_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_update_requests" ADD CONSTRAINT "profile_update_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_update_requests" ADD CONSTRAINT "profile_update_requests_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_criteria" ADD CONSTRAINT "skill_criteria_level_id_skill_levels_id_fk" FOREIGN KEY ("level_id") REFERENCES "public"."skill_levels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_levels" ADD CONSTRAINT "skill_levels_skill_id_master_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."master_skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_assessment_details" ADD CONSTRAINT "user_assessment_details_user_assessment_id_user_assessments_id_fk" FOREIGN KEY ("user_assessment_id") REFERENCES "public"."user_assessments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_assessment_details" ADD CONSTRAINT "user_assessment_details_competency_id_competencies_id_fk" FOREIGN KEY ("competency_id") REFERENCES "public"."competencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_assessments" ADD CONSTRAINT "user_assessments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_assessments" ADD CONSTRAINT "user_assessments_cycle_id_assessment_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."assessment_cycles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_skill_id_master_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."master_skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_level_id_skill_levels_id_fk" FOREIGN KEY ("level_id") REFERENCES "public"."skill_levels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_career_band_id_career_bands_id_fk" FOREIGN KEY ("career_band_id") REFERENCES "public"."career_bands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_tokens" ADD CONSTRAINT "verification_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_requests" ADD CONSTRAINT "work_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_requests" ADD CONSTRAINT "work_requests_approver_id_users_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "users_employee_code_unique" ON "users" USING btree ("employee_code") WHERE "users"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email") WHERE "users"."deleted_at" is null;