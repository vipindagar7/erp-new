// backend/modules/skillcard/skillcard.service.js
import prisma from "../../utils/prisma.js";

// Skill Card template entries per semester (based on PDF)
const SEMESTER_TEMPLATES = {
  1: [
    { entry_no:1, course_name:"Semester 1 Offline Training", provider:"Institute", duration:"30 hrs", type:"INSTITUTE_OFFLINE" },
    { entry_no:2, course_name:"Microsoft 365 & Copilot Productivity Workshop", provider:"Microsoft", duration:"1 Day", type:"COMPANY_WORKSHOP" },
    { entry_no:3, course_name:"IBM SkillsBuild Digital & AI Literacy Workshop + Cyber Awareness", provider:"IBM", duration:"1 Day", type:"COMPANY_WORKSHOP" },
    { entry_no:4, course_name:"Self-Learning: GitHub Learning Paths", provider:"Microsoft", duration:"8 hrs", type:"SELF_LEARNING", course_url:"learn.microsoft.com/en-us/training/paths/copilot" },
    { entry_no:5, course_name:"Self-Learning: Getting Started with Artificial Intelligence", provider:"IBM", duration:"3 hrs", type:"SELF_LEARNING", course_url:"skillsbuild.org/college-students/course-catalog" },
    { entry_no:6, course_name:"Self-Learning: Oracle SQL Explorer", provider:"Oracle", duration:"8-10 hrs", type:"SELF_LEARNING", course_url:"learn.oracle.com/ols/learning-path/oracle-sql-explorer" },
    { entry_no:7, course_name:"Self-Learning: Getting Started with Salesforce", provider:"Salesforce", duration:"10 hrs", type:"SELF_LEARNING" },
    { entry_no:8, course_name:"Self-Learning: Responsive Web Design", provider:"freeCodeCamp", duration:"Self-paced", type:"SELF_LEARNING" },
  ],
  2: [
    { entry_no:1, course_name:"Semester 2 Offline Training", provider:"Institute", duration:"30 hrs", type:"INSTITUTE_OFFLINE" },
    { entry_no:2, course_name:"Workshop: GitHub & GitHub Copilot Coding Workshop", provider:"Microsoft", duration:"1 Day", type:"COMPANY_WORKSHOP" },
    { entry_no:3, course_name:"Workshop: Python, Data & Generative AI Workshop + Cyber Awareness", provider:"IBM", duration:"1-2 Days", type:"COMPANY_WORKSHOP" },
    { entry_no:4, course_name:"Self-Learning: MySQL Explorer", provider:"Oracle", duration:"8-10 hrs", type:"SELF_LEARNING", course_url:"learn.oracle.com" },
    { entry_no:5, course_name:"Self-Learning: Write Your First C# Code", provider:"Microsoft", duration:"15 hrs", type:"SELF_LEARNING" },
    { entry_no:6, course_name:"Self-Learning: Data Fundamentals", provider:"IBM", duration:"7 hrs", type:"SELF_LEARNING" },
    { entry_no:7, course_name:"Self-Learning: Business Analytics with Excel (SkillUp)", provider:"Simplilearn", duration:"4-5 hrs", type:"SELF_LEARNING" },
    { entry_no:8, course_name:"Self-Learning: Introduction to Cybersecurity", provider:"Cisco NetAcad", duration:"6 hrs", type:"SELF_LEARNING" },
  ],
  3: [
    { entry_no:1, course_name:"Semester 3 Offline Training", provider:"Institute", duration:"30 hrs", type:"INSTITUTE_OFFLINE" },
    { entry_no:2, course_name:"Workshop: Microsoft Azure Cloud Workshop", provider:"Microsoft", duration:"1-2 Days", type:"COMPANY_WORKSHOP" },
    { entry_no:3, course_name:"Workshop: Generative AI Application Workshop + Cyber Awareness", provider:"IBM", duration:"2 Days", type:"COMPANY_WORKSHOP" },
    { entry_no:4, course_name:"Self-Learning: Azure Fundamentals Learning Collection", provider:"Microsoft", duration:"18 hrs", type:"SELF_LEARNING" },
    { entry_no:5, course_name:"Self-Learning: Oracle Cloud Infrastructure (OCI) Explorer", provider:"Oracle", duration:"8-10 hrs", type:"SELF_LEARNING" },
    { entry_no:6, course_name:"Self-Learning: Foundations of Prompt Engineering", provider:"AWS", duration:"4 hrs", type:"SELF_LEARNING" },
    { entry_no:7, course_name:"Self-Learning: IBM zSystems Cybersecurity Insights Badge", provider:"IBM", duration:"4-5 hrs", type:"SELF_LEARNING" },
    { entry_no:8, course_name:"Self-Learning: Google Cloud Computing Foundations", provider:"Google Cloud", duration:"Module-based", type:"SELF_LEARNING" },
  ],
  4: [
    { entry_no:1, course_name:"Semester 4 Offline Training", provider:"Institute", duration:"30 hrs", type:"INSTITUTE_OFFLINE" },
    { entry_no:2, course_name:"Workshop: Generative AI with Microsoft Foundry Workshop", provider:"Microsoft", duration:"2 Days", type:"COMPANY_WORKSHOP" },
    { entry_no:3, course_name:"Workshop: IBM Cybersecurity Fundamentals Workshop + Cyber Awareness", provider:"IBM", duration:"1-2 Days", type:"COMPANY_WORKSHOP" },
    { entry_no:4, course_name:"Self-Learning: Meta Ads Manager", provider:"Meta", duration:"3 hrs", type:"SELF_LEARNING" },
    { entry_no:5, course_name:"Self-Learning: Cybersecurity Fundamentals", provider:"IBM", duration:"7.5 hrs", type:"SELF_LEARNING" },
    { entry_no:6, course_name:"Self-Learning: Azure AI Fundamentals Certification", provider:"Microsoft", duration:"8 hrs", type:"SELF_LEARNING" },
    { entry_no:7, course_name:"Self-Learning: Oracle APEX Explorer", provider:"Oracle", duration:"8-10 hrs", type:"SELF_LEARNING" },
    { entry_no:8, course_name:"Self-Learning: Developer Beginner (Salesforce)", provider:"Salesforce", duration:"14 hr 10 min", type:"SELF_LEARNING" },
  ],
  5: [
    { entry_no:1, course_name:"Semester 5 Offline Training", provider:"Institute", duration:"30 hrs", type:"INSTITUTE_OFFLINE" },
    { entry_no:2, course_name:"Workshop: Power BI & Microsoft Fabric Data Analytics Workshop", provider:"Microsoft", duration:"1-2 Days", type:"COMPANY_WORKSHOP" },
    { entry_no:3, course_name:"Workshop: IBM Data Science & Analytics Workshop + Cyber Awareness", provider:"IBM", duration:"2 Days", type:"COMPANY_WORKSHOP" },
    { entry_no:4, course_name:"Self-Learning: Generative AI Explained", provider:"NVIDIA", duration:"Self-paced", type:"SELF_LEARNING" },
    { entry_no:5, course_name:"Self-Learning: Artificial Intelligence Practitioner Pathway", provider:"IBM", duration:"10+ hrs", type:"SELF_LEARNING" },
    { entry_no:6, course_name:"Self-Learning: Data Science Essentials with Python", provider:"Cisco NetAcad", duration:"~40 hrs", type:"SELF_LEARNING" },
    { entry_no:7, course_name:"Self-Learning: Machine Learning with Python", provider:"freeCodeCamp", duration:"~18 hrs", type:"SELF_LEARNING" },
    { entry_no:8, course_name:"Self-Learning: AI for You Explorer", provider:"Oracle", duration:"6-8 hrs", type:"SELF_LEARNING" },
  ],
  6: [
    { entry_no:1, course_name:"Semester 6 Offline Training", provider:"Institute", duration:"30 hrs", type:"INSTITUTE_OFFLINE" },
    { entry_no:2, course_name:"Workshop: AI Agents with Microsoft Foundry Workshop", provider:"Microsoft", duration:"2 Days", type:"COMPANY_WORKSHOP" },
    { entry_no:3, course_name:"Workshop: IBM Cloud & AI Solutions Workshop", provider:"IBM", duration:"2 Days", type:"COMPANY_WORKSHOP" },
    { entry_no:4, course_name:"Self-Learning: Microsoft Applied Skills", provider:"Microsoft", duration:"20 hrs", type:"SELF_LEARNING" },
    { entry_no:5, course_name:"Self-Learning: Introduction to NVIDIA NIM Microservices", provider:"NVIDIA", duration:"Self-paced", type:"SELF_LEARNING" },
    { entry_no:6, course_name:"Self-Learning: Oracle AI Foundations", provider:"Oracle", duration:"8-10 hrs", type:"SELF_LEARNING" },
    { entry_no:7, course_name:"Self-Learning: Google Cloud Generative AI Leader Certification", provider:"Google Cloud", duration:"10-20 hrs", type:"SELF_LEARNING" },
  ],
  7: [
    { entry_no:1, course_name:"Semester 7 Offline Training + Placement Prep", provider:"Institute", duration:"—", type:"INSTITUTE_OFFLINE" },
    { entry_no:2, course_name:"Workshop: Advanced AI & Cloud Application Workshop", provider:"Microsoft", duration:"2 Days", type:"COMPANY_WORKSHOP" },
    { entry_no:3, course_name:"Workshop: Advanced AI, Data & Cybersecurity Project Workshop", provider:"IBM", duration:"2-3 Days", type:"COMPANY_WORKSHOP" },
    { entry_no:4, course_name:"Self-Learning: Analytics & Reporting", provider:"Meta", duration:"3 hrs", type:"SELF_LEARNING" },
    { entry_no:5, course_name:"Self-Learning: Data Analytics Job Simulation", provider:"Deloitte (Forage)", duration:"1-2 hrs", type:"SELF_LEARNING" },
    { entry_no:6, course_name:"Self-Learning: Career Essentials in Generative AI", provider:"Microsoft/LinkedIn", duration:"4-5 hrs", type:"SELF_LEARNING" },
    { entry_no:7, course_name:"Self-Learning: Operations & Industrial Engineering Job Simulation", provider:"Siemens (Forage)", duration:"2-3 hrs", type:"SELF_LEARNING" },
    { entry_no:8, course_name:"Self-Learning: Building Apps Powered by Generative AI", provider:"FutureSkills Prime", duration:"~30 hrs", type:"SELF_LEARNING" },
  ],
  8: [
    { entry_no:1, course_name:"Semester 8 Major Project / Internship", provider:"Institute", duration:"—", type:"INSTITUTE_OFFLINE" },
    { entry_no:2, course_name:"Workshop: Microsoft Innovation Hackathon", provider:"Microsoft", duration:"2-3 Days", type:"COMPANY_WORKSHOP" },
    { entry_no:3, course_name:"Workshop: IBM SkillsBuild Innovation Hackathon", provider:"IBM", duration:"2-3 Days", type:"COMPANY_WORKSHOP" },
    { entry_no:4, course_name:"Self-Learning: Agentic AI Foundations", provider:"Oracle", duration:"8-10 hrs", type:"SELF_LEARNING" },
    { entry_no:5, course_name:"Self-Learning: DevOps Engineer Learning Path", provider:"Google Cloud", duration:"Path-based", type:"SELF_LEARNING" },
    { entry_no:6, course_name:"Self-Learning: Certification Preparation + Capstone Learning Path", provider:"Meta", duration:"4+4 hrs", type:"SELF_LEARNING" },
    { entry_no:7, course_name:"Self-Learning: Building AI Solutions Using Advanced Algorithms", provider:"IBM", duration:"10-20 hrs", type:"SELF_LEARNING" },
  ],
};

