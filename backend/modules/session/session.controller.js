// backend/modules/academicSession/session.controller.js
import * as svc from "./session.service.js";
import * as cal from "./session.calendar.service.js";

const ok   = (res, data, msg = "OK", s = 200) => res.status(s).json({ success: true,  message: msg, data });
const fail = (res, e, next) => e.status
  ? res.status(e.status).json({ success: false, message: e.message })
  : next(e);
const sendXlsx = (res, buf, name) => {
  const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  res.setHeader("Content-Type","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition",`attachment; filename="${name}"`);
  res.setHeader("Content-Length", b.length);
  res.end(b);
};

// ── Session CRUD ──────────────────────────────────────────────
export const getAll     = async (req, res, next) => { try { ok(res, await svc.getAllSessions(req.query));                                           } catch(e) { fail(res,e,next); } };
export const getCurrent = async (req, res, next) => { try { ok(res, await svc.getCurrentSession());                                                  } catch(e) { fail(res,e,next); } };
export const getOne     = async (req, res, next) => { try { ok(res, await svc.getSessionById(req.params.id));                                        } catch(e) { fail(res,e,next); } };
export const create     = async (req, res, next) => { try { ok(res, await svc.createSession(req.validatedData, req.user), "Session created", 201);  } catch(e) { fail(res,e,next); } };
export const update     = async (req, res, next) => { try { ok(res, await svc.updateSession(req.params.id, req.validatedData, req.user), "Updated"); } catch(e) { fail(res,e,next); } };
export const setCurrent = async (req, res, next) => { try { ok(res, await svc.setCurrentSession(req.params.id), "Current session updated");          } catch(e) { fail(res,e,next); } };
export const lock       = async (req, res, next) => { try { ok(res, await svc.lockSession(req.params.id),   "Session locked");                       } catch(e) { fail(res,e,next); } };
export const unlock     = async (req, res, next) => { try { ok(res, await svc.unlockSession(req.params.id), "Session unlocked");                     } catch(e) { fail(res,e,next); } };
export const toggleLock = async (req, res, next) => { try { ok(res, await svc.toggleLock(req.params.id));                                            } catch(e) { fail(res,e,next); } };
export const getSummary = async (req, res, next) => { try { ok(res, await svc.getSessionSummary(req.params.id));                                     } catch(e) { fail(res,e,next); } };
export const getPeriod  = async (req, res, next) => { try { ok(res, await svc.getCurrentPeriod(req.params.id));                                      } catch(e) { fail(res,e,next); } };

// ── Calendar periods ──────────────────────────────────────────
export const listPeriods  = async (req, res, next) => { try { ok(res, await cal.getCalendarPeriods(req.params.id));                                                                     } catch(e) { fail(res,e,next); } };
export const addPeriod    = async (req, res, next) => { try { ok(res, await cal.addCalendarPeriod(req.params.id, req.validatedData), "Period added", 201);                              } catch(e) { fail(res,e,next); } };
export const editPeriod   = async (req, res, next) => { try { ok(res, await cal.editCalendarPeriod(req.params.pid, req.validatedData), "Period updated");                               } catch(e) { fail(res,e,next); } };
export const removePeriod = async (req, res, next) => { try { await cal.removeCalendarPeriod(req.params.pid); ok(res, null, "Period deleted");                                          } catch(e) { fail(res,e,next); } };
export const calSummary   = async (req, res, next) => { try { ok(res, await cal.getCalendarSummary(req.params.id));                                                                     } catch(e) { fail(res,e,next); } };
export const calTemplate  = async (req, res, next) => { try { sendXlsx(res, await cal.getCalendarTemplate(req.params.id), `calendar-template-${req.params.id.slice(0,8)}.xlsx`);      } catch(e) { fail(res,e,next); } };
export const calUpload    = async (req, res, next) => { try { if (!req.file) return res.status(400).json({ success:false, message:"No file" }); ok(res, await cal.bulkUploadCalendar(req.params.id, req.file.buffer, req.user)); } catch(e) { fail(res,e,next); } };
