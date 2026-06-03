import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCourses, createCourse, updateCourse, deleteCourse, fetchPrograms, fetchDepartments } from "../../../redux/academic/academicSlice.js";
import { notify } from "../../../hooks/notify.js";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TableShell, RowActions, Th, Td, EmptyRow, LoadingRow, ConfirmModal, Spinner } from "./AcademicPage.jsx";

function CourseModal({ open, onClose, onSubmit, initialData, loading, programs }) {
  const [form, setForm] = useState({ name: "", program_id: "" });
  useEffect(() => {
    if (open) setForm({
      name:       initialData?.name || "",
      program_id: initialData?.program?.id || initialData?.program_id || "",
    });
  }, [open, initialData]);
  if (!open) return null;
  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>{initialData ? "Edit Course" : "New Course"}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label>Program *</Label>
            <Select value={form.program_id} onValueChange={(v) => setForm((f) => ({ ...f, program_id: v }))}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select program…" /></SelectTrigger>
              <SelectContent>
                {programs.length === 0
                  ? <SelectItem value="__none__" disabled>No programs found</SelectItem>
                  : programs.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} — {p.department?.name}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Course Name *</Label>
            <Input className="h-9 text-sm" value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. CSE AIML" />
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" disabled={!form.name.trim() || !form.program_id || loading}
            onClick={() => onSubmit(form)}>
            {loading && <Spinner size={13} />} Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function CoursesPage() {
  const dispatch = useDispatch();
  const { list, pagination, loading, actionLoading } = useSelector((s) => s.academic.courses);
  const { list: programs }    = useSelector((s) => s.academic.programs);
  const { list: departments } = useSelector((s) => s.academic.departments);

  const [search,     setSearch] = useState("");
  const [filterProg, setFProg]  = useState("all");
  const [filterDept, setFDept]  = useState("all");
  const [page,       setPage]   = useState(1);
  const [modal,      setModal]  = useState(null);
  const [del,        setDel]    = useState(null);

  const load = useCallback(() => {
    dispatch(fetchCourses({
      page, limit: 20,
      ...(search               && { search }),
      ...(filterProg !== "all" && { program_id: filterProg }),
      ...(filterDept !== "all" && { dept_id: filterDept }),
    }));
  }, [page, search, filterProg, filterDept, dispatch]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!programs.length)    dispatch(fetchPrograms({ limit: 200 }));
    if (!departments.length) dispatch(fetchDepartments({ limit: 200 }));
  }, []);

  const handleCreate = async (data) => {
    const r = await dispatch(createCourse(data));
    if (createCourse.fulfilled.match(r)) { notify.success("Created"); setModal(null); load(); }
    else notify.error(r.payload);
  };
  const handleUpdate = async (data) => {
    const r = await dispatch(updateCourse({ id: modal.id, data }));
    if (updateCourse.fulfilled.match(r)) { notify.success("Updated"); setModal(null); load(); }
    else notify.error(r.payload);
  };
  const handleDelete = async () => {
    const r = await dispatch(deleteCourse(del.id));
    if (deleteCourse.fulfilled.match(r)) { notify.success("Deleted"); setDel(null); load(); }
    else notify.error(r.payload);
  };

  // Filtered programs for the second dropdown (only show programs in selected dept)
  const filteredPrograms = filterDept === "all"
    ? programs
    : programs.filter((p) => p.department?.id === filterDept);

  const filters = (
    <>
      <Select value={filterDept} onValueChange={(v) => { setFDept(v); setFProg("all"); setPage(1); }}>
        <SelectTrigger className="h-9 text-sm w-[160px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Departments</SelectItem>
          {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filterProg} onValueChange={(v) => { setFProg(v); setPage(1); }}>
        <SelectTrigger className="h-9 text-sm w-[160px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Programs</SelectItem>
          {filteredPrograms.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
        </SelectContent>
      </Select>
    </>
  );

  return (
    <>
      <TableShell icon={BookOpen} title="Courses" subtitle={`${pagination.total} courses`}
        onAdd={() => setModal("create")} templateUrl="/courses/template" bulkUploadUrl="/courses/bulk-upload"
        onRefresh={load} loading={loading} search={search} onSearch={(v) => { setSearch(v); setPage(1); }}
        filters={filters} pagination={pagination} onPageChange={setPage}>
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30">
            <tr>
              <Th>Course</Th><Th>Program</Th><Th>Department</Th><Th>Sections</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && list.length === 0 ? <LoadingRow colSpan={5} />
              : list.length === 0 ? <EmptyRow colSpan={5} message="No courses found. Add one or upload in bulk." />
              : list.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30">
                  <Td><p className="font-medium">{c.name}</p></Td>
                  <Td className="text-muted-foreground">{c.program?.name || "—"}</Td>
                  <Td className="text-muted-foreground">{c.program?.department?.name || "—"}</Td>
                  <Td className="text-muted-foreground">{c._count?.sections ?? 0}</Td>
                  <Td className="text-right">
                    <RowActions onEdit={() => setModal(c)} onDelete={() => setDel(c)} />
                  </Td>
                </tr>
              ))}
          </tbody>
        </table>
      </TableShell>

      <CourseModal open={!!modal} onClose={() => setModal(null)}
        onSubmit={modal === "create" ? handleCreate : handleUpdate}
        initialData={modal !== "create" ? modal : null}
        loading={actionLoading} programs={programs} />

      <ConfirmModal open={!!del} onClose={() => setDel(null)} title="Delete Course"
        description={`Delete "${del?.name}"? All sections under it will also be deleted.`}
        onConfirm={handleDelete} loading={actionLoading} />
    </>
  );
}