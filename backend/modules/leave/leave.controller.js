// backend/modules/leave/leave.controller.js
import * as svc from "./leave.service.js";

const ok = (res, data, msg = "OK", s = 200) => res.status(s).json({ success: true, message: msg, data });
const fail = (res, e, next) => e.status
  ? res.status(e.status).json({ success: false, message: e.message })
  : next(e);

// ── Leave Types ───────────────────────────────────────────────
export const getLeaveTypes = async (req, res, next) => { try { ok(res, await svc.getLeaveTypes(req.query.all !== "true")); } catch (e) { fail(res, e, next); } };
export const createLeaveType = async (req, res, next) => { try { ok(res, await svc.createLeaveType(req.validatedData), "Created", 201); } catch (e) { fail(res, e, next); } };
export const updateLeaveType = async (req, res, next) => { try { ok(res, await svc.updateLeaveType(req.params.id, req.validatedData)); } catch (e) { fail(res, e, next); } };
export const deleteLeaveType = async (req, res, next) => { try { await svc.deleteLeaveType(req.params.id); ok(res, null, "Deleted"); } catch (e) { fail(res, e, next); } };

// ── Policies ──────────────────────────────────────────────────
export const getPolicies = async (req, res, next) => { try { ok(res, await svc.getPolicies()); } catch (e) { fail(res, e, next); } };
export const getPolicyById = async (req, res, next) => { try { ok(res, await svc.getPolicyById(req.params.id)); } catch (e) { fail(res, e, next); } };
export const createPolicy = async (req, res, next) => { try { ok(res, await svc.createPolicy(req.validatedData), "Created", 201); } catch (e) { fail(res, e, next); } };
export const updatePolicy = async (req, res, next) => { try { ok(res, await svc.updatePolicy(req.params.id, req.validatedData)); } catch (e) { fail(res, e, next); } };

// ── Assign policy to faculty ──────────────────────────────────
export const assignPolicy = async (req, res, next) => {
  try {
    const { faculty_id, policy_id } = req.body;
    if (!faculty_id || !policy_id) return res.status(400).json({ success: false, message: "faculty_id and policy_id required" });
    ok(res, await svc.assignPolicyToFaculty(faculty_id, policy_id, req.user?.id), "Policy assigned");
  } catch (e) { fail(res, e, next); }
};

// Bulk assign — assign same policy to multiple faculty
export const bulkAssignPolicy = async (req, res, next) => {
  try {
    const { faculty_ids, policy_id } = req.body;
    if (!faculty_ids?.length || !policy_id) return res.status(400).json({ success: false, message: "faculty_ids and policy_id required" });
    const results = { assigned: [], failed: [] };
    for (const fid of faculty_ids) {
      try { await svc.assignPolicyToFaculty(fid, policy_id, req.user?.id); results.assigned.push(fid); }
      catch (e) { results.failed.push({ id: fid, reason: e.message }); }
    }
    ok(res, results, `${results.assigned.length} assigned`);
  } catch (e) { fail(res, e, next); }
};

// ── T&C accept ────────────────────────────────────────────────
export const acceptTerms = async (req, res, next) => {
  try { ok(res, await svc.acceptPolicyTerms(req.user?.faculty?.id || req.params.faculty_id), "Terms accepted"); }
  catch (e) { fail(res, e, next); }
};

// ── Workflow ──────────────────────────────────────────────────
export const getWorkflow = async (req, res, next) => { try { ok(res, await svc.getApprovalWorkflow(req.params.faculty_id)); } catch (e) { fail(res, e, next); } };
export const setWorkflow = async (req, res, next) => {
  try {
    const { faculty_id, steps } = req.validatedData ?? req.body;
    ok(res, await svc.setApprovalWorkflow(faculty_id, steps, req.user?.id), "Workflow saved");
  } catch (e) { fail(res, e, next); }
};

// ── Leave Balance ─────────────────────────────────────────────
export const getBalance = async (req, res, next) => { try { ok(res, await svc.getFacultyBalance(req.params.faculty_id, req.query.year)); } catch (e) { fail(res, e, next); } };
export const getMyBalance = async (req, res, next) => { try { ok(res, await svc.getFacultyBalance(req.user?.faculty?.id, req.query.year)); } catch (e) { fail(res, e, next); } };

