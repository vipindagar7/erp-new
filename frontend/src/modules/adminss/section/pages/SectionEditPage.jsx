// src/modules/section/pages/SectionEditPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { EP } from "../../../../config/api.config.js";
import { notify } from "../../../../hooks/notify.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SearchSelect from "../../../../components/shared/SearchSelect.jsx";

const STATUSES = ["ACTIVE", "INACTIVE", "MERGED", "DISCONTINUED", "GRADUATED"];

export default function SectionEditPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [section, setSection] = useState(null);
    const [form, setForm] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        axiosInstance.get(EP.sections.byId(id)).then(r => {
            const s = r.data?.data;
            setSection(s);
            setForm({
                name: s?.name || "",
                code: s?.code || "",
                semester: s?.semester || 1,
                academic_year: s?.academic_year || "",
                batch: s?.batch || "",
                batch_year: s?.batch_year || "",
                status: s?.status || "ACTIVE",
                capacity: s?.capacity || "",
                room_no: s?.room_no || "",
                description: s?.description || "",
                class_coordinator_id: s?.class_coordinator?.id || "",
                _coord_label: s?.class_coordinator?.name || "",
            });
        }).catch(() => notify.error("Failed to load section"))
            .finally(() => setLoading(false));
    }, [id]);

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const save = async () => {
        if (!form.name?.trim()) { notify.error("Section name required"); return; }
        setSaving(true);
        try {
            await axiosInstance.patch(EP.sections.update(id), {
                name: form.name.trim(),
                code: form.code.trim(),
                semester: parseInt(form.semester),
                academic_year: form.academic_year || null,
                batch: form.batch || null,
                batch_year: form.batch_year ? parseInt(form.batch_year) : null,
                status: form.status,
                capacity: form.capacity ? parseInt(form.capacity) : null,
                room_no: form.room_no || null,
                description: form.description || null,
                class_coordinator_id: form.class_coordinator_id || null,
            });
            notify.success("Section updated");
            navigate(`/admin/sections/${id}`);
        } catch (err) { notify.error(err); }
        finally { setSaving(false); }
    };

    const inp = "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";

    if (loading) return <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-muted-foreground" /></div>;

    return (
        <div className="space-y-5 max-w-2xl">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button onClick={() => navigate(`/admin/sections/${id}`)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
                    <ArrowLeft size={18} />
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-bold">Edit Section</h1>
                    <p className="text-sm text-muted-foreground">{section?.name} · {section?.code}</p>
                </div>
                <Button disabled={saving} onClick={save}>
                    {saving ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <Save size={13} className="mr-1.5" />}
                    {saving ? "Saving…" : "Save Changes"}
                </Button>
            </div>

            {/* Form */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
                {/* Basic */}
                <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Basic Info</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs">Section Name *</Label>
                            <input className={inp} value={form.name} onChange={set("name")} placeholder="CSE-A" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Code *</Label>
                            <input className={inp} value={form.code} onChange={set("code")} placeholder="CSE-A-4-2024" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Semester</Label>
                            <input className={inp} type="number" min={1} max={12} value={form.semester} onChange={set("semester")} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Status</Label>
                            <select className={inp} value={form.status} onChange={set("status")}>
                                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Academic Year</Label>
                            <input className={inp} value={form.academic_year} onChange={set("academic_year")} placeholder="2024-25" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Batch</Label>
                            <input className={inp} value={form.batch} onChange={set("batch")} placeholder="2022-26" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Batch Year</Label>
                            <input className={inp} type="number" value={form.batch_year} onChange={set("batch_year")} placeholder="2022" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Capacity</Label>
                            <input className={inp} type="number" value={form.capacity} onChange={set("capacity")} placeholder="60" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Room No</Label>
                            <input className={inp} value={form.room_no} onChange={set("room_no")} placeholder="Room 101" />
                        </div>
                    </div>
                </div>

                {/* Coordinator */}
                <div className="pt-4 border-t border-border space-y-1.5">
                    <Label className="text-xs">Class Coordinator</Label>
                    <SearchSelect endpoint={EP.faculty.list} dataPath="faculty" valueKey="id" labelKey="name"
                        subLabelKey="designation" value={form.class_coordinator_id} selectedLabel={form._coord_label}
                        onChange={(v, opt) => setForm(f => ({ ...f, class_coordinator_id: v, _coord_label: opt?.name || "" }))}
                        placeholder="Search faculty…" />
                </div>

                {/* Description */}
                <div className="pt-4 border-t border-border space-y-1.5">
                    <Label className="text-xs">Description</Label>
                    <textarea className={inp + " h-20 resize-none pt-2"} value={form.description}
                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional notes…" />
                </div>
            </div>
        </div>
    );
}