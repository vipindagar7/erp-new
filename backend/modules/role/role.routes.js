// backend/modules/role/role.routes.js
import { Router } from "express";
import { authenticate, requirePerm, superAdminOnly } from "../../middlewares/auth.middleware.js";
import * as svc from "./role.service.js";

const router = Router();
const ok   = (res, data, msg = "OK", s = 200) => res.status(s).json({ success: true, message: msg, data });
const fail = (res, e, next) => e.status
  ? res.status(e.status).json({ success: false, message: e.message })
  : next(e);

router.use(authenticate);

// ── Roles CRUD ────────────────────────────────────────────────
router.get(   "/",    requirePerm("roles:view"),   async (req, res, next) => { try { ok(res, await svc.getRoles(req.query)); } catch(e) { fail(res,e,next); } });
router.post(  "/",    superAdminOnly,               async (req, res, next) => { try { ok(res, await svc.createRole(req.body), "Role created", 201); } catch(e) { fail(res,e,next); } });
router.get(   "/:id", requirePerm("roles:view"),   async (req, res, next) => { try { ok(res, await svc.getRoleById(req.params.id)); } catch(e) { fail(res,e,next); } });
router.patch( "/:id", requirePerm("roles:manage"), async (req, res, next) => { try { ok(res, await svc.updateRole(req.params.id, req.body)); } catch(e) { fail(res,e,next); } });
router.delete("/:id", superAdminOnly,               async (req, res, next) => { try { ok(res, await svc.deleteRole(req.params.id)); } catch(e) { fail(res,e,next); } });

// ── Permissions ───────────────────────────────────────────────
router.get( "/permissions/all",  requirePerm("roles:view"),   async (req, res, next) => { try { ok(res, await svc.getPermissions()); } catch(e) { fail(res,e,next); } });
router.post("/:id/permissions",  requirePerm("roles:manage"), async (req, res, next) => { try { ok(res, await svc.setRolePermissions(req.params.id, req.body.permission_keys, req.body.replace !== false)); } catch(e) { fail(res,e,next); } });

// ── Assign / Revoke ───────────────────────────────────────────
// POST /assign — supports both:
//   { user_id, role_name }          ← single role by name (legacy)
//   { user_id, role_ids: [id, id] } ← bulk assign by IDs (new, from ManageAccessPage / FacultyEditPage)
router.post("/assign", requirePerm("roles:manage"), async (req, res, next) => {
  try {
    const { user_id, role_name, role_ids, ...opts } = req.body;
    opts.granted_by = req.user.id;

    if (role_ids && Array.isArray(role_ids)) {
      // Bulk assign by IDs — replace all existing roles for this user
      const results = await svc.assignRolesByIds(user_id, role_ids, opts);
      ok(res, results, "Roles assigned");
    } else {
      // Single role by name (legacy)
      const result = await svc.assignRoleToUser(user_id, role_name, opts);
      ok(res, result, "Role assigned");
    }
  } catch(e) { fail(res, e, next); }
});

router.post("/revoke",         requirePerm("roles:manage"), async (req, res, next) => { try { ok(res, await svc.revokeRole(req.body.user_id, req.body.role_id)); } catch(e) { fail(res,e,next); } });
router.get( "/user/:user_id",  requirePerm("roles:view"),   async (req, res, next) => { try { ok(res, await svc.getUserRolesList(req.params.user_id)); } catch(e) { fail(res,e,next); } });

// ── Seed predefined roles ─────────────────────────────────────
router.post("/seed", requirePerm("roles:manage"), async (req, res, next) => { try { ok(res, await svc.seedRoles(), "Roles seeded"); } catch(e) { fail(res,e,next); } });

export default router;