// backend/modules/groups/groups.controller.js
import { parseQuery } from "../../utils/parseQuery.js";
import * as svc from "./groups.service.js";

const ok   = (res, data, msg = "OK", status = 200) => res.status(status).json({ success: true, message: msg, data });
const fail = (res, e, next) => { if (e.status || e.statusCode) return res.status(e.status || e.statusCode).json({ success: false, message: e.message }); next(e); };

// Group CRUD
export const getAll           = async (req, res, next) => { try { ok(res, await svc.getAllGroups(parseQuery(req.query))); } catch (e) { fail(res, e, next); } };
export const getOne           = async (req, res, next) => { try { const d = await svc.getGroupById(req.params.id); if (!d) return res.status(404).json({ success: false, message: "Not found" }); ok(res, d); } catch (e) { fail(res, e, next); } };
export const getStats         = async (req, res, next) => { try { ok(res, await svc.getGroupStats()); } catch (e) { fail(res, e, next); } };
export const create           = async (req, res, next) => { try { ok(res, await svc.createGroup(req.body, req.user), "Group created", 201); } catch (e) { fail(res, e, next); } };
export const update           = async (req, res, next) => { try { ok(res, await svc.updateGroup(req.params.id, req.body, req.user), "Updated"); } catch (e) { fail(res, e, next); } };
export const deactivate       = async (req, res, next) => { try { ok(res, await svc.deactivateGroup(req.params.id, req.user), "Deactivated"); } catch (e) { fail(res, e, next); } };
export const restore          = async (req, res, next) => { try { ok(res, await svc.restoreGroup(req.params.id, req.user), "Restored"); } catch (e) { fail(res, e, next); } };
export const remove           = async (req, res, next) => { try { await svc.deleteGroup(req.params.id, req.user); ok(res, null, "Deleted"); } catch (e) { fail(res, e, next); } };

// Members
export const addMembers       = async (req, res, next) => { try { ok(res, await svc.addMembers(req.params.id, req.body.student_ids, req.user)); } catch (e) { fail(res, e, next); } };
export const addBySection     = async (req, res, next) => { try { ok(res, await svc.addMembersBySection(req.params.id, req.body.section_ids, req.user)); } catch (e) { fail(res, e, next); } };
export const removeMembers    = async (req, res, next) => { try { ok(res, await svc.removeMembers(req.params.id, req.body.student_ids)); } catch (e) { fail(res, e, next); } };

// Announcements
export const getAnnouncements = async (req, res, next) => { try { ok(res, await svc.getAnnouncements(req.params.id, parseQuery(req.query))); } catch (e) { fail(res, e, next); } };
export const createAnn        = async (req, res, next) => { try { ok(res, await svc.createAnnouncement(req.params.id, req.body, req.user), "Posted", 201); } catch (e) { fail(res, e, next); } };
export const deleteAnn        = async (req, res, next) => { try { await svc.deleteAnnouncement(req.params.ann_id); ok(res, null, "Deleted"); } catch (e) { fail(res, e, next); } };

// Attendance
export const getAttendance    = async (req, res, next) => { try { ok(res, await svc.getAttendanceRequests(req.params.id, parseQuery(req.query))); } catch (e) { fail(res, e, next); } };
export const createAttendance = async (req, res, next) => { try { ok(res, await svc.createAttendanceRequest(req.params.id, req.body, req.user), "Requested", 201); } catch (e) { fail(res, e, next); } };
export const actionAttendance = async (req, res, next) => { try { ok(res, await svc.actionAttendanceRequest(req.params.req_id, req.body.action, req.body.remarks, req.user)); } catch (e) { fail(res, e, next); } };

// Tasks
export const getTasks         = async (req, res, next) => { try { ok(res, await svc.getTasks(req.params.id, parseQuery(req.query))); } catch (e) { fail(res, e, next); } };
export const createTask       = async (req, res, next) => { try { ok(res, await svc.createTask(req.params.id, req.body, req.user), "Task created", 201); } catch (e) { fail(res, e, next); } };
export const updateTask       = async (req, res, next) => { try { ok(res, await svc.updateTask(req.params.task_id, req.body)); } catch (e) { fail(res, e, next); } };
export const deleteTask       = async (req, res, next) => { try { await svc.deleteTask(req.params.task_id); ok(res, null, "Deleted"); } catch (e) { fail(res, e, next); } };

// Polls
export const getPolls         = async (req, res, next) => { try { ok(res, await svc.getPolls(req.params.id, parseQuery(req.query))); } catch (e) { fail(res, e, next); } };
export const createPoll       = async (req, res, next) => { try { ok(res, await svc.createPoll(req.params.id, req.body, req.user), "Poll created", 201); } catch (e) { fail(res, e, next); } };
export const pollResults      = async (req, res, next) => { try { ok(res, await svc.getPollResults(req.params.poll_id)); } catch (e) { fail(res, e, next); } };
export const votePoll         = async (req, res, next) => { try { ok(res, await svc.submitPollResponse(req.params.poll_id, req.user.student?.id, req.body.choice_ids)); } catch (e) { fail(res, e, next); } };
export const closePoll        = async (req, res, next) => { try { ok(res, await svc.closePoll(req.params.poll_id), "Poll closed"); } catch (e) { fail(res, e, next); } };
export const deletePoll       = async (req, res, next) => { try { await svc.deletePoll(req.params.poll_id); ok(res, null, "Deleted"); } catch (e) { fail(res, e, next); } };

// Files
export const getFiles         = async (req, res, next) => { try { ok(res, await svc.getFiles(req.params.id, parseQuery(req.query))); } catch (e) { fail(res, e, next); } };
export const addFile          = async (req, res, next) => { try { ok(res, await svc.addFile(req.params.id, req.body, req.user), "File added", 201); } catch (e) { fail(res, e, next); } };
export const deleteFile       = async (req, res, next) => { try { await svc.deleteFile(req.params.file_id); ok(res, null, "Deleted"); } catch (e) { fail(res, e, next); } };

// Notices
export const getNotices       = async (req, res, next) => { try { ok(res, await svc.getNotices(req.params.id, parseQuery(req.query))); } catch (e) { fail(res, e, next); } };
export const createNotice     = async (req, res, next) => { try { ok(res, await svc.createNotice(req.params.id, req.body, req.user), "Notice posted", 201); } catch (e) { fail(res, e, next); } };
export const deleteNotice     = async (req, res, next) => { try { await svc.deleteNotice(req.params.notice_id); ok(res, null, "Deleted"); } catch (e) { fail(res, e, next); } };

// Room Bookings
export const getBookings      = async (req, res, next) => { try { ok(res, await svc.getRoomBookings(req.params.id, parseQuery(req.query))); } catch (e) { fail(res, e, next); } };
export const createBooking    = async (req, res, next) => { try { ok(res, await svc.createRoomBooking(req.params.id, req.body, req.user), "Booking requested", 201); } catch (e) { fail(res, e, next); } };
export const actionBooking    = async (req, res, next) => { try { ok(res, await svc.actionRoomBooking(req.params.booking_id, req.body.action, req.body.rejection_reason, req.user)); } catch (e) { fail(res, e, next); } };