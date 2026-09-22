// backend/scripts/syncStudentSessionWithSection.js
//
// One-time backfill: Section.academic_year and Student.session must always
// match. Going forward, section.service.js's updateSection() keeps them in
// sync on every edit — but any section/student pairs that were already out
// of sync in the DB before that fix need to be corrected once, here.
//
// Usage:
//   node backend/scripts/syncStudentSessionWithSection.js           # dry run — reports only
//   node backend/scripts/syncStudentSessionWithSection.js --apply   # actually writes the fix
//
import prisma from "../utils/prisma.js";

const APPLY = process.argv.includes("--apply");

async function main() {
  console.log(APPLY ? "Running LIVE — DB will be updated." : "Running DRY RUN — no writes. Pass --apply to commit.");
  console.log("");

  const sections = await prisma.section.findMany({
    where: { deleted_at: null },
    select: { id: true, code: true, name: true, academic_year: true },
  });

  let sectionsWithMismatches = 0;
  let studentsFixed = 0;
  let studentsWithNullSection = 0;

  for (const section of sections) {
    // Students in this section whose session doesn't match — including NULL,
    // since a never-set session field also counts as "out of sync".
    const mismatched = await prisma.student.findMany({
      where: {
        section_id: section.id,
        deleted_at: null,
        session: { not: section.academic_year },
      },
      select: { id: true, name: true, roll_no: true, session: true },
    });

    if (mismatched.length === 0) continue;

    sectionsWithMismatches++;
    console.log(`Section ${section.code || section.name} (academic_year="${section.academic_year ?? "null"}") — ${mismatched.length} student(s) out of sync:`);
    for (const s of mismatched) {
      console.log(`  - ${s.name} (${s.roll_no || s.id}): session was "${s.session ?? "null"}"`);
    }

    if (APPLY) {
      const r = await prisma.student.updateMany({
        where: { section_id: section.id, deleted_at: null, session: { not: section.academic_year } },
        data: { session: section.academic_year },
      });
      studentsFixed += r.count;
    }
  }

  // Students with no section at all — nothing to sync them against; just report.
  studentsWithNullSection = await prisma.student.count({
    where: { section_id: null, deleted_at: null, session: { not: null } },
  });

  console.log("");
  console.log("── Summary ──────────────────────────────────");
  console.log(`Sections with mismatched students: ${sectionsWithMismatches}`);
  console.log(APPLY
    ? `Students fixed: ${studentsFixed}`
    : `Students that WOULD be fixed (run with --apply to commit)`);
  if (studentsWithNullSection > 0) {
    console.log(`Note: ${studentsWithNullSection} student(s) have no section_id but a non-null session — left untouched, not sure what they should map to. Review manually.`);
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("Script failed:", e);
  await prisma.$disconnect();
  process.exit(1);
});
