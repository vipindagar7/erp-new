import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPrograms, createProgram, updateProgram, deleteProgram, fetchDepartments } from "../../../redux/academic/academicSlice.js";
import { notify } from "../../../hooks/notify.js";
import { BookMarked } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TableShell, RowActions, Th, Td, EmptyRow, LoadingRow, ConfirmModal, Spinner } from "./AcademicPage.jsx";

function ProgramModal({ open, onClose, onSubmit, initialData, loading, departments }) {
  const [form, setForm] = useState({ name: "", dept_id: "" });
  useEffect(() => {
    if (open) setForm({
      name: initialData?.name || "",
      dept_id: initialData?.department?.id || initialData?.dept_id || "",
    });
  }, [open, initialData]);
  if (!open) return null;
  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>{initialData ? "Edit Program" : "New Program"}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label>Department *</Label>
            <Select value={form.dept_id} onValueChange={(v) => setForm((f) => ({ ...f, dept_id: v }))}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select department…" /></SelectTrigger>
              <SelectContent>
                {departments.length === 0
                  ? <SelectItem value="__none__" disabled>No departments found</SelectItem>
                  : departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Program Name *</Label>
            <Input className="h-9 text-sm" value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. B. Tech." />
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" disabled={!form.name.trim() || !form.dept_id || loading}
            onClick={() => onSubmit(form)}>
            {loading && <Spinner size={13} />} Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ProgramsPage() {
  const dispatch = useDispatch();
  const { list, pagination, loading, actionLoading } = useSelector((s) => s.academic.programs);
  const { list: departments } = useSelector((s) => s.academic.departments);

  const [search, setSearch] = useState("");
  const [filterDept, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [del, setDel] = useState(null);

  const load = useCallback(() => {
    dispatch(fetchPrograms({
      page, limit: 20,
      ...(search && { search }),
      ...(filterDept !== "all" && { dept_id: filterDept }),
    }));
  }, [page, search, filterDept, dispatch]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (!departments.length) dispatch(fetchDepartments({ limit: 200 })); }, []);

  const handleCreate = async (data) => {
    const r = await dispatch(createProgram(data));
    if (createProgram.fulfilled.match(r)) { notify.success("Created"); setModal(null); load(); }
    else notify.error(r.payload);
  };
  const handleUpdate = async (data) => {
    const r = await dispatch(updateProgram({ id: modal.id, data }));
    if (updateProgram.fulfilled.match(r)) { notify.success("Updated"); setModal(null); load(); }
    else notify.error(r.payload);
  };
  const handleDelete = async () => {
    const r = await dispatch(deleteProgram(del.id));
    if (deleteProgram.fulfilled.match(r)) { notify.success("Deleted"); setDel(null); load(); }
    else notify.error(r.payload);
  };

  const filters = (
    <Select value={filterDept} onValueChange={(v) => { setFilter(v); setPage(1); }}>
      <SelectTrigger className="h-9 text-sm w-[180px]"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Departments</SelectItem>
        {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
      </SelectContent>
    </Select>
  );

  return (
    <>
      <TableShell icon={BookMarked} title="Programs" subtitle={`${pagination.total} programs`}
        onAdd={() => setModal("create")} templateUrl="/programs/template" bulkUploadUrl="/programs/bulk-upload"
        onRefresh={load} loading={loading} search={search} onSearch={(v) => { setSearch(v); setPage(1); }}
        filters={filters} pagination={pagination} onPageChange={setPage}>
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30">
            <tr>
              <Th>Program</Th><Th>Department</Th><Th>Courses</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && list.length === 0 ? <LoadingRow colSpan={4} />
              : list.length === 0 ? <EmptyRow colSpan={4} message="No programs found. Add one or upload in bulk." />
                : list.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <Td><p className="font-medium">{p.name}</p></Td>
                    <Td className="text-muted-foreground">{p.department?.name || "—"}</Td>
                    <Td className="text-muted-foreground">{p._count?.courses ?? 0}</Td>
                    <Td className="text-right">
                      <RowActions onEdit={() => setModal(p)} onDelete={() => setDel(p)} />
                    </Td>
                  </tr>
                ))}
          </tbody>
        </table>
      </TableShell>

      <ProgramModal open={!!modal} onClose={() => setModal(null)}
        onSubmit={modal === "create" ? handleCreate : handleUpdate}
        initialData={modal !== "create" ? modal : null}
        loading={actionLoading} departments={departments} />

      <ConfirmModal open={!!del} onClose={() => setDel(null)} title="Delete Program"
        description={`Delete "${del?.name}"? All courses and sections under it will also be deleted.`}
        onConfirm={handleDelete} loading={actionLoading} />
    </>
  );
}