// backend/modules/customRoles/customRoles.controller.js
import * as svc from "./customRoles.service.js";

const ok = (res, data, message = "OK") => res.json({ success: true, message, data });
const fail = (res, err, next) => err.status ? res.status(err.status).json({ success: false, message: err.message }) : next(err);

export const list = async (req, res, next) => {
    try { ok(res, await svc.listRoles()); } catch (e) { fail(res, e, next); }
};

export const getById = async (req, res, next) => {
    try {
        const role = await svc.getRole(req.params.id);
        if (!role) return res.status(404).json({ success: false, message: "Role not found" });
        ok(res, role);
    } catch (e) { fail(res, e, next); }
};

export const listPermissions = async (req, res, next) => {
    try { ok(res, await svc.listAllPermissions()); } catch (e) { fail(res, e, next); }
};

export const create = async (req, res, next) => {
    try { ok(res, await svc.createRole(req.body), "Role created"); } catch (e) { fail(res, e, next); }
};

export const update = async (req, res, next) => {
    try { ok(res, await svc.updateRole(req.params.id, req.body), "Role updated"); } catch (e) { fail(res, e, next); }
};

export const remove = async (req, res, next) => {
    try { await svc.deleteRole(req.params.id); ok(res, null, "Role deleted"); } catch (e) { fail(res, e, next); }
};

export const assign = async (req, res, next) => {
    try {
        const userId = req.body.user_id;
        ok(res, await svc.assignRoleToUser(userId, req.params.id, req.user.id), "Role assigned");
    } catch (e) { fail(res, e, next); }
};

export const revoke = async (req, res, next) => {
    try {
        const userId = req.body.user_id;
        ok(res, await svc.revokeRoleFromUser(userId, req.params.id), "Role revoked");
    } catch (e) { fail(res, e, next); }
};

export const usersWithRole = async (req, res, next) => {
    try { ok(res, await svc.listUsersWithRole(req.params.id)); } catch (e) { fail(res, e, next); }
};