// frontend/src/pages/admin/AdminsPage.jsx
import { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../../lib/axios.js";
import { EP } from "../../../config/api.config.js";
import { notify } from "../../../hooks/notify.js";
import { cn } from "../../../lib/utils.js";
import { useSelector } from "react-redux";
import AdminUserActions from "../../../components/admin/AdminUserActions.jsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  ShieldCheck, Plus, Pencil, Trash2, Loader2,
  Lock, Unlock, Key, Search,
} from "lucide-react";

import PermissionChecklist from "../../../components/auth/PermissionChecklist.jsx";

// ─── Constants ───────────────────────────────────────────────────────────────

const ALL_PERMISSIONS = [
  { key: "manage_students", label: "Manage Students", desc: "Create, edit, promote, block students" },
  { key: "manage_faculty", label: "Manage Faculty", desc: "Create, edit, assign subjects to faculty" },
  { key: "manage_departments", label: "Manage Departments", desc: "Departments, programs, courses" },
  { key: "manage_sections", label: "Manage Sections", desc: "Create sections, assign subjects" },
  { key: "manage_subjects", label: "Manage Subjects", desc: "Create and edit subjects" },
  { key: "manage_feedback", label: "Manage Feedback", desc: "Categories, questions, forms, results" },
  { key: "manage_admins", label: "Manage Admins", desc: "View other admin accounts" },
  { key: "manage_reports", label: "Manage Reports", desc: "Export xlsx reports" },
  { key: "manage_settings", label: "Manage Settings", desc: "System settings" },
];

// PermissionChecklist is now imported from components/shared/PermissionChecklist.jsx

// ─── Create / Edit Modal ──────────────────────────────────────────────────────

