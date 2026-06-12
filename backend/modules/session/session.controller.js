// backend/modules/session/session.controller.js
import * as svc from "./session.service.js";

const ok   = (res, data, msg)  => res.json({ success: true, message: msg, data });
const fail = (res, e, next)    => { if (e?.statusCode) return res.status(e.statusCode).json({ success: false, message: e.message }); next(e); };

export const getCurrent    = async (req, res, next) => { try { ok(res, await svc.getCurrentSession(),          "OK"); } catch (e) { fail(res, e, next); } };
export const list          = async (req, res, next) => { try { ok(res, await svc.listSessions(),               "OK"); } catch (e) { fail(res, e, next); } };
export const getById       = async (req, res, next) => { try { ok(res, await svc.getSessionById(req.params.id),"OK"); } catch (e) { fail(res, e, next); } };
export const create        = async (req, res, next) => { try { ok(res, await svc.createSession({ ...req.body, created_by: req.user.id }), "Session created", ); } catch (e) { fail(res, e, next); } };
export const update        = async (req, res, next) => { try { ok(res, await svc.updateSession(req.params.id, req.body), "Session updated"); } catch (e) { fail(res, e, next); } };
export const setCurrent    = async (req, res, next) => { try { ok(res, await svc.setCurrentSession(req.params.id), "Session activated"); } catch (e) { fail(res, e, next); } };
export const toggleLock    = async (req, res, next) => { try { ok(res, await svc.toggleLock(req.params.id),    "Session lock toggled"); } catch (e) { fail(res, e, next); } };
export const getSummary    = async (req, res, next) => { try { ok(res, await svc.getSessionSummary(req.params.id), "OK"); } catch (e) { fail(res, e, next); } };
