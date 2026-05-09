import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { LogOut, LayoutDashboard, BookOpen, Menu, X, Info, HelpCircle, Clock, Search } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn, getCurrentIST } from "../lib/utils";

export default function Layout() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = profile?.role === "admin" ? [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "About", href: "/about", icon: Info },
    { name: "Help", href: "/help", icon: HelpCircle },
  ] : [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "About", href: "/about", icon: Info },
    { name: "Help", href: "/help", icon: HelpCircle },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex overflow-hidden">
      {/* Mobile Trigger */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-50 p-4 bg-brand-accent text-brand-bg rounded-full shadow-2xl"
      >
        {isSidebarOpen ? <X /> : <Menu />}
      </button>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-[220px] bg-brand-sidebar border-r border-brand-border transform transition-transform duration-300 lg:translate-x-0 lg:static flex flex-col shrink-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-5 border-b border-brand-border flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-brand-accent" />
          <span className="font-bold text-base tracking-tight text-brand-accent uppercase">EduNexus</span>
        </div>

        <nav className="flex-1 py-4 flex flex-col">
          <div className="px-5 py-2 text-[10px] uppercase font-bold text-brand-muted tracking-widest">Main Menu</div>
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setIsSidebarOpen(false)}
              className="flex items-center gap-3 px-5 py-2.5 text-brand-muted hover:text-brand-text hover:bg-brand-card transition-all group font-medium"
            >
              <item.icon className="w-4 h-4 group-hover:text-brand-accent transition-colors" />
              {item.name}
            </Link>
          ))}

          <div className="mt-auto p-4 border-t border-brand-border space-y-3">
             <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded bg-brand-accent/20 flex items-center justify-center text-brand-accent font-bold text-xs">
                  {profile?.name?.[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">{profile?.name}</p>
                  <p className="text-[10px] text-brand-muted truncate capitalize">{profile?.role}</p>
                </div>
                <button onClick={handleLogout} className="p-1.5 hover:text-red-500 transition-colors">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-14 bg-brand-sidebar border-b border-brand-border flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4 text-xs font-mono text-yellow-500 font-semibold">
            <Clock className="w-4 h-4" />
            IST: {getCurrentIST().split(' ')[1]}
            <span className="px-2 py-0.5 border border-brand-accent/30 text-brand-accent rounded text-[9px] uppercase tracking-wider">Session Active</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-2 w-3.5 h-3.5 text-brand-muted" />
              <input 
                type="text" 
                placeholder="Search command..."
                className="bg-brand-card border border-brand-border rounded px-9 py-1.5 text-xs outline-none focus:border-brand-accent/50 w-48 transition-all"
              />
            </div>
            <div className="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center text-brand-bg font-bold text-xs uppercase">
              {profile?.name?.[0]}{profile?.name?.split(' ')?.[1]?.[0] || profile?.name?.[1]}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-brand-bg custom-scrollbar">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
