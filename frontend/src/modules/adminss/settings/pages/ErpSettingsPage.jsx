// src/modules/settings/pages/ErpSettingsPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector }  from "react-redux";
import {
  Shield, Settings, Bell, BookOpen, Cpu,
  Save, RotateCcw, Loader2, AlertTriangle, Check,
  Lock, ShieldOff,
} from "lucide-react";
import axiosInstance from "../../../../lib/axios.js";
import { notify } from "../../../../hooks/notify.js";
import { usePageGuard } from "../../../../components/shared/PageGuard.jsx";

const CATEGORIES = [
  { key: "security",      label: "Security & Auth",    icon: Shield,   color: "text-red-600 bg-red-50"    },
  { key: "academic",      label: "Academic",           icon: BookOpen, color: "text-blue-600 bg-blue-50"  },
  { key: "notifications", label: "Notifications",      icon: Bell,     color: "text-amber-600 bg-amber-50"},
  { key: "system",        label: "System",             icon: Cpu,      color: "text-violet-600 bg-violet-50"},
];

function SettingInput({ setting, value, onChange }) {
  if (setting.data_type === "boolean") {
    return (
      <button
        onClick={() => onChange(setting.key, value === "true" ? "false" : "true")}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          value === "true" ? "bg-primary" : "bg-muted"
        }`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          value === "true" ? "translate-x-6" : "translate-x-1"
        }`} />
      </button>
    );
  }
  if (setting.data_type === "number") {
    return (
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(setting.key, e.target.value)}
        className="w-32 h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    );
  }
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(setting.key, e.target.value)}
      className="w-64 h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
    />
  );
}



// ── Login Block (Root Only) ────────────────────────────────────
function LoginBlockSettings({ isRoot }) {
  const [blocks, setBlocks] = useState({ student: false, faculty: false });
  const [saving, setSaving] = useState("");

  useEffect(() => {
    ["student","faculty"].forEach(type => {
      axiosInstance.get(`/settings/erp`).then(r => { const s = (r.data?.data||[]).find(x=>x.key===`${type}_login_blocked`); return { data: { data: s } }; })
        .then(r => setBlocks(b => ({ ...b, [type]: r.data?.data?.value === "true" })))
        .catch(() => {});
    });
  }, []);

  const toggle = async (type) => {
    if (!isRoot) { notify.error("Root admin only"); return; }
    setSaving(type);
    const newVal = !blocks[type];
    try {
      await axiosInstance.patch("/settings/erp", {
        updates: [{ key: `${type}_login_blocked`, value: String(newVal) }]
      });
      setBlocks(b => ({ ...b, [type]: newVal }));
      notify.success(`${type === "student" ? "Student" : "Faculty"} login ${newVal ? "blocked" : "unblocked"}`);
    } catch(e) { notify.error("Failed"); }
    finally { setSaving(""); }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <p className="text-sm font-semibold flex items-center gap-2">
        <Lock size={14}/>Login Access Control
        {!isRoot && <span className="text-xs text-amber-600">(Root admin only)</span>}
      </p>
      {[
        { key:"student", label:"Student Login",  desc:"Block all student portal logins" },
        { key:"faculty", label:"Faculty Login",  desc:"Block all faculty/staff logins" },
      ].map(item => (
        <div key={item.key} className={`flex items-center justify-between p-3.5 rounded-xl border ${blocks[item.key] ? "bg-red-50 border-red-200" : "border-border"}`}>
          <div>
            <p className="text-sm font-medium">{blocks[item.key] && <span className="mr-1.5 text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">BLOCKED</span>}{item.label}</p>
            <p className="text-xs text-muted-foreground">{item.desc}</p>
          </div>
          <button onClick={() => toggle(item.key)} disabled={!isRoot || !!saving}
            className={`w-11 h-6 rounded-full relative transition-colors disabled:opacity-40 ${blocks[item.key] ? "bg-red-500" : "bg-muted"}`}>
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${blocks[item.key] ? "translate-x-[22px]" : "translate-x-1"}`}/>
          </button>
        </div>
      ))}
    </div>
  );
}

export default function ErpSettingsPage() {
  const { user } = useSelector(s => s.auth);
  const isRoot = user?.is_root === true || user?.role === "SUPER_ADMIN";
  const { isSuperAdmin } = usePageGuard();
  const [settings, setSettings]   = useState([]);
  const [changes, setChanges]     = useState({});
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [activeCategory, setActiveCategory] = useState("security");

  useEffect(() => {
    axiosInstance.get("/settings/erp")
      .then((r) => setSettings(r.data?.data ?? []))
      .catch(() => notify.error("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key, value) => {
    setChanges((c) => ({ ...c, [key]: value }));
  };

  const getValue = (setting) => changes[setting.key] ?? setting.value;

  const handleSave = async () => {
    if (!Object.keys(changes).length) return notify.info("No changes to save");
    setSaving(true);
    try {
      const updates = Object.entries(changes).map(([key, value]) => ({ key, value }));
      await axiosInstance.patch("/settings/erp", { updates });
      // Apply changes to local state
      setSettings((prev) => prev.map((s) => changes[s.key] !== undefined ? { ...s, value: changes[s.key] } : s));
      setChanges({});
      notify.success("Settings saved");
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setChanges({});
    notify.info("Changes discarded");
  };

  if (!isSuperAdmin) return (
    <div className="text-center py-20 text-muted-foreground">
      <Shield size={36} className="mx-auto mb-3 opacity-30" />
      <p className="text-sm font-medium">Super Admin access required</p>
    </div>
  );

  const categorySettings = settings.filter((s) => s.category === activeCategory);
  const pendingChanges    = Object.keys(changes).length;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">ERP System Settings</h1>
          <p className="text-sm text-muted-foreground">Configure system-wide behaviour, security and academic settings.</p>
        </div>
        {pendingChanges > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
              {pendingChanges} unsaved change{pendingChanges > 1 ? "s" : ""}
            </span>
            <button onClick={handleReset}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-input bg-background text-sm font-medium text-muted-foreground hover:bg-muted">
              <RotateCcw size={13} /> Discard
            </button>
            <button onClick={handleSave} disabled={saving}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50">
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              Save Changes
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Category tabs */}
        <div className="space-y-1">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const catChanges = settings.filter((s) => s.category === cat.key && changes[s.key] !== undefined).length;
            return (
              <button key={cat.key} onClick={() => setActiveCategory(cat.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeCategory === cat.key
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${cat.color}`}>
                  <Icon size={14} />
                </div>
                <span className="flex-1 text-left">{cat.label}</span>
                {catChanges > 0 && (
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {catChanges}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Settings panel */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl divide-y divide-border">
              {categorySettings.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-foreground">No settings in this category.</div>
              ) : (
                categorySettings.map((setting) => {
                  const currentValue = getValue(setting);
                  const changed = changes[setting.key] !== undefined;
                  return (
                    <div key={setting.key} className={`flex items-center justify-between gap-4 px-5 py-4 ${changed ? "bg-amber-50/50 dark:bg-amber-950/10" : ""}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">{setting.label}</p>
                          {setting.is_system && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">System</span>
                          )}
                          {changed && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Modified</span>
                          )}
                        </div>
                        {setting.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{setting.description}</p>
                        )}
                        <p className="text-[10px] font-mono text-muted-foreground/60 mt-0.5">{setting.key}</p>
                      </div>
                      <div className="shrink-0">
                        <SettingInput setting={setting} value={currentValue} onChange={handleChange} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-card border border-destructive/20 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-destructive" />
          <p className="text-sm font-semibold text-destructive">Danger Zone</p>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Maintenance Mode</p>
            <p className="text-xs text-muted-foreground">Blocks all non-Super Admin logins. Use with caution.</p>
          </div>
          <SettingInput
            setting={{ key: "maintenance_mode", data_type: "boolean" }}
            value={getValue({ key: "maintenance_mode", value: settings.find((s) => s.key === "maintenance_mode")?.value ?? "false" })}
            onChange={handleChange}
          />
        </div>
      </div>
      <LoginBlockSettings isRoot={isRoot} />
    </div>
  );
}