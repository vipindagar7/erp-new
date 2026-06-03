-- CreateTable
CREATE TABLE "FacultyGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'OTHER',
    "created_by" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacultyGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacultyGroupMember" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "faculty_id" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FacultyGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FacultyGroup_type_idx" ON "FacultyGroup"("type");

-- CreateIndex
CREATE INDEX "FacultyGroupMember_group_id_idx" ON "FacultyGroupMember"("group_id");

-- CreateIndex
CREATE UNIQUE INDEX "FacultyGroupMember_group_id_faculty_id_key" ON "FacultyGroupMember"("group_id", "faculty_id");

-- AddForeignKey
ALTER TABLE "FacultyGroupMember" ADD CONSTRAINT "FacultyGroupMember_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "FacultyGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyGroupMember" ADD CONSTRAINT "FacultyGroupMember_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "Faculty"("id") ON DELETE CASCADE ON UPDATE CASCADE;
