import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSubjects, createSubject, updateSubject, deleteSubject } from "../../../redux/academic/academicSlice.js";
import { notify } from "../../../hooks/notify.js";
import { Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TableShell, RowActions, Th, Td, EmptyRow, LoadingRow, ConfirmModal, Spinner } from "./AcademicPage.jsx";
import { cn } from "../../../lib/utils.js";

const CATEGORIES = ["THEORY", "PRACTICAL", "TRAINING", "LIBRARY", "TUTORIAL", "OTHER"];
const CAT_COLOR = {
  THEORY: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  PRACTICAL: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  TRAINING: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  LIBRARY: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  TUTORIAL: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  OTHER: "bg-muted text-muted-foreground",
};

function SubjectModal({ open, onClose, onSubmit, initialData, loading }) {
  const BLANK = { name: "", code: "", nickname: "", category: "THEORY", credits: 4 };
  const [form, setForm] = useState(BLANK);
  useEffect(() => {
    if (open) setForm({
      name: initialData?.name || "",
      code: initialData?.code || "",
      nickname: initialData?.nickname || "",
      category: initialData?.category || "THEORY",
      credits: initialData?.credits ?? 4,
    });
  }, [open, initialData]);
  if (!open) return null;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setV = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>{initialData ? "Edit Subject" : "New Subject"}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input className="h-9 text-sm" value={form.name} onChange={set("name")} placeholder="e.g. Data Structures" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Code *</Label>
              <Input className="h-9 text-sm font-mono" value={form.code} onChange={set("code")} placeholder="CS301" />
            </div>
            <div className="space-y-1.5">
              <Label>Nickname</Label>
              <Input className="h-9 text-sm" value={form.nickname} onChange={set("nickname")} placeholder="DSA" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={setV("category")}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Credits</Label>
              <Input type="number" min={0} max={10} className="h-9 text-sm" value={form.credits}
                onChange={(e) => setForm((f) => ({ ...f, credits: parseInt(e.target.value) || 0 }))} />
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" disabled={!form.name.trim() || !form.code.trim() || loading}
            onClick={() => onSubmit({ ...form, credits: parseInt(form.credits) || 4 })}>
            {loading && <Spinner size={13} />} Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function SubjectsPage() {
  const dispatch = useDispatch();
  const { list, pagination, loading, actionLoading } = useSelector((s) => s.academic.subjects);

  const [search, setSearch] = useState("");
  const [filterCat, setFCat] = useState("all");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [del, setDel] = useState(null);

  const load = useCallback(() => {
    dispatch(fetchSubjects({
      page, limit: 20,
      ...(search && { search }),
      ...(filterCat !== "all" && { category: filterCat }),
    }));
  }, [page, search, filterCat, dispatch]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (data) => {
    const r = await dispatch(createSubject(data));
    if (createSubject.fulfilled.match(r)) { notify.success("Created"); setModal(null); load(); }
    else notify.error(r.payload);
  };
  const handleUpdate = async (data) => {
    const r = await dispatch(updateSubject({ id: modal.id, data }));
    if (updateSubject.fulfilled.match(r)) { notify.success("Updated"); setModal(null); load(); }
    else notify.error(r.payload);
  };
  const handleDelete = async () => {
    const r = await dispatch(deleteSubject(del.id));
    if (deleteSubject.fulfilled.match(r)) { notify.success("Deleted"); setDel(null); load(); }
    else notify.error(r.payload);
  };

  const filters = (
    <Select value={filterCat} onValueChange={(v) => { setFCat(v); setPage(1); }}>
      <SelectTrigger className="h-9 text-sm w-[150px]"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Categories</SelectItem>
        {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
      </SelectContent>
    </Select>
  );

  return (
    <>
      <TableShell icon={Library} title="Subjects" subtitle={`${pagination.total} subjects`}
        onAdd={() => setModal("create")} templateUrl="/subjects/template" bulkUploadUrl="/subjects/bulk-upload"
        onRefresh={load} loading={loading} search={search} onSearch={(v) => { setSearch(v); setPage(1); }}
        filters={filters} pagination={pagination} onPageChange={setPage}>
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30">
            <tr>
              <Th>Subject</Th><Th>Code</Th><Th>Category</Th><Th>Credits</Th>
              <Th>In Sections</Th><Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && list.length === 0 ? <LoadingRow colSpan={6} />
              : list.length === 0 ? <EmptyRow colSpan={6} message="No subjects found. Add one or upload in bulk." />
                : list.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/30">
                    <Td>
                      <p className="font-medium">{s.name}</p>
                      {s.nickname && <p className="text-xs text-muted-foreground">{s.nickname}</p>}
                    </Td>
                    <Td><span className="font-mono text-sm">{s.code}</span></Td>
                    <Td>
                      <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full",
                        CAT_COLOR[s.category] || CAT_COLOR.OTHER)}>
                        {s.category}
                      </span>
                    </Td>
                    <Td className="text-muted-foreground">{s.credits}</Td>
                    <Td className="text-muted-foreground">{s._count?.sectionSubjects ?? 0}</Td>
                    <Td className="text-right">
                      <RowActions onEdit={() => setModal(s)} onDelete={() => setDel(s)} />
                    </Td>
                  </tr>
                ))}
          </tbody>
        </table>
      </TableShell>

      <SubjectModal open={!!modal} onClose={() => setModal(null)}
        onSubmit={modal === "create" ? handleCreate : handleUpdate}
        initialData={modal !== "create" ? modal : null}
        loading={actionLoading} />

      <ConfirmModal open={!!del} onClose={() => setDel(null)} title="Delete Subject"
        description={`Delete "${del?.name}"? It will be removed from all sections.`}
        onConfirm={handleDelete} loading={actionLoading} />
    </>
  );
}