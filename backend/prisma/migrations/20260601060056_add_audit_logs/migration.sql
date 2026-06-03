-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "user_email" TEXT,
    "user_role" TEXT,
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "record_id" TEXT,
    "record_label" TEXT,
    "prev_data" JSONB,
    "new_data" JSONB,
    "changed_fields" TEXT[],
    "ip" TEXT,
    "user_agent" TEXT,
    "reversible" BOOLEAN NOT NULL DEFAULT false,
    "restored_at" TIMESTAMP(3),
    "restored_by" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_user_id_idx" ON "AuditLog"("user_id");

-- CreateIndex
CREATE INDEX "AuditLog_module_record_id_idx" ON "AuditLog"("module", "record_id");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