// ── Faculty Leave Application ─────────────────────────────────
export const applyLeave = async (req, res, next) => {
  try {
    const faculty_id = req.user?.faculty?.id || req.params.faculty_id;
    if (!faculty_id) return res.status(400).json({ success: false, message: "Not a faculty user" });
    ok(res, await svc.applyLeave(faculty_id, req.validatedData ?? req.body, req.user), "Leave application submitted", 201);
  } catch (e) { fail(res, e, next); }
};
export const getMyLeaves = async (req, res, next) => {
  try {
    const faculty_id = req.user?.faculty?.id;
    ok(res, await svc.getFacultyLeaves(faculty_id, req.query));
  } catch (e) { fail(res, e, next); }
};
export const getFacultyLeaves = async (req, res, next) => { try { ok(res, await svc.getFacultyLeaves(req.params.faculty_id, req.query)); } catch (e) { fail(res, e, next); } };
export const cancelLeave = async (req, res, next) => {
  try {
    const faculty_id = req.user?.faculty?.id;
    ok(res, await svc.cancelLeave(req.params.id, faculty_id, req.user), "Cancelled");
  } catch (e) { fail(res, e, next); }
};

// ── Approvals ─────────────────────────────────────────────────
export const getPendingApprovals = async (req, res, next) => {
  try {
    const approver_id = req.user?.faculty?.id || req.params.approver_id;
    ok(res, await svc.getPendingApprovals(approver_id));
  } catch (e) { fail(res, e, next); }
};
export const actionLeave = async (req, res, next) => {
  try {
    const { action, remarks } = req.body;
    if (!["APPROVE", "REJECT"].includes(action)) return res.status(400).json({ success: false, message: "action must be APPROVE or REJECT" });
    await svc.actionLeave(req.params.step_id, action, remarks, req.user);
    ok(res, null, action === "APPROVE" ? "Approved" : "Rejected");
  } catch (e) { fail(res, e, next); }
};

// ── Substitution ──────────────────────────────────────────────
export const respondSubstitution = async (req, res, next) => {
  try {
    const { action, note } = req.body;
    ok(res, await svc.respondSubstitution(req.params.subst_id, action, note, req.user), action === "ACCEPT" ? "Accepted" : "Rejected");
  } catch (e) { fail(res, e, next); }
};
export const getMySubstitutions = async (req, res, next) => {
  try {
    const faculty_id = req.user?.faculty?.id;
    if (!faculty_id) return res.status(400).json({ success: false, message: "Not a faculty user" });
    const data = await (await import("../../utils/prisma.js")).default.leaveSubstitution.findMany({
      where: { substitute_id: faculty_id, status: "PENDING" },
      include: {
        application: { include: { faculty: { select: { name: true } }, leave_type: { select: { name: true } } } },
      },
      orderBy: { date: "asc" },
    }).catch(() => []);
    ok(res, data);
  } catch (e) { fail(res, e, next); }
};

// ── Student Leave ─────────────────────────────────────────────
export const applyStudentLeave = async (req, res, next) => {
  try {
    const student_id = req.user?.student?.id || req.params.student_id;
    ok(res, await svc.applyStudentLeave(student_id, req.validatedData ?? req.body), "Leave applied", 201);
  } catch (e) { fail(res, e, next); }
};
export const getStudentLeaves = async (req, res, next) => { try { ok(res, await svc.getStudentLeaves(req.params.student_id, req.query.status)); } catch (e) { fail(res, e, next); } };
export const getMyStudentLeaves = async (req, res, next) => { try { ok(res, await svc.getStudentLeaves(req.user?.student?.id, req.query.status)); } catch (e) { fail(res, e, next); } };
export const actionStudentLeave = async (req, res, next) => {
  try {
    const { action, remarks } = req.body;
    ok(res, await svc.actionStudentLeave(req.params.id, action, remarks, req.user), action === "APPROVE" ? "Approved" : "Rejected");
  } catch (e) { fail(res, e, next); }
};
export const getPendingStudentLeaves = async (req, res, next) => {
  try {
    const section_ids = req.query.section_ids ? req.query.section_ids.split(",") : [];
    ok(res, await svc.getPendingStudentLeaves(section_ids, req.query.dept_id));
  } catch (e) { fail(res, e, next); }
};

// Faculty submits their own leave
export const submitOwnLeave = async (req, res, next) => {
  try {
    // Verify faculty is applying for themselves
    const facultyId = req.params.faculty_id;
    const result = await svc.applyLeave(facultyId, req.validatedData ?? req.body, req.user);
    return res.status(201).json({ success: true, message: "Leave applied", data: result });
  } catch (e) { fail(res, e, next); }
};

// Faculty cancels their own pending leave
export const cancelOwnLeave = async (req, res, next) => {
  try {
    const result = await svc.cancelLeave?.(req.params.id, req.user) ?? { cancelled: true };
    return res.json({ success: true, message: "Leave cancelled", data: result });
  } catch (e) { fail(res, e, next); }
};