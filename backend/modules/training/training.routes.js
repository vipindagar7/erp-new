// backend/modules/training/training.routes.js
import { Router } from "express";
import { authenticate, requirePerm } from "../../middlewares/auth.middleware.js";
import * as svc from "./training.service.js";

const router = Router();
const ok   = (res, data, msg = "OK", s = 200) => res.status(s).json({ success: true, message: msg, data });
const fail = (res, e, next) => e.status
  ? res.status(e.status).json({ success: false, message: e.message })
  : next(e);

router.use(authenticate);

// ── Training CRUD ─────────────────────────────────────────────
router.get(   "/",             requirePerm("training:view"),   async (req, res, next) => { try { ok(res, await svc.listTrainings(req.query));               } catch(e) { fail(res,e,next); } });
router.post(  "/",             requirePerm("training:create"), async (req, res, next) => { try { ok(res, await svc.createTraining(req.body, req.user.id), "Training created", 201); } catch(e) { fail(res,e,next); } });
router.get(   "/:id",          requirePerm("training:view"),   async (req, res, next) => { try { ok(res, await svc.getTrainingById(req.params.id));          } catch(e) { fail(res,e,next); } });
router.patch( "/:id",          requirePerm("training:edit"),   async (req, res, next) => { try { ok(res, await svc.updateTraining(req.params.id, req.body)); } catch(e) { fail(res,e,next); } });
router.post(  "/:id/cancel",   requirePerm("training:edit"),   async (req, res, next) => { try { ok(res, await svc.cancelTraining(req.params.id, req.body.reason, req.user.id));     } catch(e) { fail(res,e,next); } });
router.post(  "/:id/deactivate", requirePerm("training:edit"), async (req, res, next) => { try { ok(res, await svc.deactivateTraining(req.params.id, req.user.id));                  } catch(e) { fail(res,e,next); } });
router.post(  "/:id/activate", requirePerm("training:edit"),   async (req, res, next) => { try { ok(res, await svc.activateTraining(req.params.id));                                  } catch(e) { fail(res,e,next); } });

// ── Sections ──────────────────────────────────────────────────
router.get(   "/:id/sections",         requirePerm("training:view"),   async (req, res, next) => { try { ok(res, await svc.getSections(req.params.id));                                                          } catch(e) { fail(res,e,next); } });
router.post(  "/:id/sections",         requirePerm("training:edit"),   async (req, res, next) => { try { ok(res, await svc.assignSections(req.params.id, req.body.section_ids, req.body.is_mandatory, req.user.id)); } catch(e) { fail(res,e,next); } });
router.delete("/:id/sections",         requirePerm("training:edit"),   async (req, res, next) => { try { ok(res, await svc.removeSections(req.params.id, req.body.section_ids));                                 } catch(e) { fail(res,e,next); } });

// ── Mentors ───────────────────────────────────────────────────
router.post(  "/:id/mentors",          requirePerm("training:edit"),   async (req, res, next) => { try { ok(res, await svc.assignMentors(req.params.id, req.body.mentors, req.user.id)); } catch(e) { fail(res,e,next); } });
router.delete("/:id/mentors/:fid",     requirePerm("training:edit"),   async (req, res, next) => { try { ok(res, await svc.removeMentor(req.params.id, req.params.fid));                 } catch(e) { fail(res,e,next); } });

// ── Enrollment ────────────────────────────────────────────────
router.get(   "/:id/enrollments",       requirePerm("training:view"),   async (req, res, next) => { try { ok(res, await svc.listEnrollments(req.params.id, req.query));                                          } catch(e) { fail(res,e,next); } });
router.post(  "/:id/enrollments",       requirePerm("training:enroll"), async (req, res, next) => { try { ok(res, await svc.enrollStudents(req.params.id, req.body.student_ids, req.user.id), "Enrolled", 201);  } catch(e) { fail(res,e,next); } });
router.post(  "/:id/enroll-section",    requirePerm("training:enroll"), async (req, res, next) => { try { ok(res, await svc.enrollBySection(req.params.id, req.body.section_id, req.user.id), "Enrolled", 201); } catch(e) { fail(res,e,next); } });
router.delete("/:id/enrollments/:sid",  requirePerm("training:enroll"), async (req, res, next) => { try { ok(res, await svc.dropEnrollment(req.params.id, req.params.sid, req.body.reason));                     } catch(e) { fail(res,e,next); } });