const getYearForSem = (sem) => Math.ceil(sem/2);

export const initSkillCard = async (student_id, { branch_id, program_id, domain_track, batch_year }, issued_by) => {
  const card = await prisma.studentSkillCard.upsert({
    where:  { student_id },
    update: { branch_id, program_id, domain_track, batch_year, issued_by, issued_at:new Date() },
    create: { student_id, branch_id, program_id, domain_track, batch_year, issued_by, issued_at:new Date() },
  });

  // Create all 8 semesters of entries from template
  const allEntries = [];
  for (let sem = 1; sem <= 8; sem++) {
    const template = SEMESTER_TEMPLATES[sem] || [];
    for (const t of template) {
      allEntries.push({ ...t, skill_card_id:card.id, student_id, year_no:getYearForSem(sem), semester_no:sem });
    }
  }

  await prisma.skillCardEntry.createMany({ data:allEntries, skipDuplicates:true });

  return prisma.studentSkillCard.findUnique({
    where: { student_id },
    include: { entries:{ orderBy:[{ semester_no:"asc" },{ entry_no:"asc" }] } },
  });
};

export const getSkillCard = async (student_id) =>
  prisma.studentSkillCard.findUnique({ where:{ student_id }, include: { entries:{ orderBy:[{ semester_no:"asc" },{ entry_no:"asc" }] } } });