function AdminModal({ open, onClose, onSave, initialData, saving }) {
  const isEdit = !!initialData;
  const [form, setForm] = useState({ name: "", email: "", password: "", permissions: [] });

  useEffect(() => {
    if (open) setForm({
      name: initialData?.name ?? "",
      email: initialData?.email ?? "",
      password: "",
      permissions: initialData?.permissions ?? [],
    });
  }, [open, initialData]);

  if (!open) return null;

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Admin" : "New Admin"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update name and permissions." : "Create a new admin account with specific permissions."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input className="h-9 text-sm" value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Admin Name" />
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input className="h-9 text-sm" type="email" value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="admin@college.edu"
                readOnly={isEdit} />
            </div>
          </div>

          {!isEdit && (
            <div className="space-y-1.5">
              <Label>Password *</Label>
              <Input className="h-9 text-sm" type="password" value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="Min 6 characters" />
            </div>
          )}

          <PermissionChecklist
            value={form.permissions}
            onChange={(v) => set("permissions", v)}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1"
            disabled={!form.name.trim() || (!isEdit && (!form.email.trim() || form.password.length < 6)) || saving}
            onClick={() => onSave(form)}>
            {saving && <Loader2 size={13} className="mr-1.5 animate-spin" />}
            {isEdit ? "Save Changes" : "Create Admin"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Permissions Modal (quick edit) ──────────────────────────────────────────

function PermissionsModal({ open, onClose, onSave, admin, saving }) {
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    if (open) setPermissions(admin?.permissions ?? []);
  }, [open, admin]);

  if (!open || !admin) return null;

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Permissions</DialogTitle>
          <DialogDescription>{admin.name} — {admin.email}</DialogDescription>
        </DialogHeader>
        <PermissionChecklist value={permissions} onChange={setPermissions} />
        <div className="flex gap-3 pt-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" disabled={saving} onClick={() => onSave(permissions)}>
            {saving && <Loader2 size={13} className="mr-1.5 animate-spin" />}
            Save Permissions
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminsPage() {
  const { user: me } = useSelector((s) => s.auth);
  const [admins, setAdmins] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [permModal, setPermModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(EP.admins.list, {
        params: { page, limit: 20, ...(search && { search }) },
      });
      setAdmins(res.data.admins ?? []);
      setPagination(res.data.pagination ?? {});
    } catch { notify.error("Failed to load admins"); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (form) => {
    setSaving(true);
    try {
      await axiosInstance.post(EP.admins.create, form);
      notify.success("Admin created");
      setModal(null);
      load();
    } catch (err) { notify.error(err.response?.data?.message ?? "Failed"); }
    finally { setSaving(false); }
  };

  const handleUpdate = async (form) => {
    setSaving(true);
    try {
      await axiosInstance.patch(EP.admins.update(modal.id), {
        name: form.name,
        permissions: form.permissions,
      });
      notify.success("Admin updated");
      setModal(null);
      load();
    } catch (err) { notify.error(err.response?.data?.message ?? "Failed"); }
    finally { setSaving(false); }
  };

  const handlePermissions = async (permissions) => {
    setSaving(true);
    try {
      await axiosInstance.patch(EP.admins.permissions(permModal.id), { permissions });
      notify.success("Permissions updated");
      setPermModal(null);
      load();
    } catch (err) { notify.error(err.response?.data?.message ?? "Failed"); }
    finally { setSaving(false); }
  };

  const handleBlock = async (admin) => {
    try {
      await axiosInstance.patch(EP.admins.block(admin.id));
      notify.success(admin.isBlocked ? "Admin unblocked" : "Admin blocked");
      load();
    } catch (err) { notify.error(err.response?.data?.message ?? "Failed"); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await axiosInstance.delete(EP.admins.delete(deleteTarget.id));
      notify.success("Admin deleted");
      setDeleteTarget(null);
      load();
    } catch (err) { notify.error(err.response?.data?.message ?? "Failed"); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2 text-foreground">
            <ShieldCheck size={19} className="text-muted-foreground" /> Admins
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pagination.total ?? admins.length} admin account{(pagination.total ?? admins.length) !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="h-9 pl-8 text-sm w-52"
              placeholder="Search admins…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <Button size="sm" onClick={() => setModal("create")}>
            <Plus size={13} className="mr-1.5" /> New Admin
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30">
            <tr>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Admin</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Permissions</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && admins.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-10">
                <Loader2 size={18} className="animate-spin mx-auto text-muted-foreground" />
              </td></tr>
            ) : admins.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-10 text-sm text-muted-foreground">
                No admins found.
              </td></tr>
            ) : admins.map((admin) => {
              const isBlocked = admin.isBlocked;
              const isSelf = me?.id === admin.user_id;
              return (
                <tr key={admin.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{admin.name}</p>
                    <p className="text-xs text-muted-foreground">{admin.email}</p>
                    <Badge variant="outline" className="text-[10px] mt-0.5 capitalize">
                      {admin.role?.toLowerCase().replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1 max-w-sm">
                      {admin.permissions?.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">No permissions</span>
                      ) : admin.permissions?.map((p) => (
                        <span key={p} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                          {p.replace("manage_", "")}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "text-[11px] font-medium px-2 py-0.5 rounded-full",
                      isBlocked
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    )}>
                      {isBlocked ? "Blocked" : "Active"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end items-center gap-1">
                      {/* Reset password + Login as — hidden for self and super admins */}
                      {!isSelf && (
                        <AdminUserActions
                          userId={admin.user_id}
                          userEmail={admin.email}
                          userRole={admin.role || "ADMIN"}
                          userName={admin.name}
                        />
                      )}
                      <button onClick={() => setPermModal(admin)} title="Manage Permissions"
                        className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                        <Key size={13} />
                      </button>
                      <button onClick={() => setModal(admin)} title="Edit"
                        className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleBlock(admin)}
                        title={isBlocked ? "Unblock" : "Block"}
                        className={cn(
                          "h-7 w-7 rounded-md flex items-center justify-center transition-colors",
                          isBlocked
                            ? "text-muted-foreground hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                            : "text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950"
                        )}>
                        {isBlocked ? <Unlock size={13} /> : <Lock size={13} />}
                      </button>
                      {admin.role !== "SUPER_ADMIN" && !isSelf && (
                        <button onClick={() => setDeleteTarget(admin)} title="Delete"
                          className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-1.5">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={cn(
                "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                p === page ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}>
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Modals */}
      <AdminModal
        open={!!modal}
        onClose={() => setModal(null)}
        onSave={modal === "create" ? handleCreate : handleUpdate}
        initialData={modal !== "create" ? modal : null}
        saving={saving}
      />
      <PermissionsModal
        open={!!permModal}
        onClose={() => setPermModal(null)}
        onSave={handlePermissions}
        admin={permModal}
        saving={saving}
      />

      {/* Delete confirm */}
      {deleteTarget && (
        <Dialog open onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete Admin</DialogTitle>
              <DialogDescription>
                This will permanently delete <span className="font-semibold text-foreground">{deleteTarget.name}</span>'s account and cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="destructive" className="flex-1" onClick={handleDelete} disabled={saving}>
                {saving && <Loader2 size={13} className="mr-1.5 animate-spin" />} Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}