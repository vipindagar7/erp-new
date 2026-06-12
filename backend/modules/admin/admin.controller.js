// backend/modules/admin/admin.controller.js
import * as adminService from "./admin.service.js";

export async function getDashboard(req, res) {
  try {
    const data = await adminService.getDashboardStats();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getDashboardActivity(req, res) {
  try {
    const data = await adminService.getActivityFeed();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getAll(req, res) {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const result = await adminService.listAdmins({ page: Number(page), limit: Number(limit), search });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getOne(req, res) {
  try {
    const data = await adminService.getAdminById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function create(req, res) {
  try {
    const result = await adminService.createAdmin(req.validatedData ?? req.body);
    if (result?.error === "email_taken")
      return res.status(409).json({ success: false, message: "Email already in use" });
    res.status(201).json({ success: true, data: result.admin });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function update(req, res) {
  try {
    const data = await adminService.updateAdmin(req.params.id, req.validatedData ?? req.body);
    if (!data) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function remove(req, res) {
  try {
    const result = await adminService.deleteAdmin(req.params.id, req.user.id);
    if (result?.error === "not_found")
      return res.status(404).json({ success: false, message: "Not found" });
    if (result?.error === "cannot_delete_super_admin")
      return res.status(403).json({ success: false, message: "Cannot delete Super Admin" });
    if (result?.error === "cannot_delete_self")
      return res.status(403).json({ success: false, message: "Cannot delete your own account" });
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function blockUser(req, res) {
  try {
    const data = await adminService.toggleBlock(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function resetPassword(req, res) {
  try {
    await adminService.resetUserPassword(req.params.id, req.body?.newPassword);
    res.json({ success: true, message: "Password reset successfully" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function impersonate(req, res) {
  try {
    const result = await adminService.impersonateUser(req.params.id, req.user.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function updatePermissions(req, res) {
  try {
    const data = await adminService.updatePermissions(req.params.id, req.body?.permissions);
    if (!data) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function getPermissions(req, res) {
  try {
    const data = await adminService.getAdminById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: { permissions: data.permissions } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function exportStudents(req, res) {
  try {
    const buffer = await adminService.exportStudentsBySection(req.query?.section_id);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="students-report.xlsx"');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function exportFaculty(req, res) {
  try {
    const buffer = await adminService.exportFacultyReport();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="faculty-report.xlsx"');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function exportEnrollments(req, res) {
  try {
    const buffer = await adminService.exportEnrollmentReport();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="enrollment-report.xlsx"');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function getStudentAnalytics(req, res) {
  try {
    const data = await adminService.getStudentAnalytics();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
 
export async function exportStudentsAdvanced(req, res) {
  try {
    const buffer = await adminService.exportStudentsAdvanced(req.query);
    const filename = `students-export-${new Date().toISOString().slice(0,10)}.xlsx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}