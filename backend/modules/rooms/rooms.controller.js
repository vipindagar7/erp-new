// backend/modules/rooms/rooms.controller.js
import * as svc from "./rooms.service.js";

const ok   = (res, data, msg = "OK", s = 200) => res.status(s).json({ success: true,  message: msg, data });
const fail = (res, e, next) => e.status
  ? res.status(e.status).json({ success: false, message: e.message })
  : next(e);

export const getAll        = async (req, res, next) => { try { ok(res, await svc.getAllRooms(req.validatedData));       } catch(e) { fail(res,e,next); } };
export const getOne        = async (req, res, next) => { try { ok(res, await svc.getRoomById(req.params.id));           } catch(e) { fail(res,e,next); } };
export const getStats      = async (req, res, next) => { try { ok(res, await svc.getRoomStats());                       } catch(e) { fail(res,e,next); } };
export const create        = async (req, res, next) => { try { ok(res, await svc.createRoom(req.validatedData, req.user), "Room created", 201); } catch(e) { fail(res,e,next); } };
export const update        = async (req, res, next) => { try { ok(res, await svc.updateRoom(req.params.id, req.validatedData), "Updated"); }       catch(e) { fail(res,e,next); } };
export const remove        = async (req, res, next) => { try { await svc.deleteRoom(req.params.id); ok(res, null, "Deleted"); }                    catch(e) { fail(res,e,next); } };
export const restore       = async (req, res, next) => { try { ok(res, await svc.restoreRoom(req.params.id));           } catch(e) { fail(res,e,next); } };

export const getTemplate   = async (req, res, next) => {
  try {
    const buf = await svc.getRoomTemplate();
    res.setHeader("Content-Type","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition",'attachment; filename="room-template.xlsx"');
    res.setHeader("Content-Length", buf.length);
    res.end(buf);
  } catch(e) { fail(res,e,next); }
};
export const bulkUpload    = async (req, res, next) => { try { if (!req.file) return res.status(400).json({ success:false, message:"No file" }); ok(res, await svc.bulkUploadRooms(req.file.buffer, req.user)); } catch(e) { fail(res,e,next); } };

export const addSubject    = async (req, res, next) => { try { ok(res, await svc.addSubjectToRoom(req.params.id, req.params.subject_id));          } catch(e) { fail(res,e,next); } };
export const removeSubject = async (req, res, next) => { try { await svc.removeSubjectFromRoom(req.params.id, req.params.subject_id); ok(res,null,"Removed"); } catch(e) { fail(res,e,next); } };

export const addStaff      = async (req, res, next) => { try { ok(res, await svc.addStaffToRoom(req.params.id, req.validatedData.user_id, req.validatedData.role)); } catch(e) { fail(res,e,next); } };
export const removeStaff   = async (req, res, next) => { try { await svc.removeStaffFromRoom(req.params.id, req.params.user_id); ok(res,null,"Removed"); }          catch(e) { fail(res,e,next); } };

export const checkAvailability = async (req, res, next) => { try { ok(res, await svc.checkRoomAvailability(req.params.id, req.validatedData.day, req.validatedData.period_config_id, req.validatedData.exclude_entry_id)); } catch(e) { fail(res,e,next); } };
