-- Create enums
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'ATTENDANT');
CREATE TYPE "AttendanceStatus" AS ENUM ('PENDENTE', 'EM_ATENDIMENTO', 'SEM_RETORNO', 'RETORNAR_DEPOIS', 'RESOLVIDO', 'VIROU_OS', 'CANCELADO');

CREATE TABLE "users" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "password_hash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "must_change_password" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "created_by" TEXT,
  "last_login_at" TIMESTAMP(3)
);

CREATE TABLE "attendances" (
  "id" TEXT PRIMARY KEY,
  "protocol" TEXT NOT NULL UNIQUE,
  "customer_name" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "original_attendant_name" TEXT NOT NULL,
  "reference_date" TIMESTAMP(3) NOT NULL,
  "status" "AttendanceStatus" NOT NULL DEFAULT 'PENDENTE',
  "assigned_to" TEXT,
  "assigned_at" TIMESTAMP(3),
  "contacted_at" TIMESTAMP(3),
  "service_result" TEXT,
  "outcome" TEXT,
  "notes" TEXT,
  "needs_follow_up" BOOLEAN NOT NULL DEFAULT false,
  "follow_up_date" TIMESTAMP(3),
  "became_service_order" BOOLEAN NOT NULL DEFAULT false,
  "service_order_number" TEXT,
  "service_order_justification" TEXT,
  "cancellation_reason" TEXT,
  "created_by" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_by" TEXT,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "closed_at" TIMESTAMP(3),
  "closed_by" TEXT,
  "canceled_at" TIMESTAMP(3),
  "canceled_by" TEXT,
  CONSTRAINT "attendances_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id")
);

CREATE TABLE "attendance_history" (
  "id" TEXT PRIMARY KEY,
  "attendance_id" TEXT NOT NULL,
  "action_type" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "performed_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "attendance_history_attendance_id_fkey" FOREIGN KEY ("attendance_id") REFERENCES "attendances"("id") ON DELETE CASCADE,
  CONSTRAINT "attendance_history_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "users"("id")
);

CREATE TABLE "audit_logs" (
  "id" TEXT PRIMARY KEY,
  "actor_user_id" TEXT,
  "entity_type" TEXT NOT NULL,
  "entity_id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "old_values" JSONB,
  "new_values" JSONB,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id")
);

CREATE INDEX "users_role_idx" ON "users"("role");
CREATE INDEX "users_is_active_idx" ON "users"("is_active");
CREATE INDEX "attendances_status_idx" ON "attendances"("status");
CREATE INDEX "attendances_assigned_to_idx" ON "attendances"("assigned_to");
CREATE INDEX "attendances_reference_date_idx" ON "attendances"("reference_date");
CREATE INDEX "attendances_customer_name_idx" ON "attendances"("customer_name");
CREATE INDEX "attendances_phone_idx" ON "attendances"("phone");
CREATE INDEX "attendance_history_attendance_id_idx" ON "attendance_history"("attendance_id");
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");
