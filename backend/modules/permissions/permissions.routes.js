// backend/modules/permissions/permissions.routes.js
import { Router }  from "express";
import { authenticate, superAdminOnly } from "../../middlewares/auth.middleware.js";
import * as svc    from "./permissions.service.js";

const router = Router();
router.use(authenticate);

const ok   = (res, data, msg = "OK") => res.json({ success: true, message: msg, data });
const fail = (res, e, next) => e.status
  ? res.status(e.status).json({ success: false, message: e.message })
  : next(e);

const guard = superAdminOnly;

// ── Available permissions list (for checklist UI) ──────────────
router.get("/available", async (req, res) => {
  res.json({ success: true, data: svc.ALL_PERMISSIONS });
});

// ── Seed permissions into DB ───────────────────────────────────
router.post("/seed", guard, async (req, res, next) => {
  try { ok(res, await svc.seedPermissions(), "Permissions seeded"); } catch(e) { fail(res,e,next); }
});

// ── Permission Groups (= Roles) CRUD ──────────────────────────
router.get("/groups",        guard, async (req, res, next) => {
  try { ok(res, await svc.listGroups()); } catch(e) { fail(res,e,next); }
});

router.post("/groups",       guard, async (req, res, next) => {
  try { ok(res, await svc.createGroup(req.body, req.user.id), "Group created"); } catch(e) { fail(res,e,next); }
});

router.patch("/groups/:id",  guard, async (req, res, next) => {
  try { ok(res, await svc.updateGroup(req.params.id, req.body)); } catch(e) { fail(res,e,next); }
});

router.delete("/groups/:id", guard, async (req, res, next) => {
  try { ok(res, await svc.deleteGroup(req.params.id), "Group deleted"); } catch(e) { fail(res,e,next); }
});

// ── Assign group to user (with optional dept/section scope) ────
// body: { user_id, group_ids: [], dept_ids?: [], section_ids?: [] }
router.post("/groups/assign", guard, async (req, res, next) => {
  try {
    const { user_id, group_ids, dept_ids, section_ids } = req.body;
    if (!user_id || !group_ids?.length)
      return res.status(400).json({ success: false, message: "user_id and group_ids required" });

    const results = [];
    for (const role_id of group_ids) {
      const r = await svc.assignGroupWithScope(
        user_id, role_id,
        { dept_ids: dept_ids || [], section_ids: section_ids || [] },
        req.user.id
      );
      results.push(...r);
    }
    ok(res, results, "Groups assigned");
  } catch(e) { fail(res,e,next); }
});

// Remove group from user
router.delete("/groups/assign/:user_id/:group_id", guard, async (req, res, next) => {
  try {
    ok(res, await svc.removeGroupFromUser(req.params.user_id, req.params.group_id), "Removed");
  } catch(e) { fail(res,e,next); }
});

// ── Individual permissions for a user ─────────────────────────
router.post("/user/:user_id", guard, async (req, res, next) => {
  try {
    ok(res, await svc.setUserPermissions(req.params.user_id, req.body.permissions || []), "Saved");
  } catch(e) { fail(res,e,next); }
});

// ── Get full permission summary ────────────────────────────────
router.get("/user/:user_id", guard, async (req, res, next) => {
  try { ok(res, await svc.getUserPermissionSummary(req.params.user_id)); } catch(e) { fail(res,e,next); }
});

// ── Search users ───────────────────────────────────────────────
router.get("/search-users", guard, async (req, res, next) => {
  try { ok(res, await svc.searchUsers(req.query.q, req.query.limit)); } catch(e) { fail(res,e,next); }
});

export default router;