export const updateEntry = async (entry_id, { is_completed, completion_date, certificate_url, is_verified, verified_by }) => {
  const data = {};
  if (is_completed !== undefined) data.is_completed = is_completed;
  if (completion_date) data.completion_date = new Date(completion_date);
  if (certificate_url) data.certificate_url = certificate_url;
  if (is_verified !== undefined) {
    data.is_verified = is_verified;
    if (is_verified) { data.verified_by = verified_by; data.verified_at = new Date(); }
  }
  const entry = await prisma.skillCardEntry.update({ where:{ id:entry_id }, data });

  // Recompute card totals
  const [total, completed] = await Promise.all([
    prisma.skillCardEntry.count({ where:{ skill_card_id:entry.skill_card_id } }),
    prisma.skillCardEntry.count({ where:{ skill_card_id:entry.skill_card_id, is_completed:true } }),
  ]);
  await prisma.studentSkillCard.update({ where:{ id:entry.skill_card_id }, data:{ total_entries:total, completed_entries:completed, last_updated:new Date() } });

  return entry;
};

export const bulkUpdateByTemplate = async (file_data) => {
  // file_data: [{ student_id, entry_id, is_completed, completion_date, certificate_url }]
  const results = [];
  for (const row of file_data) {
    try {
      const r = await updateEntry(row.entry_id, row);
      results.push({ student_id:row.student_id, entry_id:row.entry_id, success:true });
    } catch(e) {
      results.push({ student_id:row.student_id, entry_id:row.entry_id, success:false, error:e.message });
    }
  }
  return results;
};

