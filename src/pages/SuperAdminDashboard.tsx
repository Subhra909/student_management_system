import React, { useState, useEffect } from "react";
import { 
  Building2, Plus, Globe, ShieldCheck, Users, 
  Settings, Loader2, Zap, LayoutDashboard, Database,
  ArrowUpRight, AlertCircle, CheckCircle2, GraduationCap,
  Trash2, Activity, ShieldAlert, Mail, Phone, Calendar, Clock, LogOut,
  Pencil, UserCog
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../lib/auth";

interface Tenant {
  _id: string;
  tenantId: string;
  name: string;
  slug: string;
  logo?: string;
  address?: string;
  status: "active" | "suspended";
  departments?: string[];
  createdAt: string;
}

export default function SuperAdminDashboard() {
  const { logout } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalTenants: 0, totalStudents: 0, activeNodes: 0, uptime: "99.99%", health: "STABLE" });
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"nodes" | "system" | "security" | "settings">("nodes");
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [editingUser, setEditingUser] = useState<any | null>(null);

  // New Tenant Form State
  const [newTenant, setNewTenant] = useState({
    name: "",
    slug: "",
    adminEmail: "",
    adminPassword: "",
    adminName: "",
    departments: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [syncError, setSyncError] = useState("");

  const fetchTenants = async () => {
    try {
      const token = localStorage.getItem("token");
      const [tenantsRes, statsRes, usersRes] = await Promise.all([
        fetch("/api/superadmin/tenants", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/superadmin/stats", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/superadmin/users", { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (tenantsRes.ok) setTenants(await tenantsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      if (usersRes.ok) {
        setUsers(await usersRes.json());
      } else {
        setSyncError(`REGISTRY_OFFLINE: ${usersRes.status} ${usersRes.statusText}`);
      }
      if (tenantsRes.ok && statsRes.ok && usersRes.ok) setSyncError("");
    } catch (err: any) {
      console.error("SYNC_ERROR:", err);
      setSyncError(err.message || "Failed to synchronize with Nexus Grid");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
    const interval = setInterval(fetchTenants, 10000); 
    return () => clearInterval(interval);
  }, []);

  const toggleTenantStatus = async (tenantId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/superadmin/tenants/${tenantId}/toggle`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchTenants();
    } catch (err) { console.error(err); }
  };

  const deleteTenant = async (tenantId: string) => {
    if (!confirm("CRITICAL_ACTION: TERMINATE_NODE? ALL DATA WILL BE PERMANENTLY ERASED.")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/superadmin/tenants/${tenantId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchTenants();
    } catch (err) { console.error(err); }
  };

  const purgeTenantData = async (tenantId: string) => {
    if (!confirm("WIPE_INSTITUTIONAL_DATA? STUDENTS AND RECORDS WILL BE PURGED. ADMIN ACCOUNT WILL BE PRESERVED.")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/superadmin/tenants/${tenantId}/purge`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchTenants();
    } catch (err) { console.error(err); }
  };

  const deleteUser = async (uid: string) => {
    if (!confirm("PURGE_IDENTITY? THIS REMOVES THE USER AND ALL THEIR RECORDS.")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/superadmin/users/${uid}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchTenants();
    } catch (err) { console.error(err); }
  };

  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/superadmin/tenants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newTenant)
      });

      if (res.ok) {
        setMessage("COLLEGE_NODE_INITIALIZED_SUCCESSFULLY");
        setTimeout(() => {
          setShowAddModal(false);
          fetchTenants();
          setNewTenant({ name: "", slug: "", adminEmail: "", adminPassword: "", adminName: "", departments: "" });
          setMessage("");
        }, 1500);
      } else {
        const data = await res.json();
        setMessage(data.error || "DEPLOYMENT_FAILURE");
      }
    } catch (err) {
      setMessage("NETWORK_TIMEOUT");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/superadmin/tenants/${editingTenant.tenantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(editingTenant)
      });
      if (res.ok) {
        setEditingTenant(null);
        fetchTenants();
      } else {
        const data = await res.json();
        alert(`NODE_UPDATE_FAILURE: ${data.error || "UNKNOWN_ERROR"}`);
      }
    } catch (err) { 
      console.error(err); 
      alert("NETWORK_TRANSCEIVER_ERROR: Could not reach Nexus Grid.");
    } finally { setIsSubmitting(false); }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/superadmin/users/${editingUser.uid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(editingUser)
      });
      if (res.ok) {
        setEditingUser(null);
        fetchTenants();
      }
    } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };


  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-brand-bg min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-sky-500 animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Synchronizing_Nexus_Grid...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] relative">
      {/* Fluid animated background */}
      <div className="fluid-bg">
        <div className="fluid-blob fluid-blob-1" />
        <div className="fluid-blob fluid-blob-2" />
        <div className="fluid-blob fluid-blob-3" />
        <div className="fluid-blob fluid-blob-4" />
      </div>

      <div className="dashboard-content p-6 md:p-8 overflow-auto custom-scrollbar min-h-[calc(100vh-4rem)]">
        <div className="max-w-7xl mx-auto">
          <header className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                Super<span className="gradient-text">Admin</span>
              </h1>
              <p className="text-[11px] font-medium text-slate-400 mt-1">Nexus Grid Management Console</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-6 py-2.5 rounded-2xl font-black text-[11px] uppercase tracking-wider shadow-lg shadow-sky-100 transition-all hover:scale-105 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Add College
              </button>
              <button 
                onClick={logout}
                className="p-2.5 rounded-xl bg-white/70 backdrop-blur-md border border-slate-100 text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </header>

          {syncError && (
            <div className="mb-4 p-3 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl flex items-center gap-3 animate-pulse">
              <AlertCircle className="w-3 h-3" /> System_Synchronization_Failure: {syncError}
            </div>
          )}

          {/* Pill Navigation */}
          <nav className="pill-nav mb-8">
            {[
              { id: "nodes" as const, icon: LayoutDashboard, label: "Campus Overview" },
              { id: "system" as const, icon: Building2, label: "College Directory" },
              { id: "security" as const, icon: Users, label: "Student Registry" },
              { id: "settings" as const, icon: Settings, label: "Portal Settings" }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`pill-nav-item ${activeTab === item.id ? "active" : ""}`}
              >
                <item.icon className="w-3.5 h-3.5 shrink-0" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="space-y-8">
            {activeTab === "nodes" && (
              <>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                  {[
                    { label: "Active_Colleges", val: stats.activeNodes, icon: Building2, color: "text-sky-600" },
                    { label: "Total_Students", val: stats.totalStudents, icon: Users, color: "text-teal-600" },
                    { label: "System_Uptime", val: stats.uptime, icon: Zap, color: "text-amber-600" }
                  ].map((stat, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="premium-card">
                       <div className="flex justify-between items-start mb-6">
                          <div className={`p-3 rounded-2xl bg-slate-50 ${stat.color}`}><stat.icon className="w-6 h-6" /></div>
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Global_Metric</span>
                       </div>
                       <h3 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 mb-2">{stat.val}</h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{stat.label}</p>
                    </motion.div>
                  ))}
               </div>

               <div className="premium-card p-0 overflow-hidden">
                  <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                     <div>
                        <h3 className="text-xl font-black italic uppercase tracking-tight text-slate-900">Campus_Network_Directory</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">// Real-time management of campus portals</p>
                     </div>
                     <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black uppercase text-slate-900 tracking-widest">SYSTEM_ONLINE</span>
                     </div>
                  </div>

                  <div className="overflow-x-auto">
                     <table className="w-full text-left">
                        <thead>
                           <tr className="bg-slate-50/50 border-b border-slate-100">
                              <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">College_Name</th>
                              <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Node_Slug</th>
                              <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Departments</th>
                              <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                              <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Onboarded_At</th>
                              <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Action</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {tenants.map((tenant) => (
                              <tr key={tenant._id} className="hover:bg-slate-50/50 transition-colors group">
                                 <td className="px-10 py-6">
                                    <div className="flex items-center gap-4">
                                       <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center text-white font-black text-xs shadow-lg group-hover:scale-110 transition-transform">
                                          {tenant.name ? tenant.name.substring(0, 2).toUpperCase() : "???"}
                                       </div>
                                       <span className="font-black italic uppercase text-slate-900 tracking-tight">{tenant.name}</span>
                                    </div>
                                 </td>
                                 <td className="px-6 py-5">
                                    <span className="px-3 py-1 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-bold border border-slate-100">{tenant.slug}</span>
                                 </td>
                                 <td className="px-6 py-5">
                                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                                       {tenant.departments?.slice(0, 3).map((d: string) => (
                                          <span key={d} className="px-2 py-0.5 bg-sky-50 text-sky-600 rounded text-[9px] font-bold uppercase">{d}</span>
                                       ))}
                                       {tenant.departments?.length > 3 && <span className="text-[9px] font-bold text-slate-400">+{tenant.departments.length - 3}</span>}
                                       {!tenant.departments?.length && <span className="text-[9px] font-bold text-slate-300 italic">NONE_DEFINED</span>}
                                    </div>
                                 </td>
                                 <td className="px-6 py-5">
                                    <button onClick={() => toggleTenantStatus(tenant.tenantId)} className={`badge ${tenant.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                                       {tenant.status}
                                    </button>
                                 </td>
                                 <td className="px-10 py-6 text-xs font-bold text-slate-400">{new Date(tenant.createdAt).toLocaleDateString()}</td>
                                 <td className="px-10 py-6">
                                    <div className="flex items-center gap-2">
                                       <button onClick={() => setEditingTenant(tenant)} className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-sky-600 transition-all"><Pencil className="w-4 h-4" /></button>
                                       <button className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-sky-600 transition-all"><ArrowUpRight className="w-4 h-4" /></button>
                                       <button onClick={() => deleteTenant(tenant.tenantId)} className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-rose-600 transition-all"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
              </>
            )}

            {activeTab === "system" && (
              <div className="space-y-8">


                 <div className="premium-card p-0 overflow-hidden">
                    <div className="px-10 py-6 border-b border-slate-100 bg-slate-50/50"><h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Tenant_Deployment_Logs</h3></div>
                    <div className="p-10 space-y-4">
                       {tenants.map(t => (
                         <div key={t._id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-sky-100 transition-all">
                            <div className="flex items-center gap-4">
                               <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                               <div>
                                  <p className="text-xs font-black uppercase text-slate-900">{t.name} Node Initialized</p>
                                  <p className="text-[9px] font-mono text-slate-400 uppercase">UUID: {t.tenantId}</p>
                               </div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400">{new Date(t.createdAt).toLocaleString()}</span>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-8">
                 <div className="premium-card p-0 overflow-hidden">
                    <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                       <h3 className="text-xl font-black italic uppercase tracking-tight text-slate-900">Global_Identity_Registry</h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{users.length} Identities Authenticated</p>
                    </div>
                    <div className="overflow-x-auto">
                       <table className="w-full text-left">
                          <thead>
                             <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">User_Entity</th>
                                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Assigned_Node</th>
                                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Access_Role</th>
                                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Last_Verified</th>
                                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Action</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                             {users.map((user) => (
                                <tr key={user.uid} className="hover:bg-slate-50/50 transition-colors group">
                                   <td className="px-10 py-6">
                                      <div className="flex items-center gap-4">
                                         <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs uppercase overflow-hidden">
                                            {user.profilePicture ? (
                                              <img src={user.profilePicture} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                              user.name ? user.name[0] : "?"
                                            )}
                                         </div>
                                         <div>
                                            <p className="font-black italic uppercase text-slate-900 tracking-tight leading-none">{user.name}</p>
                                            <p className="text-[10px] font-mono text-slate-400 mt-1">{user.email}</p>
                                         </div>
                                      </div>
                                   </td>
                                   <td className="px-10 py-6"><span className="text-xs font-bold text-slate-600 uppercase italic">{user.collegeName || "Global_Nexus"}</span></td>
                                   <td className="px-10 py-6">
                                      <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                         user.role === 'admin' ? 'bg-amber-50 border-amber-100 text-amber-600' : 
                                         user.role === 'superadmin' ? 'bg-sky-500 border-sky-500 text-white' : 
                                         'bg-teal-50 border-teal-100 text-teal-600'
                                      }`}>
                                         {user.role}
                                      </span>
                                   </td>
                                   <td className="px-10 py-6 text-xs font-bold text-slate-400">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "NEVER_AUTHENTICATED"}</td>
                                   <td className="px-10 py-6">
                                      <button onClick={() => setEditingUser(user)} className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-sky-600 transition-all">
                                         <Pencil className="w-4 h-4" />
                                      </button>
                                      <button onClick={() => deleteUser(user.uid)} className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-rose-600 transition-all">
                                         <Trash2 className="w-4 h-4" />
                                      </button>
                                   </td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="max-w-2xl space-y-8">
                 <div className="premium-card">
                    <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-8">Portal_Global_Configuration</h3>
                    <div className="space-y-6">
                       {[
                         { label: "Environment_Mode", val: "PRODUCTION_GRID", icon: Globe },
                         { label: "Auth_Protocol", val: "JWT_AES_256", icon: ShieldCheck },
                         { label: "Data_Isolation", val: "TENANT_LEVEL_STRICT", icon: Database },
                         { label: "Telemetry", val: "ENABLED_REAL_TIME", icon: Activity }
                       ].map((set, i) => (
                         <div key={i} className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:border-sky-200 transition-all">
                            <div className="flex items-center gap-4">
                               <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform"><set.icon className="w-5 h-5 text-sky-600" /></div>
                               <span className="text-[11px] font-black uppercase tracking-widest text-slate-900">{set.label}</span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-sky-600">{set.val}</span>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="premium-card border-rose-100 bg-rose-50/30">
                    <h3 className="text-sm font-black uppercase tracking-widest text-rose-600 mb-4">DANGER_ZONE</h3>
                    <p className="text-xs text-slate-500 mb-6">These operations are irreversible and affect all system nodes.</p>
                    <button className="px-8 py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-rose-700 transition-all shadow-xl shadow-rose-100">
                       Flush_System_Caches
                    </button>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Tenant Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowAddModal(false)}
               className="absolute inset-0 bg-sky-900/40 backdrop-blur-md"
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 40 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 40 }}
               className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden"
             >
                <div className="p-10 bg-sky-500 text-white relative">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                   <h2 className="text-3xl font-black italic uppercase tracking-tighter">Provision_<span className="text-teal-200">Node</span></h2>
                   <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] mt-2">// Injecting new institutional entity into the federated grid</p>
                </div>

                <form onSubmit={handleAddTenant} className="p-10 space-y-8 bg-slate-50/50">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">College_Entity_Name</label>
                         <input 
                           type="text" required
                           className="premium-input" 
                           placeholder="MIT UNIVERSITY"
                           value={newTenant.name}
                           onChange={(e) => setNewTenant({...newTenant, name: e.target.value})}
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Identity_Slug</label>
                         <input 
                           type="text" required
                           className="premium-input" 
                           placeholder="mit-univ"
                           value={newTenant.slug}
                           onChange={(e) => setNewTenant({...newTenant, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                         />
                      </div>
                   </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Institutional_Departments (COMMA_SEPARATED)</label>
                       <textarea 
                         className="premium-input min-h-[100px] py-4" 
                         placeholder="Computer Science, Mechanical Engineering, Business Administration..."
                         value={newTenant.departments}
                         onChange={(e) => setNewTenant({...newTenant, departments: e.target.value})}
                       />
                    </div>

                   <div className="border-t border-slate-200 pt-8">
                      <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-900 mb-6 flex items-center gap-2">
                         <ShieldCheck className="w-4 h-4 text-sky-600" />
                         Admin_Credential_Set
                      </h4>
                      <div className="space-y-6">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Full_Name</label>
                               <input 
                                 type="text" required
                                 className="premium-input" 
                                 placeholder="ADMIN_IDENTITY"
                                 value={newTenant.adminName}
                                 onChange={(e) => setNewTenant({...newTenant, adminName: e.target.value})}
                               />
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Access_Email</label>
                               <input 
                                 type="email" required
                                 className="premium-input" 
                                 placeholder="admin@college.edu"
                                 value={newTenant.adminEmail}
                                 onChange={(e) => setNewTenant({...newTenant, adminEmail: e.target.value})}
                               />
                            </div>
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Security_Keyphrase</label>
                            <input 
                              type="password" required
                              className="premium-input" 
                              placeholder="••••••••"
                              value={newTenant.adminPassword}
                              onChange={(e) => setNewTenant({...newTenant, adminPassword: e.target.value})}
                            />
                         </div>
                      </div>
                   </div>

                   {message && (
                     <div className={`p-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest flex items-center gap-3 border ${
                        message.includes('SUCCESS') 
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                          : 'bg-rose-50 border-rose-100 text-rose-600'
                     }`}>
                        {message.includes('SUCCESS') ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        {message}
                     </div>
                   )}

                   <div className="flex gap-4">
                      <button 
                        type="button" 
                        onClick={() => setShowAddModal(false)}
                        className="flex-1 px-8 py-5 bg-white border border-slate-200 text-slate-600 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] hover:bg-slate-50 transition-all"
                      >
                         Cancel_Request
                      </button>
                      <button 
                        type="submit" disabled={isSubmitting}
                        className="flex-[2] px-8 py-5 bg-sky-500 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-xl shadow-sky-100 hover:bg-sky-600 transition-all flex items-center justify-center gap-3"
                      >
                         {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                         Initialize_Deployment
                      </button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}

        {editingTenant && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setEditingTenant(null)} className="absolute inset-0 bg-sky-900/40 backdrop-blur-md" />
             <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="bg-white rounded-[2.5rem] w-full max-w-xl p-10 relative z-10 shadow-2xl overflow-hidden border border-slate-100">
                <div className="mb-8">
                   <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 italic flex items-center gap-3">
                      <Building2 className="w-7 h-7 text-sky-600" /> Modify_Campus_Node
                   </h2>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">// UUID: {editingTenant.tenantId}</p>
                </div>

                <form onSubmit={handleUpdateTenant} className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">College_Name</label>
                      <input type="text" required className="premium-input" value={editingTenant.name} onChange={(e) => setEditingTenant({...editingTenant, name: e.target.value})} />
                   </div>
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Portal_Slug</label>
                         <input type="text" required className="premium-input" value={editingTenant.slug} onChange={(e) => setEditingTenant({...editingTenant, slug: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Status</label>
                         <select className="premium-input" value={editingTenant.status} onChange={(e) => setEditingTenant({...editingTenant, status: e.target.value as any})}>
                            <option value="active">ACTIVE</option>
                            <option value="suspended">SUSPENDED</option>
                         </select>
                      </div>
                   </div>
                                      <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Institutional_Departments (COMMA_SEPARATED)</label>
                      <textarea 
                        className="premium-input min-h-[100px] py-4" 
                        value={editingTenant.departments?.join(", ") || ""} 
                        onChange={(e) => setEditingTenant({...editingTenant, departments: e.target.value.split(",").map(d => d.trim())})} 
                      />
                   </div>
                                      <div className="border-t border-slate-100 pt-8 mt-8">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-600 mb-6 flex items-center gap-2">
                         <ShieldAlert className="w-4 h-4" /> Data_Operations_Danger_Zone
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                         <button 
                           type="button" 
                           onClick={() => purgeTenantData(editingTenant.tenantId)}
                           className="px-6 py-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-rose-100 transition-all"
                         >
                            Purge_Student_Data
                         </button>
                         <button 
                           type="button" 
                           onClick={() => deleteTenant(editingTenant.tenantId)}
                           className="px-6 py-4 bg-rose-600 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-100"
                         >
                            Terminate_College_Node
                         </button>
                      </div>
                   </div>
                   <div className="flex gap-4 pt-4">
                      <button type="button" onClick={() => setEditingTenant(null)} className="flex-1 px-8 py-5 bg-white border border-slate-200 text-slate-600 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] hover:bg-slate-50 transition-all">Cancel</button>
                      <button type="submit" disabled={isSubmitting} className="flex-[2] px-8 py-5 bg-sky-500 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-xl shadow-sky-100 hover:bg-sky-600 transition-all flex items-center justify-center gap-3">
                         {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Commit_Changes"}
                      </button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}

        {editingUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setEditingUser(null)} className="absolute inset-0 bg-sky-900/40 backdrop-blur-md" />
             <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="bg-white rounded-[2.5rem] w-full max-w-xl p-10 relative z-10 shadow-2xl overflow-hidden border border-slate-100">
                <div className="mb-8">
                   <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 italic flex items-center gap-3">
                      <UserCog className="w-7 h-7 text-amber-600" /> Manage_Identity_Entity
                   </h2>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">// UID: {editingUser.uid}</p>
                </div>

                <form onSubmit={handleUpdateUser} className="space-y-6">
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Full_Name</label>
                         <input type="text" required className="premium-input" value={editingUser.name} onChange={(e) => setEditingUser({...editingUser, name: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Registry_Email</label>
                         <input type="email" required className="premium-input" value={editingUser.email} onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} />
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Access_Role</label>
                         <select className="premium-input" value={editingUser.role} onChange={(e) => setEditingUser({...editingUser, role: e.target.value as any})}>
                            <option value="student">STUDENT</option>
                            <option value="admin">ADMINISTRATOR</option>
                            <option value="superadmin">SUPER_ADMIN</option>
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Department</label>
                         <input type="text" className="premium-input" value={editingUser.department} onChange={(e) => setEditingUser({...editingUser, department: e.target.value})} />
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Registry_UID</label>
                         <input type="text" className="premium-input" placeholder="ROLL_NUMBER" value={editingUser.rollNo} onChange={(e) => setEditingUser({...editingUser, rollNo: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Semester</label>
                         <select className="premium-input" value={editingUser.semester} onChange={(e) => setEditingUser({...editingUser, semester: e.target.value})}>
                            <option value="">SELECT_SEM</option>
                            {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s.toString()}>SEM {s}</option>)}
                         </select>
                      </div>
                   </div>
                   <div className="flex gap-4 pt-4">
                      <button type="button" onClick={() => setEditingUser(null)} className="flex-1 px-8 py-5 bg-white border border-slate-200 text-slate-600 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] hover:bg-slate-50 transition-all">Cancel</button>
                      <button type="submit" disabled={isSubmitting} className="flex-[2] px-8 py-5 bg-sky-500 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-xl shadow-sky-100 hover:bg-sky-600 transition-all flex items-center justify-center gap-3">
                         {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Commit_Entity_Update"}
                      </button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
