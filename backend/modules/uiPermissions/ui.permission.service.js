// backend/modules/uiPermissions/ui.permission.service.js
// Root admin controls which buttons/options appear per module and role.
// role = "" means "applies to ALL roles" (global override).
// role = "ADMIN" means applies only to that role.
// Prisma schema has role as String (not nullable) so we use "" not null.
import prisma from "../../utils/prisma.js";

export const MODULES = ["students","faculty","admin","superadmin","departments","programs","branches","sections","subjects","curriculum","enrollments","groups","leave","bulk","feedback","reports","sessions","audit"];
export const ACTIONS = ["view","add","edit","delete","deactivate","bulk","export","import","promote","demote","block","unblock","restore","reset_password","assign"];
export const ROLES   = ["ADMIN","SUPER_ADMIN","FACULTY","STUDENT"];

// Normalise: treat null/undefined as "" (global)
const normaliseRole = (role) => (role && ROLES.includes(role)) ? role : "";

// ── Get all permissions ───────────────────────────────────────
export const getAllUIPermissions = () =>
  prisma.uIPermission.findMany({ orderBy: [{ module: "asc" }, { action: "asc" }] });

// ── Get permissions for a specific module ─────────────────────
export const getUIPermissionsForModule = (module) =>
  prisma.uIPermission.findMany({ where: { module } });

// ── Get full permission map for current user role ─────────────
// Returns: { [module]: { [action]: { is_hidden, is_disabled } } }
export const getUIPermissionMap = async (role) => {
  const normRole = normaliseRole(role);
  const perms = await prisma.uIPermission.findMany({
    where: { OR: [{ role: "" }, { role: normRole }] },
  });

  const map = {};
  for (const p of perms) {
    if (!map[p.module]) map[p.module] = {};
    const existing = map[p.module][p.action];
    // Role-specific overrides global ("")
    if (!existing || p.role !== "") {
      map[p.module][p.action] = { is_hidden: p.is_hidden, is_disabled: p.is_disabled };
    }
  }
  return map;
};

// ── Set a permission (root only) ──────────────────────────────
export const setUIPermission = async ({ module, action, role, is_hidden, is_disabled }, actingUserId) => {
  if (!MODULES.includes(module)) throw Object.assign(new Error(`Invalid module: ${module}`), { status: 400 });
  if (!ACTIONS.includes(action)) throw Object.assign(new Error(`Invalid action: ${action}`), { status: 400 });

  const normRole = normaliseRole(role);

  const perm = await prisma.uIPermission.upsert({
    where:  { module_action_role: { module, action, role: normRole } },
    update: { is_hidden: !!is_hidden, is_disabled: !!is_disabled, updated_by: actingUserId },
    create: { module, action, role: normRole, is_hidden: !!is_hidden, is_disabled: !!is_disabled, updated_by: actingUserId },
  });

  await prisma.auditLog.create({
    data: {
      user_id: actingUserId, user_role: "ROOT", action: "UPDATE",
      module: "ui_permission",
      record_label: `${module}.${action}${normRole ? `.${normRole}` : ".global"}`,
      new_data: { module, action, role: normRole, is_hidden, is_disabled },
    },
  }).catch(() => {});

  return perm;
};

// ── Bulk set ──────────────────────────────────────────────────
export const bulkSetUIPermissions = async (permissions, actingUserId) => {
  const results = [];
  for (const p of permissions) results.push(await setUIPermission(p, actingUserId));
  return results;
};

// ── Reset a single permission ─────────────────────────────────
export const resetUIPermission = async ({ module, action, role }, actingUserId) => {
  const normRole = normaliseRole(role);
  await prisma.uIPermission.deleteMany({ where: { module, action, role: normRole } });
  await prisma.auditLog.create({
    data: { user_id: actingUserId, user_role: "ROOT", action: "DELETE", module: "ui_permission", record_label: `${module}.${action}` },
  }).catch(() => {});
  return { reset: true, module, action, role: normRole };
};

// ── Reset all permissions for a module ───────────────────────
export const resetModulePermissions = async (module, actingUserId) => {
  const result = await prisma.uIPermission.deleteMany({ where: { module } });
  await prisma.auditLog.create({
    data: { user_id: actingUserId, user_role: "ROOT", action: "DELETE", module: "ui_permission", record_label: `${module}.*`, new_data: { deleted: result.count } },
  }).catch(() => {});
  return { reset: result.count, module };
};

// ── Controller ────────────────────────────────────────────────
export const uiPermController = {
  getAll:    async (req, res, next) => { try { res.json({ success: true, data: await getAllUIPermissions() }); }                                               catch (e) { next(e); } },
  getMap:    async (req, res, next) => { try { res.json({ success: true, data: await getUIPermissionMap(req.query.role || req.user?.role) }); }                catch (e) { next(e); } },
  getModule: async (req, res, next) => { try { res.json({ success: true, data: await getUIPermissionsForModule(req.params.module) }); }                        catch (e) { next(e); } },
  set:       async (req, res, next) => { try { res.json({ success: true, data: await setUIPermission(req.body, req.user.id) }); }                              catch (e) { next(e); } },
  bulkSet:   async (req, res, next) => { try { res.json({ success: true, data: await bulkSetUIPermissions(req.body.permissions, req.user.id) }); }             catch (e) { next(e); } },
  reset:     async (req, res, next) => { try { res.json({ success: true, data: await resetUIPermission(req.body, req.user.id) }); }                            catch (e) { next(e); } },
  resetAll:  async (req, res, next) => { try { res.json({ success: true, data: await resetModulePermissions(req.params.module, req.user.id) }); }              catch (e) { next(e); } },
};