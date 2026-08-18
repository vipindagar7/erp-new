import "dotenv/config";
import bcrypt from "bcrypt";
import prisma from "./utils/prisma.js";

const EMAIL = process.env.SUPER_ADMIN_EMAIL || "vipindagar@eitfaridabad.co.in";
const PASSWORD = process.env.SUPER_ADMIN_PASSWORD || "Admin@1234";

// ─────────────────────────────────────────────────────────────
// Permission catalog — every key the app checks via requirePerm().
// SUPER_ADMIN bypasses this table entirely (hardcoded in
// auth.middleware.js), but custom roles created via Access Roles
// need these rows to exist before they can be granted to a role.
// This is why "create role" + "assign permissions" silently did
// nothing useful before: the Permission table was empty.
// ─────────────────────────────────────────────────────────────
const PERMISSIONS = [
    { key: "roles.view", module: "roles", action: "view", label: "View Access Roles" },
    { key: "roles.create", module: "roles", action: "create", label: "Create Access Roles" },
    { key: "roles.update", module: "roles", action: "update", label: "Edit Access Roles" },
    { key: "roles.delete", module: "roles", action: "delete", label: "Delete Access Roles" },
    { key: "roles.assign", module: "roles", action: "assign", label: "Assign/Revoke Access Roles" },

    { key: "students.view", module: "students", action: "view", label: "View Students" },
    { key: "students.create", module: "students", action: "create", label: "Create Students" },
    { key: "students.update", module: "students", action: "update", label: "Edit Students" },
    { key: "students.delete", module: "students", action: "delete", label: "Delete Students" },
    { key: "students.export", module: "students", action: "export", label: "Export Students" },
    { key: "students.promote", module: "students", action: "promote", label: "Promote/Demote Students" },

    { key: "faculty.view", module: "faculty", action: "view", label: "View Faculty" },
    { key: "faculty.create", module: "faculty", action: "create", label: "Create Faculty" },
    { key: "faculty.update", module: "faculty", action: "update", label: "Edit Faculty" },
    { key: "faculty.delete", module: "faculty", action: "delete", label: "Delete Faculty" },
    { key: "faculty.export", module: "faculty", action: "export", label: "Export Faculty" },

    { key: "admins.view", module: "admins", action: "view", label: "View Admins" },
    { key: "admins.create", module: "admins", action: "create", label: "Create Admins" },
    { key: "admins.update", module: "admins", action: "update", label: "Edit Admins" },
    { key: "admins.delete", module: "admins", action: "delete", label: "Delete Admins" },

    { key: "academic.view", module: "academic", action: "view", label: "View Academic Structure" },
    { key: "academic.create", module: "academic", action: "create", label: "Create Departments/Programs/Courses" },
    { key: "academic.update", module: "academic", action: "update", label: "Edit Academic Structure" },
    { key: "academic.delete", module: "academic", action: "delete", label: "Delete Academic Structure" },

    { key: "sections.view", module: "sections", action: "view", label: "View Sections" },
    { key: "sections.create", module: "sections", action: "create", label: "Create Sections" },
    { key: "sections.update", module: "sections", action: "update", label: "Edit Sections" },
    { key: "sections.delete", module: "sections", action: "delete", label: "Delete Sections" },
    { key: "section:view_history", module: "sections", action: "view_history", label: "View Section History" },
    { key: "section:assign_subject", module: "sections", action: "assign_subject", label: "Assign Subjects to Section" },
    { key: "section:bulk_assign", module: "sections", action: "bulk_assign", label: "Bulk Assign Sections" },

    { key: "subjects.view", module: "subjects", action: "view", label: "View Subjects" },
    { key: "subjects.create", module: "subjects", action: "create", label: "Create Subjects" },
    { key: "subjects.update", module: "subjects", action: "update", label: "Edit Subjects" },
    { key: "subjects.delete", module: "subjects", action: "delete", label: "Delete Subjects" },
    { key: "subject:bulk_upload", module: "subjects", action: "bulk_upload", label: "Bulk Upload Subjects" },

    { key: "curriculum.view", module: "curriculum", action: "view", label: "View Curriculum" },
    { key: "curriculum.create", module: "curriculum", action: "create", label: "Create Curriculum" },
    { key: "curriculum.update", module: "curriculum", action: "update", label: "Edit Curriculum" },
    { key: "curriculum.delete", module: "curriculum", action: "delete", label: "Delete Curriculum" },

    { key: "enrollments.view", module: "enrollments", action: "view", label: "View Enrollments" },
    { key: "enrollments.create", module: "enrollments", action: "create", label: "Create Enrollments" },
    { key: "enrollments.update", module: "enrollments", action: "update", label: "Edit Enrollments" },
    { key: "enrollments.delete", module: "enrollments", action: "delete", label: "Delete Enrollments" },

    { key: "groups.view", module: "groups", action: "view", label: "View Groups" },
    { key: "groups.create", module: "groups", action: "create", label: "Create Groups" },
    { key: "groups.update", module: "groups", action: "update", label: "Edit Groups" },
    { key: "groups.delete", module: "groups", action: "delete", label: "Delete Groups" },

    { key: "feedback.view", module: "feedback", action: "view", label: "View Feedback" },
    { key: "feedback.create", module: "feedback", action: "create", label: "Create Feedback Forms" },
    { key: "feedback.update", module: "feedback", action: "update", label: "Edit Feedback Forms" },
    { key: "feedback.delete", module: "feedback", action: "delete", label: "Delete Feedback Forms" },
    { key: "feedback.results", module: "feedback", action: "results", label: "View Feedback Results" },
    { key: "feedback.bulk_submit", module: "feedback", action: "bulk_submit", label: "Bulk Submit Feedback" },

    { key: "reports.students", module: "reports", action: "students", label: "Student Reports" },
    { key: "reports.faculty", module: "reports", action: "faculty", label: "Faculty Reports" },
    { key: "reports.enrollments", module: "reports", action: "enrollments", label: "Enrollment Reports" },

    { key: "audit.view", module: "audit", action: "view", label: "View Audit Trail" },
    { key: "audit.export", module: "audit", action: "export", label: "Export Audit Logs" },
    { key: "audit.restore", module: "audit", action: "restore", label: "Restore Deleted Records" },

    { key: "admin.view", module: "admin", action: "view", label: "View Admin Activity" },
    { key: "admin.manage_roles", module: "admin", action: "manage_roles", label: "Manage Faculty Role Upgrades" },
];

async function seedPermissions() {
    for (const p of PERMISSIONS) {
        await prisma.permission.upsert({ where: { key: p.key }, update: {}, create: p });
    }
    console.log(`✅  Seeded ${PERMISSIONS.length} permissions`);
}

async function seedSuperAdmin() {
    const existing = await prisma.user.findUnique({ where: { email: EMAIL } });
    if (existing) {
        console.log(`ℹ️  Super admin already exists: ${EMAIL}`);
        return;
    }

    const hash = await bcrypt.hash(PASSWORD, 12);
    const user = await prisma.user.create({
        data: { email: EMAIL, passwordHash: hash, role: "ROOT", is_root: true },
    });
    await prisma.user.create({
        data: { email: 'shitalparsad@eitfaridabda.co.in', passwordHash: hash, role: "ROOT", is_root: true },
    });

    await prisma.admin.create({
        data: { name: "Super Admin", user: { connect: { id: user.id } } },
    });

    console.log(`✅  Super admin created`);
    console.log(`    Email:    ${EMAIL}`);
    console.log(`    Password: ${PASSWORD}`);
}

async function seed() {
    await seedSuperAdmin();
    await seedPermissions();
}

seed()
    .then(() => prisma.$disconnect())
    .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });