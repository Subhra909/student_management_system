import { useState, useEffect, useRef } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { LogOut, LayoutDashboard, BookOpen, ShieldCheck, Globe, Bell, ChevronDown, GraduationCap, X } from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

export default function Layout() {
  const { profile, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => { await logout(); navigate("/login"); };

  const isDashboard = location.pathname === "/" || location.pathname.includes("/dashboard") ||
                      location.pathname === "/admin" || location.pathname === "/superadmin";

  // Fetch notifications for students/admins
  useEffect(() => {
    if (!user || profile?.role === "superadmin") return;
    const endpoint = profile?.role === "admin" ? "/api/admin/notifications" : "/api/student/notifications";
    const fetchNotifs = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.slice(0, 8));
          setUnreadCount(data.filter((n: any) => !n.isRead && !n.readBy?.includes(user.uid)).length);
        }
      } catch {}
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [user, profile]);

  // Close notif panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifPanel(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = profile?.name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "U";
  const navLinks = [
    { label: "Dashboard", path: "/", icon: LayoutDashboard },
  ];

  const notifTypeColor = (type: string) => {
    const map: any = { success: "emerald", warning: "amber", alert: "rose", announcement: "indigo", info: "sky" };
    return map[type] || "slate";
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-main flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* ── Navigation Bar ── */}
      <nav className="sticky top-0 z-[100] h-16 flex items-center px-6 justify-between"
        style={{ background: "rgba(255,255,255,0.82)", backdropFilter: "blur(24px) saturate(160%)", WebkitBackdropFilter: "blur(24px) saturate(160%)", borderBottom: "1px solid rgba(224,231,255,0.7)", boxShadow: "0 1px 0 rgba(224,231,255,0.8), 0 4px 24px -4px rgba(99,102,241,0.08)" }}>

        {/* Logo */}
        <Link to="/" className="flex items-center group shrink-0">
          <div className="flex flex-col leading-none">
            <span className="font-black text-[15px] tracking-tighter text-slate-900 uppercase">
              {profile?.collegeName?.split(" ")[0] || "Edu"}
              <span className="gradient-text">{profile?.collegeName?.split(" ").slice(1).join(" ") || "Nexus"}</span>
            </span>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.3em]">
              {profile?.role === "superadmin" ? "Super Admin Portal" : 
               profile?.role === "admin" ? "Admin Portal" : "Student Portal"}
            </span>
          </div>
        </Link>

        {/* Center Nav */}
        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map((item) => (
            <Link key={item.path} to={item.path}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-semibold uppercase tracking-wider transition-all duration-200",
                (item.path === "/" ? location.pathname === "/" || location.pathname === "/dashboard" : location.pathname === item.path)
                  ? "bg-sky-500 text-white shadow-lg shadow-sky-100"
                  : "text-slate-500 hover:text-sky-600 hover:bg-sky-50"
              )}>
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </Link>
          ))}
          {profile?.role === "superadmin" && (
            <Link to="/superadmin"
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-semibold uppercase tracking-wider transition-all duration-200",
                location.pathname === "/superadmin"
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-200"
                  : "text-violet-600 hover:bg-violet-50 border border-violet-200"
              )}>
              <Globe className="w-3.5 h-3.5" />
              Admin Panel
            </Link>
          )}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          {user && profile?.role !== "superadmin" && (
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifPanel(v => !v)}
                className="relative w-9 h-9 rounded-xl flex items-center justify-center bg-slate-50 hover:bg-sky-50 hover:text-sky-600 text-slate-500 transition-all"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="notif-dot">{unreadCount > 9 ? "9+" : unreadCount}</span>
                )}
              </button>

              <AnimatePresence>
                {showNotifPanel && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50"
                  >
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                      <span className="font-bold text-slate-900 text-sm">Notifications</span>
                      <button onClick={() => setShowNotifPanel(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="max-h-72 overflow-y-auto custom-scrollbar divide-y divide-slate-50">
                       {notifications.length === 0 ? (
                        <p className="text-center text-slate-400 text-xs py-8 font-medium">No notifications yet</p>
                      ) : notifications.map((n) => (
                        <div key={n._id}
                          className={cn("px-5 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer", !n.isRead && !n.readBy?.includes(user?.uid) && "bg-sky-50/40")}
                          onClick={async () => {
                            const token = localStorage.getItem("token");
                            const endpoint = profile?.role === "admin" ? "/api/admin/notifications" : "/api/student/notifications";
                            await fetch(`${endpoint}/${n._id}/read`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
                            setNotifications(prev => prev.map(x => x._id === n._id ? { ...x, readBy: [...(x.readBy || []), user?.uid], isRead: true } : x));
                            setUnreadCount(prev => Math.max(0, prev - 1));
                          }}>
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 bg-${notifTypeColor(n.type)}-500`} />
                            <div>
                              <p className="text-[12px] font-semibold text-slate-900">{n.title}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                              <p className="text-[10px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      ))}

                    </div>
                    {notifications.length > 0 && (
                      <div className="px-5 py-3 border-t border-slate-100">
                        <button className="text-[11px] text-sky-600 font-semibold hover:text-sky-700">View all →</button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Divider */}
          <div className="h-8 w-px bg-slate-100 hidden sm:block" />

          {/* User Info + Logout */}
          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[12px] font-bold text-slate-900">{profile?.name}</span>
                <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">
                  {profile?.role === "superadmin" ? "Super Admin" : profile?.role === "admin" ? "Administrator" : profile?.enrollmentId || "Student"}
                </span>
              </div>
              <div className="avatar w-9 h-9 text-[11px] shrink-0">
                {profile?.profilePicture
                  ? <img src={profile.profilePicture} className="w-9 h-9 rounded-2xl object-cover" alt="" />
                  : initials}
              </div>
              <button
                onClick={handleLogout}
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-50 hover:bg-rose-50 hover:text-rose-500 text-slate-400 transition-all"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-gradient-dashboard">
        <Outlet />
      </main>


      {/* ── Footer ── */}
      {!isDashboard && (
        <footer className="relative bg-white border-t border-sky-100/60 py-10 px-8 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(242,159,103,0.4), rgba(59,143,243,0.4), transparent)" }} />
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center">
              <div>
                <span className="font-black text-sm text-slate-900 uppercase tracking-tight">{profile?.collegeName || "EduNexus"}</span>
                <p className="text-[10px] text-slate-400 font-medium">Student Management Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <span className="text-[11px] font-semibold text-slate-400 cursor-pointer hover:text-sky-600 transition-colors">Support</span>
            </div>
            <p className="text-[10px] text-slate-300 font-medium">© 2026 EduNexus · All Rights Reserved</p>
          </div>
        </footer>
      )}

    </div>
  );
}