export const getReadinessLevel = async (student_id) => {
  const card = await getSkillCard(student_id);
  if (!card) return null;
  const pct = card.total_entries > 0 ? (card.completed_entries / card.total_entries) * 100 : 0;
  let level = "FOUNDATIONAL";
  if (pct >= 50) level = "JOB_READY";
  if (pct >= 80) level = "PLACEMENT_READY";
  await prisma.studentSkillCard.update({ where:{ student_id }, data:{ readiness_level:level } });
  return { student_id, completed_pct:+pct.toFixed(1), level };
};

export const bulkInitForSection = async (section_id, card_data, issued_by) => {
  const students = await prisma.student.findMany({ where:{ section_id, status:"ACTIVE" }, select:{ id:true } });
  const results  = [];
  for (const s of students) {
    try {
      const r = await initSkillCard(s.id, card_data, issued_by);
      results.push({ student_id:s.id, success:true, card_id:r.id });
    } catch(e) {
      results.push({ student_id:s.id, success:false, error:e.message });
    }
  }
  return results;
};

export const getMentorView = async (faculty_id, section_id) => {
  const students = await prisma.student.findMany({
    where: { section_id, status:"ACTIVE" },
    select: { id:true, name:true, roll_no:true, skillCard:{ include:{ entries:{ orderBy:[{ semester_no:"asc" },{ entry_no:"asc" }] } } } },
  });
  return students;
};