// ── Fee ───────────────────────────────────────────────────────
router.post(  "/:id/fee/:sid",          requirePerm("training:fee"),    async (req, res, next) => { try { ok(res, await svc.updateFeeStatus(req.params.id, req.params.sid, req.body, req.user.id));  } catch(e) { fail(res,e,next); } });
router.post(  "/enrollments/:eid/refund", requirePerm("training:fee"),  async (req, res, next) => { try { ok(res, await svc.processRefund(req.params.eid, req.body, req.user.id));                   } catch(e) { fail(res,e,next); } });

// ── Attendance ────────────────────────────────────────────────
router.get(   "/:id/attendance",        requirePerm("training:attendance"), async (req, res, next) => { try { ok(res, await svc.getAttendance(req.params.id, req.query));             } catch(e) { fail(res,e,next); } });
router.post(  "/:id/attendance",        requirePerm("training:attendance"), async (req, res, next) => { try { ok(res, await svc.markAttendance(req.params.id, req.body.records, req.user.id)); } catch(e) { fail(res,e,next); } });

// ── Online Course ─────────────────────────────────────────────
router.post(  "/:id/online-course/:sid",    requirePerm("training:view"),    async (req, res, next) => { try { ok(res, await svc.addOnlineCourseRecord(req.params.id, req.params.sid, req.body), "Record added", 201); } catch(e) { fail(res,e,next); } });
router.post(  "/online-course/:rid/verify", requirePerm("training:edit"),    async (req, res, next) => { try { ok(res, await svc.verifyOnlineCourse(req.params.rid, req.user.id));                                       } catch(e) { fail(res,e,next); } });
router.post(  "/online-course/:rid/credit", requirePerm("training:edit"),    async (req, res, next) => { try { ok(res, await svc.creditAttendance(req.params.rid, req.body.units, req.user.id, req.body.session_id));   } catch(e) { fail(res,e,next); } });

// ── Updates ───────────────────────────────────────────────────
router.get(   "/:id/updates",           requirePerm("training:view"),    async (req, res, next) => { try { ok(res, await svc.getUpdates(req.params.id));                                      } catch(e) { fail(res,e,next); } });
router.post(  "/:id/updates",           requirePerm("training:update"),  async (req, res, next) => { try { ok(res, await svc.postUpdate(req.params.id, req.body, req.user.id), "Posted", 201); } catch(e) { fail(res,e,next); } });
router.delete("/updates/:uid",          requirePerm("training:update"),  async (req, res, next) => { try { ok(res, await svc.deleteUpdate(req.params.uid));                                   } catch(e) { fail(res,e,next); } });

// ── Team ──────────────────────────────────────────────────────
router.post(  "/:id/team",              requirePerm("training:manage"),  async (req, res, next) => { try { ok(res, await svc.addTeamMember(req.body, req.user.id), "Added", 201);              } catch(e) { fail(res,e,next); } });
router.delete("/team/:mid",             requirePerm("training:manage"),  async (req, res, next) => { try { ok(res, await svc.removeTeamMember(req.params.mid));                                 } catch(e) { fail(res,e,next); } });

// ── Reports ───────────────────────────────────────────────────
router.get(   "/:id/report",            requirePerm("training:report"),  async (req, res, next) => { try { ok(res, await svc.getTrainingReport(req.params.id));                               } catch(e) { fail(res,e,next); } });
router.get(   "/report/mentor/:fid",    requirePerm("training:report"),  async (req, res, next) => { try { ok(res, await svc.getMentorReport(req.params.fid, req.query.session_id));           } catch(e) { fail(res,e,next); } });
router.get(   "/report/summary",        requirePerm("training:report"),  async (req, res, next) => { try { ok(res, await svc.getSummaryReport(req.query));                                     } catch(e) { fail(res,e,next); } });

export default router;