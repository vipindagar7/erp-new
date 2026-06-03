import * as svc from "./curriculum.service.js";

const ok   = (res, data, msg = "OK", code = 200) => res.status(code).json({ success: true, message: msg, data });
const fail = (res, e, next) => { if (e.statusCode) return res.status(e.statusCode).json({ success: false, message: e.message }); next(e); };

export const getCurriculum        = async (req, res, next) => { try { ok(res, await svc.getCurriculum(req.query)); }                                      catch (e) { fail(res, e, next); } };
export const addSubject           = async (req, res, next) => { try { ok(res, await svc.addCurriculumSubject(req.body), "Added", 201); }                  catch (e) { fail(res, e, next); } };
export const bulkAdd              = async (req, res, next) => { try { ok(res, await svc.bulkAddCurriculumSubjects(req.body), "Subjects added", 201); }     catch (e) { fail(res, e, next); } };
export const removeSubject        = async (req, res, next) => { try { ok(res, await svc.removeCurriculumSubject(req.params.id), "Removed"); }              catch (e) { fail(res, e, next); } };
export const copySemester         = async (req, res, next) => { try { ok(res, await svc.copySemesterCurriculum(req.body), "Copied"); }                    catch (e) { fail(res, e, next); } };
export const autoAssignSection    = async (req, res, next) => { try { ok(res, await svc.autoAssignSubjectsToSection(req.params.section_id), "Auto-assigned"); } catch (e) { fail(res, e, next); } };
export const bulkAutoAssign       = async (req, res, next) => { try { ok(res, await svc.bulkAutoAssign(req.body.section_ids || []), "Bulk auto-assigned"); } catch (e) { fail(res, e, next); } };

export const getCurriculumTemplate = async (req, res, next) => {
  try {
    const { buffer, filename } = await svc.getCurriculumTemplate();
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (e) { fail(res, e, next); }
};

export const bulkUploadCurriculum = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "Excel file required" });
    const results = await svc.bulkUploadCurriculum(req.file.buffer);
    ok(res, results, `${results.created} added, ${results.updated} updated, ${results.failed.length} failed`);
  } catch (e) { fail(res, e, next); }
};