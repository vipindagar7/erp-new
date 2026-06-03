import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchDepartments, createDepartment, updateDepartment, deleteDepartment } from "../../../redux/academic/academicSlice.js";
import { notify } from "../../../hooks/notify.js";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TableShell, RowActions, Th, Td, EmptyRow, LoadingRow, ConfirmModal, Spinner } from "./AcademicPage.jsx";

function DeptModal({ open, onClose, onSubmit, initialData, loading }) {
  const [name, setName] = useState("");
  useEffect(() => { if (open) setName(initialData?.name || ""); }, [open, initialData]);
  if (!open) return null;
  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader><DialogTitle>{initialData ? "Edit Department" : "New Department"}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label>Department Name *</Label>
            <Input className="h-9 text-sm" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Computer Science" />
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" disabled={!name.trim() || loading} onClick={() => onSubmit({ name: name.trim() })}>
            {loading && <Spinner size={13} />} Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function DepartmentsPage() {
  const dispatch = useDispatch();
  const { list, pagination, loading, actionLoading } = useSelector((s) => s.academic.departments);
  const [search, setSearch]   = useState("");
  const [page,   setPage]     = useState(1);
  const [modal,  setModal]    = useState(null); // null | "create" | dept obj
  const [del,    setDel]      = useState(null);

  const load = useCallback(() => {
    dispatch(fetchDepartments({ page, limit: 20, ...(search && { search }) }));
  }, [page, search, dispatch]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (data) => {
    const r = await dispatch(createDepartment(data));
    if (createDepartment.fulfilled.match(r)) { notify.success("Department created"); setModal(null); load(); }
    else notify.error(r.payload);
  };
  const handleUpdate = async (data) => {
    const r = await dispatch(updateDepartment({ id: modal.id, data }));
    if (updateDepartment.fulfilled.match(r)) { notify.success("Updated"); setModal(null); load(); }
    else notify.error(r.payload);
  };
  const handleDelete = async () => {
    const r = await dispatch(deleteDepartment(del.id));
    if (deleteDepartment.fulfilled.match(r)) { notify.success("Deleted"); setDel(null); load(); }
    else notify.error(r.payload);
  };

  return (
    <>
      <TableShell
        icon={Building2} title="Departments"
        subtitle={`${pagination.total} departments`}
        onAdd={() => setModal("create")}
        templateUrl="/departments/template"
        bulkUploadUrl="/departments/bulk-upload"
        onRefresh={load}
        loading={loading}
        search={search} onSearch={(v) => { setSearch(v); setPage(1); }}
        pagination={pagination} onPageChange={setPage}
      >
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30">
            <tr>
              <Th>Name</Th>
              <Th>Programs</Th>
              <Th>Faculty</Th>
              <Th>Students</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && list.length === 0 ? <LoadingRow colSpan={5} />
              : list.length === 0 ? <EmptyRow colSpan={5} />
              : list.map((d) => (
                <tr key={d.id} className="hover:bg-muted/30">
                  <Td><p className="font-medium">{d.name}</p></Td>
                  <Td className="text-muted-foreground">{d._count?.programs ?? 0}</Td>
                  <Td className="text-muted-foreground">{d._count?.faculties ?? 0}</Td>
                  <Td className="text-muted-foreground">{d._count?.students ?? 0}</Td>
                  <Td className="text-right">
                    <RowActions onEdit={() => setModal(d)} onDelete={() => setDel(d)} />
                  </Td>
                </tr>
              ))}
          </tbody>
        </table>
      </TableShell>

      <DeptModal open={!!modal} onClose={() => setModal(null)}
        onSubmit={modal === "create" ? handleCreate : handleUpdate}
        initialData={modal !== "create" ? modal : null}
        loading={actionLoading} />

      <ConfirmModal open={!!del} onClose={() => setDel(null)}
        title="Delete Department"
        description={`Delete "${del?.name}"? All programs, courses and sections under it will also be deleted.`}
        onConfirm={handleDelete} loading={actionLoading} />
    </>
  );
}
