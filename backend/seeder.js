import "dotenv/config";
import bcrypt from "bcrypt";
import prisma from "./utils/prisma.js";

const EMAIL = process.env.SUPER_ADMIN_EMAIL || "superadmin@college.edu";
const PASSWORD = process.env.SUPER_ADMIN_PASSWORD || "Admin@1234";

async function seed() {
    const existing = await prisma.user.findUnique({ where: { email: EMAIL } });
    if (existing) {
        console.log(`ℹ️  Super admin already exists: ${EMAIL}`);
        return;
    }

    const hash = await bcrypt.hash(PASSWORD, 12);
    const user = await prisma.user.create({
        data: {
            email: EMAIL,
            passwordHash: hash,
            role: "SUPER_ADMIN",
        },
    });

    await prisma.admin.create({
        data: { name: "Super Admin", user: { connect: { id: user.id } } },
    });

    console.log(`✅  Super admin created`);
    console.log(`    Email:    ${EMAIL}`);
    console.log(`    Password: ${PASSWORD}`);
}

seed()
    .then(() => prisma.$disconnect())
    .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });