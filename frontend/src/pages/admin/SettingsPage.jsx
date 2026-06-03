// frontend/src/pages/SettingsPage.jsx
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Lock, User, Save, Eye, EyeOff } from "lucide-react";
import axiosInstance from "../../lib/axios.js";
import { EP } from "../../config/api.config.js";
import { notify } from "../../hooks/notify.js";

const Field = ({ label, name, type = "text", value, onChange, placeholder, readOnly }) => (
  <div>
    <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      readOnly={readOnly}
      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 read-only:bg-slate-50 read-only:text-slate-500"
    />
  </div>
);

const PasswordField = ({ label, name, value, onChange }) => {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          className="w-full border border-slate-200 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="button" onClick={() => setShow((p) => !p)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
};

export default function SettingsPage() {
  const { user } = useSelector((s) => s.auth ?? {});
  const role = user?.role;

  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({});
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const res = await axiosInstance.get(EP.settings.profile);
      setProfile(res.data);
      const p = res.data.student ?? res.data.faculty ?? {};
      setProfileForm({
        first_name:  p.first_name  ?? "",
        last_name:   p.last_name   ?? "",
        name:        p.name        ?? "",
        phone:       p.phone       ?? "",
        address:     p.address     ?? "",
        gender:      p.gender      ?? "",
        dob:         p.dob         ? p.dob.split("T")[0] : "",
        designation: p.designation ?? "",
      });
    } catch {
      notify.error("Failed to load profile");
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((p) => ({ ...p, [name]: value }));
  };

  const handleProfileSave = async () => {
    setProfileSaving(true);
    try {
      const ep = role === "STUDENT" ? EP.settings.updateStudent : EP.settings.updateFaculty;
      await axiosInstance.patch(ep, profileForm);
      notify.success("Profile updated");
      loadProfile();
    } catch (err) {
      notify.error(err.response?.data?.message ?? "Save failed");
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePwChange = (e) => {
    const { name, value } = e.target;
    setPwForm((p) => ({ ...p, [name]: value }));
  };

  const handlePwSave = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      notify.error("Passwords do not match");
      return;
    }
    if (pwForm.newPassword.length < 6) {
      notify.error("Password must be at least 6 characters");
      return;
    }
    setPwSaving(true);
    try {
      await axiosInstance.patch(EP.auth.changePassword, {
        currentPassword: pwForm.currentPassword,
        newPassword:     pwForm.newPassword,
      });
      notify.success("Password changed successfully");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      notify.error(err.response?.data?.message ?? "Password change failed");
    } finally {
      setPwSaving(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile",  icon: User },
    { id: "password", label: "Password", icon: Lock },
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your account preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === id
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
              {(profile?.student?.name ?? profile?.faculty?.name ?? user?.email ?? "?")[0].toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-slate-800">{profile?.student?.name ?? profile?.faculty?.name ?? "—"}</p>
              <p className="text-sm text-slate-500">{profile?.email}</p>
            </div>
          </div>

          {/* Read-only */}
          <Field label="Email" name="email" value={profile?.email ?? ""} readOnly />
          <Field label="Role"  name="role"  value={role ?? ""}           readOnly />

          {/* Editable */}
          {role === "STUDENT" && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="First Name" name="first_name" value={profileForm.first_name} onChange={handleProfileChange} />
              <Field label="Last Name"  name="last_name"  value={profileForm.last_name}  onChange={handleProfileChange} />
              <Field label="Phone"      name="phone"      value={profileForm.phone}       onChange={handleProfileChange} />
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Gender</label>
                <select name="gender" value={profileForm.gender} onChange={handleProfileChange}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="none">— Select —</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <Field label="Date of Birth" name="dob"     type="date" value={profileForm.dob}     onChange={handleProfileChange} />
              <div className="col-span-2">
                <Field label="Address" name="address" value={profileForm.address} onChange={handleProfileChange} placeholder="Your address" />
              </div>
            </div>
          )}

          {role === "FACULTY" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Field label="Full Name"   name="name"        value={profileForm.name}        onChange={handleProfileChange} />
              </div>
              <Field label="Phone"         name="phone"       value={profileForm.phone}        onChange={handleProfileChange} />
              <Field label="Designation"   name="designation" value={profileForm.designation}  onChange={handleProfileChange} />
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Gender</label>
                <select name="gender" value={profileForm.gender} onChange={handleProfileChange}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="none">— Select —</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <Field label="Date of Birth" name="dob" type="date" value={profileForm.dob} onChange={handleProfileChange} />
            </div>
          )}

          {role === "ADMIN" && (
            <p className="text-sm text-slate-500 italic">Admin profile is managed by the system.</p>
          )}

          {role !== "ADMIN" && (
            <div className="pt-2">
              <button onClick={handleProfileSave} disabled={profileSaving}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors">
                <Save size={14} />
                {profileSaving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Password Tab */}
      {activeTab === "password" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <p className="text-sm text-slate-500">Choose a strong password. It must be at least 6 characters.</p>
          <PasswordField label="Current Password"  name="currentPassword"  value={pwForm.currentPassword}  onChange={handlePwChange} />
          <PasswordField label="New Password"       name="newPassword"      value={pwForm.newPassword}      onChange={handlePwChange} />
          <PasswordField label="Confirm Password"   name="confirmPassword"  value={pwForm.confirmPassword}  onChange={handlePwChange} />
          <div className="pt-2">
            <button onClick={handlePwSave} disabled={pwSaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors">
              <Lock size={14} />
              {pwSaving ? "Changing…" : "Change Password"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
