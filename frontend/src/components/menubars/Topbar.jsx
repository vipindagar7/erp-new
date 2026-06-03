import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../../redux/auth/authSlice.js";
import { useTheme } from "../../hooks/themeContext.jsx";
import { notify } from "../../hooks/notify.js";
import ChangePasswordModal from "../../components/modal/changePasswordModal.jsx";
import NotificationBell from "../NotificationBell.jsx";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Sun, Moon, Bell, LogOut, KeyRound, User, ChevronDown,
} from "lucide-react";
import { cn } from "../../lib/utils.js";

function ThemeToggle() {
    const { theme, toggle } = useTheme();
    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent"
        >
            {theme === "dark"
                ? <Sun size={16} />
                : <Moon size={16} />
            }
        </Button>
    );
}

function Avatar({ name, role }) {
    const initials = name
        ? name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
        : "?";

    const roleColors = {
        SUPER_ADMIN: "from-violet-600 to-purple-700",
        ADMIN: "from-purple-500 to-violet-600",
        FACULTY: "from-blue-500 to-indigo-600",
        STUDENT: "from-emerald-500 to-teal-600",
    };

    return (
        <div className={cn(
            "w-8 h-8 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-xs shadow-sm",
            roleColors[role] || "from-slate-500 to-slate-700"
        )}>
            {initials}
        </div>
    );
}

function ProfileInfo({ name, email, role }) {
    const roleLabel = {
        SUPER_ADMIN: "Super Admin",
        ADMIN: "Admin",
        FACULTY: "Faculty",
        STUDENT: "Student",
    }[role] || role;

    return (
        <div className="flex items-center gap-3 px-1 py-0.5">
            <Avatar name={name} role={role} />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{name || "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{email}</p>
            </div>
        </div>
    );
}

export default function Topbar({ title }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((s) => s.auth);
    const [changePwOpen, setChangePwOpen] = useState(false);

    // Derive display name from nested profile
    const profile = user?.student || user?.faculty || user?.admin;
    const displayName = profile?.name || user?.email?.split("@")[0] || "User";

    const handleLogout = async () => {
        await dispatch(logout());
        navigate("/login");
        notify.success("Logged out successfully");
    };

    return (
        <>
            <header className="h-14 shrink-0 flex items-center justify-between px-5 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30">
                {/* Left: page title or breadcrumb */}
                <div>
                    <h1 className="text-sm font-semibold text-foreground">{title}</h1>
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-1">
                    <ThemeToggle />
                    <NotificationBell />

                    {/* Divider */}
                    <div className="w-px h-5 bg-border mx-1" />

                    {/* Profile dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className={cn(
                                "flex items-center gap-2 h-9 px-2 rounded-xl transition-colors",
                                "hover:bg-accent text-foreground outline-none focus:ring-2 focus:ring-ring"
                            )}>
                                <Avatar name={displayName} role={user?.role} />
                                <div className="hidden sm:block text-left">
                                    <p className="text-xs font-semibold leading-tight text-foreground max-w-[120px] truncate">{displayName}</p>
                                    <p className="text-[10px] text-muted-foreground leading-tight capitalize">
                                        {user?.role?.toLowerCase().replace("_", " ")}
                                    </p>
                                </div>
                                <ChevronDown size={13} className="text-muted-foreground hidden sm:block" />
                            </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-64 mt-1">
                            {/* Profile header */}
                            <DropdownMenuLabel className="font-normal py-3">
                                <ProfileInfo
                                    name={displayName}
                                    email={user?.email}
                                    role={user?.role}
                                />
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            {/* Role badge */}
                            <div className="px-3 py-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">Role</span>
                                    <Badge variant="secondary" className="text-[10px] font-semibold capitalize">
                                        {user?.role?.toLowerCase().replace("_", " ")}
                                    </Badge>
                                </div>
                                {user?.email && (
                                    <div className="flex items-center justify-between mt-1.5">
                                        <span className="text-xs text-muted-foreground">Email</span>
                                        <span className="text-xs text-foreground font-medium truncate max-w-[140px]">{user.email}</span>
                                    </div>
                                )}
                                {profile?.emp_id && (
                                    <div className="flex items-center justify-between mt-1.5">
                                        <span className="text-xs text-muted-foreground">Emp ID</span>
                                        <span className="text-xs text-mono font-medium">{profile.emp_id}</span>
                                    </div>
                                )}
                                {profile?.roll_no && (
                                    <div className="flex items-center justify-between mt-1.5">
                                        <span className="text-xs text-muted-foreground">Roll No.</span>
                                        <span className="text-xs text-mono font-medium">{profile.roll_no}</span>
                                    </div>
                                )}
                            </div>
                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                                className="cursor-pointer gap-2.5 py-2.5"
                                onClick={() => setChangePwOpen(true)}
                            >
                                <KeyRound size={14} className="text-muted-foreground" />
                                Change Password
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                                className="cursor-pointer gap-2.5 py-2.5 text-destructive focus:text-destructive focus:bg-destructive/10"
                                onClick={handleLogout}
                            >
                                <LogOut size={14} />
                                Sign Out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            <ChangePasswordModal open={changePwOpen} onClose={() => setChangePwOpen(false)} />
        </>
    );
}