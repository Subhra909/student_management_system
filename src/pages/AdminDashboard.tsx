import React, { useState, useEffect } from "react";
import { useAuth } from "../lib/auth";
import { getCurrentIST, cn, getISTDate } from "../lib/utils";
import { 
  Users, CheckCircle2, XCircle, Award, MessageSquare, 
  BarChart3, Shield, Search, Filter, Download, Upload,
  MoreVertical, Mail, Trash2, Settings, User as UserIcon, ShieldAlert, FileJson, FileSpreadsheet,
  Activity, Zap, ShieldCheck, Loader2, Clock, Terminal, Cpu, HardDrive, Bell, Calendar,

  ChevronRight, ArrowUpRight, Globe, Server, Database, CreditCard, FileText, Plus, Send, AlarmClock, BookMarked, FileCheck, GraduationCap,
  Pencil, UserCog
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ProfileModal from "../components/ProfileModal";
import { FeeTab, NotificationTab, TimetableTab, AssignmentTab, AdmitCardTab } from "../components/AdminTabs";


interface Student {
  id: string;
  name: string;
  email: string;
  role: string;
  enrollmentId?: string;
  lastLoginAt?: string;
  lastLoginIp?: string;
  department?: string;
  rollNo?: string;
  semester?: string;
}

export default function AdminDashboard() {
  const { user, profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRequests, setAttendanceRequests] = useState<any[]>([]);
  const [marks, setMarks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"analytics" | "students" | "attendance" | "marks" | "messages" | "audit" | "fees" | "notifications" | "timetable" | "assignments" | "admit">("analytics");
  const [searchTerm, setSearchTerm] = useState("");
  const [bulkMessage, setBulkMessage] = useState("");
  const [sendingBulk, setSendingBulk] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [conversationThread, setConversationThread] = useState<any[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [tenant, setTenant] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isManagingDepts, setIsManagingDepts] = useState(false);
  const [deptInput, setDeptInput] = useState("");
  const [isUpdatingDepts, setIsUpdatingDepts] = useState(false);
  const [attendanceFilters, setAttendanceFilters] = useState({
    department: "",
    subject: "",
    rollNo: "",
    semester: ""
  });
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isUpdatingStudent, setIsUpdatingStudent] = useState(false);
  const [bulkMarksData, setBulkMarksData] = useState({
    department: "",
    subject: "",
    marks: {} as Record<string, number> // uid -> score
  });
  const [isBulkMarksOpen, setIsBulkMarksOpen] = useState(false);
  const [isSubjectConfigOpen, setIsSubjectConfigOpen] = useState(false);
  const [subjectInput, setSubjectInput] = useState("");
  const [isUploadingCSV, setUploadingCSV] = useState(false);
  const [bulkMarksTab, setBulkMarksTab] = useState<"manual" | "csv">("manual");

  const [bulkAttendanceData, setBulkAttendanceData] = useState({
    department: "",
    date: getISTDate(),
    status: {} as Record<string, "approved" | "rejected"> // uid -> "approved" or "rejected"
  });
  const [isBulkAttendanceOpen, setIsBulkAttendanceOpen] = useState(false);

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/dashboard", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students?.map((s: any) => ({ ...s, id: s.uid })) || []);
        setAttendanceRequests(data.attendanceRequests?.map((a: any) => ({ ...a, id: a._id })) || []);
        setMarks(data.marks?.map((m: any) => ({ ...m, id: m._id })) || []);
        setAuditLogs(data.auditLogs || []);
        setTenant(data.tenant || null);
      }

      const convRes = await fetch("/api/admin/conversations", { headers: { Authorization: `Bearer ${token}` } });
      if (convRes.ok) setConversations(await convRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversationThread = async (studentUid: string) => {
    setLoadingThread(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/messages/${studentUid}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setConversationThread(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoadingThread(false); }
  };

  useEffect(() => {
    if (!user || profile?.role !== 'admin') return;
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 30000); 
    return () => clearInterval(interval);
  }, [user, profile]);

  const approveAttendance = async (id: string, approved: boolean) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/attendance/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: approved ? "approved" : "rejected", updatedAt: getCurrentIST() })
      });
      if (res.ok) fetchAdminData();
    } catch (err) { console.error(err); }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setIsUpdatingStudent(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/students/${editingStudent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(editingStudent)
      });
      if (res.ok) {
        setEditingStudent(null);
        fetchAdminData();
      } else {
        const data = await res.json();
        alert(data.error || "Update failed");
      }
    } catch (err) { console.error(err); } finally { setIsUpdatingStudent(false); }
  };

  const updateDepartments = async () => {
    setIsUpdatingDepts(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/tenant/departments", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ departments: deptInput })
      });
      if (res.ok) {
        const data = await res.json();
        setTenant((prev: any) => ({ ...prev, departments: data.departments }));
        setIsManagingDepts(false);
      }
    } catch (err) { console.error(err); }
    finally { setIsUpdatingDepts(false); }
  };

  const updateStudentMarks = async (studentId: string, subject: string, score: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/marks", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ studentId, subject, score, updatedAt: getCurrentIST() })
      });
      if (res.ok) fetchAdminData();
    } catch (err) { console.error(err); }
  };

  const saveSubjects = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/tenant/subjects", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subjects: subjectInput })
      });
      if (res.ok) {
        const data = await res.json();
        setTenant((prev: any) => ({ ...prev, subjects: data.subjects }));
        setIsSubjectConfigOpen(false);
        fetchAdminData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save subjects");
      }
    } catch (error) {
      console.error(error);
      alert("Network error");
    }
  };


  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(obj => Object.values(obj).map(val => `"${val}"`).join(","));
    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const submitBulkMarks = async () => {
    if (!bulkMarksData.department || !bulkMarksData.subject) {
      alert("Please select a department and specify a subject.");
      return;
    }

    const marksToSubmit = Object.entries(bulkMarksData.marks).map(([uid, score]) => ({
      studentId: uid,
      subject: bulkMarksData.subject,
      score
    }));

    if (marksToSubmit.length === 0) {
      alert("No marks entered to submit.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/marks/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ marks: marksToSubmit })
      });
      if (res.ok) {
        setIsBulkMarksOpen(false);
        setBulkMarksData({ department: "", subject: "", marks: {} });
        fetchAdminData();
      }
    } catch (err) { console.error(err); }
  };

  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    if (lines.length < 2) return null;
    
    // Clean headers: remove quotes, spaces
    const headers = lines[0].split(",").map(h => h.replace(/^["']|["']$/g, "").trim());
    const rows: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.replace(/^["']|["']$/g, "").trim());
      if (values.length === headers.length) {
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        rows.push(row);
      }
    }
    return { headers, rows };
  };

  const downloadCSVDemo = () => {
    const subjects = tenant?.subjects && tenant.subjects.length > 0 ? tenant.subjects : ["Mathematics", "Physics", "Chemistry"];
    const headers = ["Roll No", "Student Name", ...subjects];
    
    // Find actual students to populate demo rows
    const deptStudents = students.filter(s => !bulkMarksData.department || s.department === bulkMarksData.department).slice(0, 3);
    const rows = deptStudents.map((s, i) => [
      s.rollNo || `ENR-CS-${100 + i}`,
      s.name,
      ...subjects.map(() => Math.floor(65 + Math.random() * 30))
    ]);
    
    // Fallback if no students in department
    if (rows.length === 0) {
      rows.push(["ENR-CS-101", "John Doe", ...subjects.map(() => 85)]);
      rows.push(["ENR-CS-102", "Jane Smith", ...subjects.map(() => 90)]);
    }

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `marks_template_${bulkMarksData.department || "all"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSV(text);
      if (!parsed) {
        alert("Invalid CSV format. Please make sure the CSV has at least a header row and a data row.");
        return;
      }
      setUploadingCSV(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/admin/marks/csv", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ headers: parsed.headers, rows: parsed.rows })
        });
        if (res.ok) {
          const result = await res.json();
          alert(`CSV Marks Upload completed!\nIngested records: ${result.successCount}\nErrors/Failures: ${result.failCount}\nDetails: ${result.errors.join(", ") || "None"}`);
          setIsBulkMarksOpen(false);
          setBulkMarksTab("manual");
          fetchAdminData();
        } else {
          const errData = await res.json();
          alert(errData.error || "Failed to process CSV on server.");
        }
      } catch (err) {
        console.error(err);
        alert("Network error. Could not upload CSV.");
      } finally {
        setUploadingCSV(false);
      }
    };
    reader.readAsText(file);
  };

  const submitBulkAttendance = async () => {
    if (!bulkAttendanceData.department || !bulkAttendanceData.date) {
      alert("Please select a department and specify a date.");
      return;
    }

    const deptStudents = students.filter(s => s.department === bulkAttendanceData.department);
    const recordsToSubmit = deptStudents.map(student => ({
      studentId: student.id,
      studentName: student.name,
      status: bulkAttendanceData.status[student.id] || "approved"
    }));

    if (recordsToSubmit.length === 0) {
      alert("No students in this department to submit attendance for.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/attendance/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ date: bulkAttendanceData.date, records: recordsToSubmit })
      });
      if (res.ok) {
        setIsBulkAttendanceOpen(false);
        setBulkAttendanceData({ department: "", date: getISTDate(), status: {} });
        fetchAdminData();
        alert("Attendance uploaded successfully!");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to submit attendance.");
      }
    } catch (err) { console.error(err); }
  };



  const filteredAttendanceRequests = attendanceRequests.filter(req => {
    const student = students.find(s => s.id === req.studentId);
    if (!student) return false;
    
    const matchesDept = !attendanceFilters.department || student.department === attendanceFilters.department;
    const matchesSubject = !attendanceFilters.subject || req.subject?.toLowerCase().includes(attendanceFilters.subject.toLowerCase());
    const matchesRoll = !attendanceFilters.rollNo || student.rollNo?.toLowerCase().includes(attendanceFilters.rollNo.toLowerCase());
    const matchesSem = !attendanceFilters.semester || student.semester === attendanceFilters.semester;
    const isPending = req.status === 'pending';

    return isPending && matchesDept && matchesSubject && matchesRoll && matchesSem;
  });

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const navItems = [
    { id: "analytics",     icon: BarChart3,     label: "Analytics" },
    { id: "students",      icon: Users,         label: "Students" },
    { id: "attendance",   icon: CheckCircle2,  label: "Attendance" },
    { id: "marks",         icon: Award,         label: "Marks" },
    { id: "fees",          icon: CreditCard,    label: "Fees" },
    { id: "notifications", icon: Bell,          label: "Announcements" },
    { id: "timetable",    icon: Calendar,      label: "Timetable" },
    { id: "assignments",  icon: FileText,      label: "Assignments" },
    { id: "admit",        icon: FileCheck,     label: "Admit Card" },
    { id: "messages",      icon: Mail,          label: "Messages" },
    { id: "audit",         icon: ShieldAlert,   label: "Audit Log" },
  ];

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-dashboard min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl border-4 border-sky-100 border-t-sky-600 animate-spin" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">Loading dashboard...</p>
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
              <h1 className="text-2xl font-black text-slate-900 capitalize">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                {activeTab === "analytics" && <span className="gradient-text"> Overview</span>}
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                {activeTab === "analytics" && `${profile?.collegeName} \u00b7 ${new Date().toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })}`}
                {activeTab === "students" && `${students.length} students enrolled`}
                {activeTab === "attendance" && `${attendanceRequests.filter(a => a.status === 'pending').length} requests pending review`}
                {activeTab === "marks" && "Academic performance records"}
                {activeTab === "fees" && "Manage student fee records"}
                {activeTab === "notifications" && "Broadcast announcements to students"}
                {activeTab === "timetable" && "Manage class schedules"}
                {activeTab === "assignments" && "Create and manage assignments"}
                {activeTab === "admit" && "Generate and distribute admit cards"}
                {activeTab === "messages" && "Communicate with students"}
                {activeTab === "audit" && "System activity logs"}
              </p>
            </div>
            <button onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-3 px-4 py-2.5 bg-white/70 backdrop-blur-md rounded-2xl border border-sky-100 hover:border-sky-300 hover:shadow-md transition-all shrink-0">
              <div className="avatar w-8 h-8 text-[11px] overflow-hidden">
                {profile?.profilePicture ? (
                  <img src={profile.profilePicture} className="w-full h-full object-cover" alt="" />
                ) : (
                  profile?.name?.[0]?.toUpperCase()
                )}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-[12px] font-bold text-slate-900">{profile?.name}</p>
                <p className="text-[10px] text-slate-400">Administrator</p>
              </div>
            </button>
          </header>

          {/* Pill Navigation */}
          <nav className="pill-nav mb-8">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => setActiveTab(item.id as any)}
                className={cn("pill-nav-item", activeTab === item.id && "active")}>
                <item.icon className="w-3.5 h-3.5 shrink-0" />
                <span>{item.label}</span>
                {item.id === "attendance" && attendanceRequests.filter(a => a.status === 'pending').length > 0 && (
                  <span className="pill-badge pill-badge-rose">
                    {attendanceRequests.filter(a => a.status === 'pending').length}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === "analytics" && (
                <div className="grid grid-cols-12 gap-8">
                  <div className="col-span-12 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-6">

                    {[
                      { label: "Active_Nodes", val: students.length, color: "sky", icon: Users, trend: "+2.4%" },
                      { label: "Pending_Logs", val: attendanceRequests.filter(a => a.status === 'pending').length, color: "amber", icon: Clock, trend: "-12%" },
                      { label: "High_Scores", val: marks.filter(m => m.score >= 90).length, color: "emerald", icon: Award, trend: "+5.1%" },

                    ].map((stat, i) => (
                      <div key={i} className="premium-card group hover:!border-sky-500/30 transition-all">
                        <div className="flex items-center justify-between mb-6">
                          <div className={cn("p-2 rounded-xl transition-all", {
                            "bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-white": stat.color === "sky",
                            "bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white": stat.color === "amber",
                            "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white": stat.color === "emerald",
                          })}>
                            <stat.icon className="w-5 h-5" />
                          </div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.trend}</span>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                        <p className="text-4xl font-black italic tracking-tighter text-slate-900">{stat.val}</p>
                      </div>
                    ))}
                  </div>

                  <div className="col-span-12">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="premium-card p-8 border-l-4 border-l-amber-600 flex flex-col md:flex-row md:items-center justify-between gap-6">
                       <div className="space-y-1">
                          <div className="flex items-center gap-2">
                             <div className="p-2 bg-amber-50 rounded-lg text-amber-600"><Server className="w-4 h-4" /></div>
                             <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Institutional_Registry_Node</h4>
                          </div>
                          <div className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">{tenant?.name || "Global_Nexus_Edge"}</div>
                       </div>
                       
                       <div className="flex-1 max-w-xl">
                          <div className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-3 flex items-center justify-between">
                             <span className="flex items-center gap-2"><ShieldCheck className="w-3 h-3" /> Active_Department_Registry</span>
                             <button 
                               onClick={() => {
                                 setDeptInput(tenant?.departments?.join(", ") || "");
                                 setIsManagingDepts(true);
                               }}
                               className="text-sky-600 hover:underline flex items-center gap-1"
                             >
                                <Settings className="w-3 h-3" /> Manage_Registry
                             </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                             {tenant?.departments?.map((d: string) => (
                               <span key={d} className="px-3 py-1.5 bg-sky-500 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-sky-50">{d}</span>
                             ))}
                             {!tenant?.departments?.length && <span className="text-xs font-bold text-slate-400 italic">No departments configured for this node.</span>}
                          </div>
                       </div>

                       <div className="flex gap-4">
                          <div className="text-right">
                             <div className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Node_Status</div>
                             <div className="text-sm font-black text-emerald-600 uppercase">Verified_Active</div>
                          </div>
                       </div>
                    </motion.div>
                  </div>

                  {/* Department Enrollment */}
                  <div className="col-span-12 lg:col-span-5 premium-card !p-8 flex flex-col">
                      <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-2xl bg-sky-50 flex items-center justify-center">
                          <Users className="w-5 h-5 text-sky-600" />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-slate-900 uppercase italic tracking-tighter">Department Enrollment</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">// Students per department</p>
                        </div>
                      </div>
                      <div className="space-y-4 flex-1">
                        {(() => {
                          const deptMap: Record<string, number> = {};
                          students.forEach((s: any) => { const d = s.department || "Unassigned"; deptMap[d] = (deptMap[d] || 0) + 1; });
                          const total = students.length || 1;
                          const entries = Object.entries(deptMap).sort((a, b) => b[1] - a[1]);
                          const colors = ["bg-sky-500","bg-teal-500","bg-cyan-500","bg-emerald-500","bg-amber-500","bg-rose-500","bg-sky-400"];
                          return entries.length ? entries.map(([dept, count], i) => (
                            <div key={dept}>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider truncate max-w-[60%]">{dept}</span>
                                <span className="text-[11px] font-black text-slate-500">{count} student{count !== 1 ? "s" : ""}</span>
                              </div>
                              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(count / total) * 100}%` }}
                                  transition={{ duration: 0.8, delay: i * 0.08, ease: "easeOut" }}
                                  className={`h-full rounded-full ${colors[i % colors.length]}`}
                                />
                              </div>
                            </div>
                          )) : (
                            <div className="flex-1 flex flex-col items-center justify-center py-10 text-slate-300">
                              <Users className="w-10 h-10 mb-2" />
                              <p className="text-[11px] font-bold uppercase tracking-widest">No students enrolled</p>
                            </div>
                          );
                        })()}
                      </div>
                      <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Enrolled</span>
                        <span className="text-2xl font-black text-slate-900">{students.length}</span>
                      </div>
                    </div>

                  {/* Semester Distribution */}
                  <div className="col-span-12 lg:col-span-3 premium-card !p-8 flex flex-col">
                      <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-2xl bg-teal-50 flex items-center justify-center">
                          <GraduationCap className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-slate-900 uppercase italic tracking-tighter">Semester Segregation</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">// Population by term</p>
                        </div>
                      </div>
                      <div className="space-y-4 flex-1">
                        {(() => {
                          const semMap: Record<string, number> = {};
                          students.forEach((s: any) => { const sem = s.semester || "Unknown"; semMap[sem] = (semMap[sem] || 0) + 1; });
                          const total = students.length || 1;
                          const entries = Object.entries(semMap).sort((a, b) => a[0].localeCompare(b[0]));
                          return entries.length ? entries.map(([sem, count], i) => (
                            <div key={sem}>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">{sem}</span>
                                <span className="text-[11px] font-black text-slate-400">{Math.round((count / total) * 100)}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(count / total) * 100}%` }}
                                  transition={{ duration: 1, delay: i * 0.1 }}
                                  className="h-full rounded-full bg-teal-500"
                                />
                              </div>
                            </div>
                          )) : (
                            <p className="text-center text-slate-300 text-[10px] font-bold uppercase py-10 tracking-widest">No nodes detected</p>
                          );
                        })()}
                      </div>
                  </div>

                  {/* Recent Activity Feed */}
                  <div className="col-span-12 lg:col-span-4 premium-card !p-8 flex flex-col">
                      <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center">
                          <Activity className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-slate-900 uppercase italic tracking-tighter">Recent Activity</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">// Latest admin actions &amp; events</p>
                        </div>
                      </div>
                      <div className="space-y-1 flex-1 overflow-y-auto max-h-72 pr-1">
                        {auditLogs.length ? auditLogs.slice(0, 12).map((log: any, i: number) => (
                          <motion.div key={log._id || i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                            className="flex items-start gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-[11px] font-black",
                              (log.action?.includes("APPROVE") || log.action?.includes("GRADE") || log.action?.includes("CREATE"))
                                ? "bg-emerald-100 text-emerald-600"
                                : (log.action?.includes("DELETE") || log.action?.includes("REJECT"))
                                  ? "bg-rose-100 text-rose-600"
                                  : "bg-sky-100 text-sky-600"
                            )}>
                              {log.action?.includes("APPROVE") || log.action?.includes("GRADE") ? "✓"
                               : log.action?.includes("DELETE") || log.action?.includes("REJECT") ? "✕"
                               : log.action?.includes("CREATE") ? "+" : "↻"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-bold text-slate-700 leading-tight">{log.details || log.action}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {log.adminName || "Admin"} · {log.createdAt ? new Date(log.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }) : "—"}
                              </p>
                            </div>
                          </motion.div>
                        )) : (
                          <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                            <Activity className="w-10 h-10 mb-2" />
                            <p className="text-[11px] font-bold uppercase tracking-widest">No activity recorded yet</p>
                          </div>
                        )}
                      </div>
                    </div>


                </div>
              )}


              {activeTab === "students" && (
                <div className="premium-card !p-0 overflow-hidden">
                  <div className="p-10 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/30">
                    <div>
                      <h3 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter">Node_Directory</h3>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.4em] mt-2">// Registry of all authenticated identities</p>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                       <div className="relative flex-1 md:w-80 group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                        <input 
                          type="text" 
                          placeholder="SEARCH_IDENTITY..."
                          className="premium-input !pl-14 !py-4 !rounded-2xl"
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                        />
                       </div>
                       <button 
                        onClick={() => exportToCSV(students, "students.csv")}
                        className="p-4 bg-white border border-slate-200 text-slate-400 hover:text-sky-600 hover:border-sky-200 rounded-2xl transition-all shadow-sm"
                       >
                         <Download className="w-6 h-6" />
                       </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-white text-[10px] uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100">
                        <tr>
                          <th className="px-10 py-8 font-black">Identity_Profile</th>
                          <th className="px-10 py-8 font-black">Enrollment_ID</th>
                          <th className="px-10 py-8 font-black">Performance_Index</th>
                          <th className="px-10 py-8 font-black text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredStudents.map(student => (
                          <tr key={student.id} className="hover:bg-sky-50/20 transition-all group">
                            <td className="px-10 py-8">
                              <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-sky-500 text-white group-hover:bg-sky-600 transition-all flex items-center justify-center font-black text-xl duration-500 shadow-xl shadow-sky-100 border-4 border-white overflow-hidden">
                                  {student.name[0]}
                                </div>
                                <div>
                                  <p className="font-black text-base text-slate-900 uppercase italic tracking-tighter leading-none mb-1.5">{student.name}</p>
                                  <p className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase">{student.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-10 py-8">
                               <span className="px-4 py-2 bg-sky-50 text-sky-600 rounded-xl text-[10px] font-mono font-black border border-sky-100 uppercase tracking-widest">
                                  {student.enrollmentId || "PENDING_ID"}
                               </span>
                            </td>
                            <td className="px-10 py-8">
                               <div className="flex items-center gap-4">
                                  <div className="w-40 bg-slate-100 h-2 rounded-full overflow-hidden">
                                     <div className="bg-sky-600 h-full w-[72%] rounded-full shadow-[0_0_10px_rgba(37,99,235,0.4)]" />
                                  </div>
                                  <span className="text-[10px] font-black text-slate-900 font-mono">72.4%</span>
                               </div>
                            </td>
                             <td className="px-10 py-8 text-right">
                               <div className="flex items-center justify-end gap-3">
                                 <button 
                                   onClick={() => setEditingStudent(student)}
                                   className="p-4 bg-white text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-2xl transition-all border border-slate-100"
                                 >
                                   <Pencil className="w-5 h-5" />
                                 </button>
                                 <button className="p-4 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all border border-slate-100">
                                   <Trash2 className="w-5 h-5" />
                                 </button>
                               </div>
                             </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "attendance" && (
                <div className="premium-card !p-0 overflow-hidden">
                  <div className="p-10 border-b border-slate-100 bg-slate-50/30">
                     <div className="flex items-center justify-between mb-8">
                        <div>
                           <h3 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter">Log_Authorization_Queue</h3>
                           <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.4em] mt-2">// Real-time verification requests</p>
                           <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3">
                               <span className="text-[11px] font-black text-slate-400 uppercase">Queue: </span>
                               <div className="px-5 py-2.5 bg-amber-50 text-amber-600 rounded-full text-[11px] font-black uppercase tracking-widest border border-amber-100 shadow-sm shadow-amber-50">
                                 {attendanceRequests.filter(a => a.status === 'pending').length} ACTION_REQUIRED
                               </div>
                            </div>
                            <button 
                              onClick={() => {
                                setBulkAttendanceData({ department: "", date: new Date().toISOString().split('T')[0], status: {} });
                                setIsBulkAttendanceOpen(true);
                              }}
                              className="px-8 py-4 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-xl shadow-sky-500/20 transition-all flex items-center gap-3 cursor-pointer"
                            >
                               <Upload className="w-5 h-5" /> Bulk_Attendance_Ingestion
                            </button>
                         </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Filter_Department</label>
                           <select 
                             className="premium-input !py-3 !text-xs font-black uppercase"
                             value={attendanceFilters.department}
                             onChange={e => setAttendanceFilters({...attendanceFilters, department: e.target.value})}
                           >
                              <option value="">ALL_DEPARTMENTS</option>
                              {tenant?.departments?.map((d: string) => <option key={d} value={d}>{d}</option>)}
                           </select>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Filter_Subject</label>
                           <input 
                             type="text" 
                             className="premium-input !py-3 !text-xs font-black uppercase"
                             placeholder="e.g. Mathematics"
                             value={attendanceFilters.subject}
                             onChange={e => setAttendanceFilters({...attendanceFilters, subject: e.target.value})}
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Filter_Roll_No</label>
                           <input 
                             type="text" 
                             className="premium-input !py-3 !text-xs font-black uppercase"
                             placeholder="e.g. CS26-001"
                             value={attendanceFilters.rollNo}
                             onChange={e => setAttendanceFilters({...attendanceFilters, rollNo: e.target.value})}
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Filter_Semester</label>
                           <select 
                             className="premium-input !py-3 !text-xs font-black uppercase"
                             value={attendanceFilters.semester}
                             onChange={e => setAttendanceFilters({...attendanceFilters, semester: e.target.value})}
                           >
                              <option value="">ALL_SEMESTERS</option>
                              {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s.toString()}>SEM {s}</option>)}
                           </select>
                        </div>
                     </div>
                  </div>
                  
                  <div className="p-10 grid gap-8">
                    {filteredAttendanceRequests.map(req => {
                      const student = students.find(s => s.id === req.studentId);
                      return (
                        <motion.div 
                          layout
                          key={req.id} 
                          className="flex items-center justify-between p-8 bg-white rounded-[2.5rem] border border-slate-100 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] hover:border-sky-200 transition-all group"
                        >
                          <div className="flex items-center gap-8">
                            <div className="w-20 h-20 rounded-[2rem] bg-sky-500 text-white group-hover:bg-sky-600 transition-all duration-500 flex items-center justify-center font-black text-3xl shadow-xl border-4 border-white overflow-hidden">
                              {req.studentName?.[0]}
                            </div>
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <p className="font-black text-2xl text-slate-900 uppercase italic tracking-tighter leading-none">{req.studentName}</p>
                                <span className="px-3 py-1 bg-slate-100 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest">{student?.rollNo || "NO_ROLL"}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                 <div className="flex items-center gap-2.5 text-[11px] text-slate-500 font-black uppercase bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                                    <BookMarked className="w-3.5 h-3.5 text-sky-600" />
                                    {req.subject || "GENERAL"}
                                 </div>
                                 <div className="flex items-center gap-2.5 text-[11px] text-slate-500 font-black uppercase bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                                    <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                                    {req.date}
                                 </div>
                                 <div className="flex items-center gap-2.5 text-[11px] text-slate-500 font-black uppercase bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                                    <Server className="w-3.5 h-3.5 text-slate-400" />
                                    {student?.department || "CORE"}
                                 </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <button 
                              onClick={() => approveAttendance(req.id, false)}
                              className="p-6 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-3xl transition-all border border-transparent hover:border-rose-100"
                            >
                              <XCircle className="w-10 h-10" />
                            </button>
                            <button 
                              onClick={() => approveAttendance(req.id, true)}
                              className="p-6 px-10 bg-sky-600 text-white hover:bg-sky-700 rounded-3xl shadow-2xl shadow-sky-100 transition-all active:scale-95 flex items-center gap-4"
                            >
                              <CheckCircle2 className="w-8 h-8" />
                              <span className="text-[11px] font-black uppercase tracking-[0.2em] hidden sm:inline">Authorize_Log</span>
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                    {filteredAttendanceRequests.length === 0 && (
                       <div className="text-center py-40 bg-slate-50/50 rounded-[4rem] border border-dashed border-slate-200">
                          <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-sm">
                             <ShieldCheck className="w-12 h-12 text-emerald-500" />
                          </div>
                          <p className="text-[14px] font-black text-slate-400 uppercase tracking-[0.5em]">Registry_Protocol_Clean</p>
                          <p className="text-[10px] text-slate-300 font-bold uppercase mt-3">All student nodes are currently synchronized with core</p>
                       </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "marks" && (
                <div className="space-y-8">
                  <div className="premium-card p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-sky-500 text-white border-none shadow-2xl">
                     <div>
                        <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white">Performance_Ledger</h3>
                        <p className="text-[11px] font-bold text-sky-400/50 uppercase tracking-[0.4em] mt-2">// Academic result configuration node</p>
                     </div>
                     <div className="flex flex-wrap gap-4">
                        <button 
                          onClick={() => {
                            setSubjectInput(tenant?.subjects?.join(", ") || "Mathematics, Physics, Chemistry");
                            setIsSubjectConfigOpen(true);
                          }}
                          className="px-8 py-4 bg-white text-sky-600 hover:bg-sky-50 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-xl transition-all flex items-center gap-3"
                        >
                           <BookMarked className="w-5 h-5" /> Manage_Subjects
                        </button>
                        <button 
                          onClick={() => {
                            setBulkMarksTab("manual");
                            setIsBulkMarksOpen(true);
                          }}
                          className="px-8 py-4 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-xl shadow-sky-500/20 transition-all flex items-center gap-3"
                        >
                           <Upload className="w-5 h-5" /> Bulk_Marks_Ingestion
                        </button>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {students.map(student => (
                      <div key={student.id} className="premium-card !p-10 group hover:!border-sky-500/30 transition-all">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-10 mb-10">
                          <div className="flex items-center gap-5">
                             <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-2xl text-slate-400 group-hover:bg-sky-600 group-hover:text-white transition-all duration-500">
                                {student.name[0]}
                             </div>
                             <div>
                                <h4 className="font-black text-2xl text-slate-900 uppercase italic tracking-tighter leading-none mb-2">{student.name}</h4>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">ID: {student.id.substring(0, 16).toUpperCase()}</span>
                             </div>
                          </div>
                          <div className="p-5 bg-sky-50 text-sky-600 rounded-[1.5rem] shadow-xl shadow-sky-50 group-hover:bg-sky-600 group-hover:text-white transition-all duration-500">
                             <Award className="w-8 h-8" />
                          </div>
                        </div>
                        <div className="grid gap-6">
                          {(tenant?.subjects && tenant.subjects.length > 0 ? tenant.subjects : ["Mathematics", "Physics", "Chemistry"]).map(subject => {
                            const mark = marks.find(m => m.studentId === student.id && m.subject === subject);
                            return (
                              <div key={subject} className="flex items-center justify-between gap-8 p-6 bg-slate-50/50 rounded-2xl border border-slate-100 focus-within:bg-white focus-within:border-sky-200 transition-all group/input">
                                <label className="text-[12px] font-black text-slate-600 uppercase tracking-widest">{subject}</label>
                                <div className="flex items-center gap-6">
                                  <input 
                                    type="number"
                                    className="w-28 bg-white border border-slate-200 rounded-xl px-5 py-4 text-lg text-center font-black text-sky-600 outline-none focus:ring-8 focus:ring-sky-50 transition-all"
                                    defaultValue={mark?.score || 0}
                                    onBlur={(e) => updateStudentMarks(student.id, subject, parseInt(e.target.value))}
                                  />
                                  <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center text-sm font-black group-focus-within/input:bg-teal-600 group-focus-within/input:text-white transition-all shadow-sm">
                                     %
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "messages" && (
                <div className="grid grid-cols-12 gap-8 h-[calc(100vh-16rem)] min-h-[600px]">
                  {/* Conversation List */}
                  <div className="col-span-4 premium-card !p-0 flex flex-col overflow-hidden">
                    <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                       <h3 className="font-black italic uppercase tracking-tighter text-xl">Inbound_Signals</h3>
                       <div className="px-3 py-1 bg-sky-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">{conversations.length} Active</div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                       {conversations.map((conv) => (
                         <button 
                           key={conv.student.uid}
                           onClick={() => { setSelectedConversation(conv); loadConversationThread(conv.student.uid); }}

                           className={cn("w-full text-left p-6 rounded-[2rem] transition-all flex items-center gap-4 group", 
                             selectedConversation?.student?.uid === conv.student.uid ? "bg-sky-600 text-white shadow-2xl" : "hover:bg-slate-50"
                           )}
                         >
                           <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg", 
                             selectedConversation?.student?.uid === conv.student.uid ? "bg-sky-600" : "bg-slate-100 text-slate-400 group-hover:bg-white"
                           )}>
                             {conv.student.name[0]}
                           </div>
                           <div className="flex-1 min-w-0">
                             <p className="font-black text-sm uppercase italic tracking-tighter truncate">{conv.student.name}</p>
                             <p className={cn("text-[10px] truncate", 
                               selectedConversation?.student?.uid === conv.student.uid ? "text-slate-400" : "text-slate-400"
                             )}>
                               {conv.lastMessage?.content || "No messages yet"}
                             </p>
                           </div>
                           {conv.unreadCount > 0 && (
                             <div className="w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center text-[9px] font-black">{conv.unreadCount}</div>
                           )}
                         </button>
                       ))}
                       {conversations.length === 0 && (
                         <div className="flex flex-col items-center justify-center h-full text-slate-300">
                           <Mail className="w-12 h-12 mb-4 opacity-20" />
                           <p className="text-[10px] font-black uppercase tracking-widest">No_Active_Conversations</p>
                         </div>
                       )}
                    </div>
                  </div>

                  {/* Chat Area */}
                  <div className="col-span-8 flex flex-col gap-6">
                    {selectedConversation ? (
                      <>
                        <div className="premium-card flex-1 flex flex-col !p-0 overflow-hidden">
                          <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white relative z-10">
                             <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-black text-xl shadow-xl">
                                   {selectedConversation.student.name[0]}
                                </div>
                                <div>
                                   <h4 className="font-black italic uppercase tracking-tighter text-xl text-slate-900">{selectedConversation.student.name}</h4>
                                   <p className="text-[10px] font-black text-sky-600 uppercase tracking-widest">{selectedConversation.student.department} \u00b7 {selectedConversation.student.rollNo}</p>
                                </div>
                             </div>
                             <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Connection_Secure</span>
                             </div>
                          </div>
                          
                          <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar bg-slate-50/30" style={{ maxHeight: '360px', minHeight: '180px' }}>
                            {loadingThread ? (
                              <div className="flex items-center justify-center py-10">
                                <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
                              </div>
                            ) : conversationThread.length === 0 ? (
                              <p className="text-center text-slate-400 text-xs py-8">No messages yet. Start the conversation.</p>
                            ) : conversationThread.map((msg: any, i: number) => {
                              const isAdmin = msg.senderId === 'admin';
                              return (
                                <div key={i} className={cn("flex flex-col max-w-[75%]", isAdmin ? "ml-auto items-end" : "mr-auto items-start")}>
                                  <div className={cn("p-4 rounded-2xl text-sm font-medium", isAdmin ? "bg-sky-600 text-white rounded-tr-sm" : "bg-white border border-slate-100 text-slate-600 rounded-tl-sm shadow-sm")}>
                                    {msg.content}
                                  </div>
                                  <span className="text-[9px] font-bold text-slate-300 mt-1 uppercase">
                                    {isAdmin ? 'Administration' : selectedConversation.student.name} · {new Date(msg.createdAt || msg.timestamp).toLocaleTimeString()}
                                  </span>
                                </div>
                              );
                            })}
                          </div>


                          <div className="p-8 bg-white border-t border-slate-100 shrink-0">
                             <div className="relative flex items-center gap-4">
                               <textarea 
                                 className="flex-1 bg-slate-50 border border-slate-200 rounded-[2rem] px-8 py-5 text-sm font-medium outline-none focus:bg-white focus:border-sky-500 transition-all resize-none h-20 placeholder:text-slate-300"
                                 placeholder="ENCODE_REPLY_PAYLOAD..."
                                 value={bulkMessage}
                                 onChange={e => setBulkMessage(e.target.value)}
                               />
                               <button 
                                 onClick={async () => {
                                    setSendingBulk(true);
                                    const res = await fetch("/api/admin/messages", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
                                      body: JSON.stringify({ content: bulkMessage, receiverId: selectedConversation.student.uid })
                                    });
                                    if (res.ok) {
                                      setBulkMessage("");
                                      fetchAdminData();
                                    }
                                    setSendingBulk(false);
                                 }}
                                 disabled={sendingBulk || !bulkMessage.trim()}
                                 className="w-20 h-20 bg-sky-600 text-white rounded-[1.5rem] shadow-2xl shadow-sky-500/30 hover:bg-sky-700 transition-all flex items-center justify-center disabled:opacity-50"
                               >
                                  {sendingBulk ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                               </button>
                             </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="premium-card flex-1 flex flex-col items-center justify-center text-center">
                        <div className="w-32 h-32 bg-slate-50 rounded-[3rem] flex items-center justify-center mb-10 text-slate-200">
                           <Mail className="w-16 h-16" />
                        </div>
                        <h3 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 mb-4">Signal_Interceptor</h3>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.4em] mb-10">// Select an active node to establish uplink</p>
                        <div className="px-8 py-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                           <Activity className="w-4 h-4 text-sky-500" />
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Listening for incoming packets...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "fees" && <FeeTab students={students} token={localStorage.getItem("token")} onRefresh={fetchAdminData} />}
              {activeTab === "notifications" && <NotificationTab token={localStorage.getItem("token")} onRefresh={fetchAdminData} tenant={tenant} />}
              {activeTab === "timetable" && <TimetableTab token={localStorage.getItem("token")} tenant={tenant} />}
              {activeTab === "assignments" && <AssignmentTab token={localStorage.getItem("token")} tenant={tenant} />}
              {activeTab === "admit" && <AdmitCardTab token={localStorage.getItem("token")} departments={tenant?.departments || []} />}

              {activeTab === "audit" && (
                <div className="premium-card !p-0 overflow-hidden">
                   <div className="p-10 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                     <div>
                        <h3 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter">System_Audit_Ledger</h3>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.4em] mt-2">// Immutable event stream logs</p>
                     </div>
                     <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-400">
                        <Terminal className="w-6 h-6" />
                     </div>
                   </div>
                   <div className="p-10 space-y-4">
                     {auditLogs.map((log, i) => (
                       <div key={i} className="flex items-center gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-sky-200 transition-all group font-mono">
                         <span className="text-[10px] text-slate-400 font-bold w-48 shrink-0">{log.timestamp}</span>
                         <div className={cn("px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shrink-0", {
                            "bg-sky-100 text-sky-600": log.category === 'auth',
                            "bg-amber-100 text-amber-600": log.category === 'academic',
                            "bg-emerald-100 text-emerald-600": log.category === 'system',
                         })}>
                            {log.category || 'EVENT'}
                         </div>
                         <p className="text-xs font-bold text-slate-600">{log.action}</p>
                         <span className="ml-auto text-[10px] text-slate-300 font-black uppercase">v1.0.4-stable</span>
                       </div>
                     ))}
                   </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* \u2500\u2500 Modals \u2500\u2500 */}
      <AnimatePresence>
        {isManagingDepts && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsManagingDepts(false)} className="absolute inset-0 bg-sky-900/40 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-white/20">
              <div className="p-12">
                <div className="w-20 h-20 bg-sky-500 text-white rounded-[2rem] mb-10 flex items-center justify-center shadow-xl">
                  <Cpu className="w-10 h-10 text-sky-400" />
                </div>
                <h3 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter mb-4">Registry_Config</h3>
                <p className="text-sm text-slate-500 font-medium mb-10 leading-relaxed italic">Synchronize institutional departments with the core registry. Separate multiple nodes with commas.</p>
                
                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Department_Nodes</label>
                    <textarea 
                      className="premium-input !py-6 !px-8 h-40 resize-none font-bold" 
                      placeholder="e.g. Computer Science, Mechanical, Civil..."
                      value={deptInput}
                      onChange={e => setDeptInput(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => setIsManagingDepts(false)} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
                    <button 
                      onClick={updateDepartments}
                      disabled={isUpdatingDepts}
                      className="flex-1 py-5 bg-sky-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-sky-700 transition-all shadow-xl shadow-sky-500/20 disabled:opacity-50"
                    >
                      {isUpdatingDepts ? "Syncing..." : "Commit_Changes"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {editingStudent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setEditingStudent(null)} className="absolute inset-0 bg-sky-900/40 backdrop-blur-md" />
             <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="bg-white rounded-[3rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-12 relative z-10 shadow-2xl custom-scrollbar border border-slate-100">
                <div className="mb-10">
                   <div className="flex items-center justify-between">
                      <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 italic flex items-center gap-4">
                         <UserCog className="w-9 h-9 text-sky-600" /> Administrative_Override
                      </h2>
                      <button onClick={() => setEditingStudent(null)} className="p-3 hover:bg-slate-100 rounded-2xl transition-all">
                         <XCircle className="w-6 h-6 text-slate-300" />
                      </button>
                   </div>
                   <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3 ml-1">// Modifying Student Identity: {editingStudent.id}</p>
                </div>

                <form onSubmit={handleUpdateStudent} className="space-y-10">
                   <div className="space-y-8">
                      <div className="grid grid-cols-2 gap-8">
                         <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Full_Legal_Name</label>
                            <input type="text" required className="premium-input !py-5" value={editingStudent.name} onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})} />
                         </div>
                         <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Academic_Registry_Email</label>
                            <input type="email" required className="premium-input !py-5" value={editingStudent.email} onChange={(e) => setEditingStudent({...editingStudent, email: e.target.value})} />
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-8">
                         <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Department_Node</label>
                            <select className="premium-input !py-5" value={editingStudent.department} onChange={(e) => setEditingStudent({...editingStudent, department: e.target.value})}>
                               <option value="">SELECT_DEPARTMENT</option>
                               {tenant?.departments?.map((d: string) => <option key={d} value={d}>{d}</option>)}
                            </select>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Semester</label>
                               <select className="premium-input !py-5" value={editingStudent.semester} onChange={(e) => setEditingStudent({...editingStudent, semester: e.target.value})}>
                                  <option value="">SEM</option>
                                  {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s.toString()}>{s}</option>)}
                               </select>
                            </div>
                            <div className="space-y-3">
                               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Section</label>
                               <input type="text" className="premium-input !py-5 uppercase" placeholder="A" value={editingStudent.section} onChange={(e) => setEditingStudent({...editingStudent, section: e.target.value.toUpperCase()})} />
                            </div>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-8">
                         <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Registry_UID (Roll_No)</label>
                            <input type="text" className="premium-input !py-5" value={editingStudent.rollNo} onChange={(e) => setEditingStudent({...editingStudent, rollNo: e.target.value})} />
                         </div>
                         <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Contact_Mobile</label>
                            <input type="tel" className="premium-input !py-5" placeholder="+91 XXXX XXXX" value={editingStudent.phoneNumber} onChange={(e) => setEditingStudent({...editingStudent, phoneNumber: e.target.value})} />
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-8">
                         <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Guardian_Identity</label>
                            <input type="text" className="premium-input !py-5" placeholder="PARENT_NAME" value={editingStudent.guardian} onChange={(e) => setEditingStudent({...editingStudent, guardian: e.target.value})} />
                         </div>
                         <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Guardian_Contact</label>
                            <input type="tel" className="premium-input !py-5" placeholder="EMERGENCY_MOBILE" value={editingStudent.guardianPhone} onChange={(e) => setEditingStudent({...editingStudent, guardianPhone: e.target.value})} />
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-8">
                         <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Chronological_DOB</label>
                            <input type="date" className="premium-input !py-5" value={editingStudent.dob} onChange={(e) => setEditingStudent({...editingStudent, dob: e.target.value})} />
                         </div>
                         <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Registry_Status</label>
                            <select className="premium-input !py-5" value={editingStudent.isActive ? "active" : "inactive"} onChange={(e) => setEditingStudent({...editingStudent, isActive: e.target.value === "active"})}>
                               <option value="active">ACTIVE_NODE</option>
                               <option value="inactive">DEACTIVATED</option>
                            </select>
                         </div>
                      </div>
                   </div>

                   <div className="flex gap-4 pt-6 border-t border-slate-100">
                      <button type="button" onClick={() => setEditingStudent(null)} className="flex-1 px-8 py-5 bg-white border border-slate-200 text-slate-600 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] hover:bg-slate-50 transition-all">Abort_Changes</button>
                      <button type="submit" disabled={isUpdatingStudent} className="flex-[2] px-8 py-5 bg-sky-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-xl shadow-sky-100 hover:bg-sky-700 transition-all flex items-center justify-center gap-3">
                         {isUpdatingStudent ? <Loader2 className="w-5 h-5 animate-spin" /> : "Commit_Entity_Synchronization"}
                      </button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}

        {isBulkMarksOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsBulkMarksOpen(false)} className="absolute inset-0 bg-sky-900/40 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-5xl h-[85vh] bg-white rounded-[4rem] shadow-2xl overflow-hidden border border-white/20 flex flex-col">
              <div className="p-12 bg-sky-600 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-8">
                   <div className="w-20 h-20 bg-sky-600 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-sky-500/40">
                      <Zap className="w-10 h-10" />
                   </div>
                   <div>
                      <h3 className="text-4xl font-black italic uppercase tracking-tighter">Bulk_Ingestion_Node</h3>
                      <p className="text-[11px] font-bold text-teal-200 uppercase tracking-[0.4em] mt-2">// Mass academic record synchronization</p>
                   </div>
                </div>
                <button onClick={() => setIsBulkMarksOpen(false)} className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"><XCircle className="w-8 h-8" /></button>
              </div>

              <div className="px-12 pt-6 flex border-b border-slate-100 shrink-0 gap-8">
                <button onClick={() => setBulkMarksTab("manual")} className={cn("pb-4 text-xs font-black uppercase tracking-wider border-b-4 transition-all", bulkMarksTab === "manual" ? "border-sky-600 text-sky-600" : "border-transparent text-slate-400 hover:text-slate-600")}>Manual_Entry</button>
                <button onClick={() => setBulkMarksTab("csv")} className={cn("pb-4 text-xs font-black uppercase tracking-wider border-b-4 transition-all", bulkMarksTab === "csv" ? "border-sky-600 text-sky-600" : "border-transparent text-slate-400 hover:text-slate-600")}>CSV_Upload</button>
              </div>

              {bulkMarksTab === "manual" ? (
                <>
                  <div className="p-12 grid grid-cols-1 md:grid-cols-2 gap-10 bg-slate-50 border-b border-slate-200 shrink-0">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Target_Department</label>
                        <select 
                          className="premium-input !py-5 !bg-white"
                          value={bulkMarksData.department}
                          onChange={e => setBulkMarksData({ ...bulkMarksData, department: e.target.value })}
                        >
                           <option value="">SELECT_REGISTRY_NODE</option>
                           {tenant?.departments?.map((d: string) => <option key={d} value={d}>{d}</option>)}
                        </select>
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Subject_Key</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Advanced Mathematics"
                          className="premium-input !py-5 !bg-white"
                          value={bulkMarksData.subject}
                          onChange={e => setBulkMarksData({ ...bulkMarksData, subject: e.target.value })}
                        />
                     </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                     <div className="grid gap-6">
                        {students.filter(s => !bulkMarksData.department || s.department === bulkMarksData.department).map(student => (
                           <div key={student.id} className="flex items-center justify-between p-8 bg-white rounded-3xl border border-slate-200 hover:border-sky-500 transition-all group">
                              <div className="flex items-center gap-6">
                                 <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center font-black text-xl group-hover:bg-sky-600 group-hover:text-white transition-all">
                                    {student.name[0]}
                                 </div>
                                 <div>
                                    <p className="font-black text-lg text-slate-900 uppercase italic tracking-tighter leading-none mb-1.5">{student.name}</p>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{student.rollNo || "NO_ROLL_ID"}</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-6">
                                 <input 
                                   type="number"
                                   placeholder="SCORE"
                                   className="w-32 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-center font-black text-sky-600 outline-none focus:bg-white focus:ring-8 focus:ring-sky-50 transition-all"
                                   value={bulkMarksData.marks[student.id] || ""}
                                   onChange={e => setBulkMarksData({
                                     ...bulkMarksData,
                                     marks: { ...bulkMarksData.marks, [student.id]: parseInt(e.target.value) }
                                   })}
                                 />
                                 <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center font-black text-xs uppercase group-hover:bg-sky-50 group-hover:text-sky-600 transition-all">%</div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="p-12 bg-white border-t border-slate-100 shrink-0 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center"><Activity className="w-6 h-6" /></div>
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active_Payload</p>
                           <p className="text-sm font-black text-slate-900">{Object.keys(bulkMarksData.marks).length} Nodes Modified</p>
                        </div>
                     </div>
                     <div className="flex gap-4">
                        <button onClick={() => setIsBulkMarksOpen(false)} className="px-10 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black text-[11px] uppercase tracking-widest">Abort_Mission</button>
                        <button 
                          onClick={submitBulkMarks}
                          className="px-12 py-5 bg-sky-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-sky-500/40 hover:bg-sky-700 transition-all"
                        >
                          Initialize_Core_Write
                        </button>
                     </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col p-12 bg-slate-50 overflow-y-auto custom-scrollbar justify-center items-center">
                  <div className="w-full max-w-xl space-y-8">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Target_Department (To customize template)</label>
                        <select 
                          className="premium-input !py-5 !bg-white"
                          value={bulkMarksData.department}
                          onChange={e => setBulkMarksData({ ...bulkMarksData, department: e.target.value })}
                        >
                           <option value="">ALL_DEPARTMENTS</option>
                           {tenant?.departments?.map((d: string) => <option key={d} value={d}>{d}</option>)}
                        </select>
                     </div>

                     <div className="premium-card p-8 bg-white border border-slate-200 shadow-sm flex items-center justify-between gap-6">
                       <div>
                         <h4 className="font-black text-sm text-slate-800 uppercase tracking-wider">CSV_Upload_Template</h4>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">// Preconfigured column schema matching current subjects</p>
                       </div>
                       <button 
                         onClick={downloadCSVDemo}
                         className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center gap-2"
                       >
                         <Download className="w-4 h-4" /> Download_Demo
                       </button>
                     </div>

                     <div className="border-4 border-dashed border-slate-200 rounded-3xl p-12 text-center hover:border-sky-500 transition-all cursor-pointer bg-white relative">
                       <input 
                         type="file" 
                         accept=".csv" 
                         disabled={isUploadingCSV}
                         onChange={handleCSVUpload} 
                         className="absolute inset-0 opacity-0 cursor-pointer" 
                       />
                       {isUploadingCSV ? (
                         <div className="space-y-4">
                           <Loader2 className="w-12 h-12 text-sky-600 animate-spin mx-auto" />
                           <p className="font-black text-xs text-slate-600 uppercase tracking-widest animate-pulse">Syncing CSV marks records...</p>
                         </div>
                       ) : (
                         <>
                           <Upload className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                           <p className="font-black text-sm text-slate-700 uppercase tracking-wider">Drag and drop marks CSV here, or click to browse</p>
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">// Automatically detects subjects & matches Roll Numbers</p>
                         </>
                       )}
                     </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {isSubjectConfigOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSubjectConfigOpen(false)} className="absolute inset-0 bg-sky-900/40 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl p-10 border border-white/20">
              <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 mb-2">Configure_Subjects</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-6">// Define course curriculum subject keys</p>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Subject List (comma-separated)</label>
                  <textarea
                    className="premium-input !h-32 !py-4 custom-scrollbar resize-none font-medium"
                    value={subjectInput}
                    onChange={e => setSubjectInput(e.target.value)}
                    placeholder="e.g. Mathematics, Physics, Chemistry, Computer Science"
                  />
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setIsSubjectConfigOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[11px] uppercase tracking-widest">Cancel</button>
                  <button onClick={saveSubjects} className="flex-1 py-4 bg-sky-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-sky-500/20 hover:bg-sky-700 transition-all">Save Changes</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {isBulkAttendanceOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsBulkAttendanceOpen(false)} className="absolute inset-0 bg-sky-900/40 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-5xl h-[85vh] bg-white rounded-[4rem] shadow-2xl overflow-hidden border border-white/20 flex flex-col">
              <div className="p-12 bg-sky-600 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-8">
                    <div className="w-20 h-20 bg-sky-600 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-sky-500/40">
                       <Calendar className="w-10 h-10" />
                    </div>
                    <div>
                       <h3 className="text-4xl font-black italic uppercase tracking-tighter">Bulk_Attendance_Ingestion</h3>
                       <p className="text-[11px] font-bold text-teal-200 uppercase tracking-[0.4em] mt-2">// Mass attendance record synchronization</p>
                    </div>
                </div>
                <button onClick={() => setIsBulkAttendanceOpen(false)} className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all cursor-pointer"><XCircle className="w-8 h-8" /></button>
              </div>

              <div className="p-12 grid grid-cols-1 md:grid-cols-2 gap-10 bg-slate-50 border-b border-slate-200 shrink-0">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Target_Department</label>
                    <select 
                      className="premium-input !py-5 !bg-white"
                      value={bulkAttendanceData.department}
                      onChange={e => setBulkAttendanceData({ ...bulkAttendanceData, department: e.target.value })}
                    >
                       <option value="">SELECT_REGISTRY_NODE</option>
                       {tenant?.departments?.map((d: string) => <option key={d} value={d}>{d}</option>)}
                    </select>
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Date_Key</label>
                    <input 
                      type="date" 
                      className="premium-input !py-5 !bg-white"
                      value={bulkAttendanceData.date}
                      onChange={e => setBulkAttendanceData({ ...bulkAttendanceData, date: e.target.value })}
                    />
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                 <div className="grid gap-6">
                    {students.filter(s => !bulkAttendanceData.department || s.department === bulkAttendanceData.department).map(student => {
                      const isPresent = bulkAttendanceData.status[student.id] !== "rejected";
                      return (
                        <div key={student.id} className="flex items-center justify-between p-8 bg-white rounded-3xl border border-slate-200 hover:border-sky-500 transition-all group">
                           <div className="flex items-center gap-6">
                              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center font-black text-xl group-hover:bg-sky-600 group-hover:text-white transition-all">
                                 {student.name[0]}
                              </div>
                              <div>
                                 <p className="font-black text-lg text-slate-900 uppercase italic tracking-tighter leading-none mb-1.5">{student.name}</p>
                                 <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{student.rollNo || "NO_ROLL_ID"}</p>
                              </div>
                           </div>
                           <div className="flex gap-2">
                             <button 
                               onClick={() => setBulkAttendanceData({
                                 ...bulkAttendanceData,
                                 status: { ...bulkAttendanceData.status, [student.id]: "approved" }
                               })}
                               className={cn(
                                 "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                                 isPresent 
                                   ? "bg-emerald-500 text-white shadow-lg shadow-emerald-100" 
                                   : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                               )}
                             >
                               Present
                             </button>
                             <button 
                               onClick={() => setBulkAttendanceData({
                                 ...bulkAttendanceData,
                                 status: { ...bulkAttendanceData.status, [student.id]: "rejected" }
                               })}
                               className={cn(
                                 "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                                 !isPresent 
                                   ? "bg-rose-500 text-white shadow-lg shadow-rose-100" 
                                   : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                               )}
                             >
                               Absent
                             </button>
                           </div>
                        </div>
                      );
                    })}
                 </div>
              </div>

              <div className="p-12 bg-white border-t border-slate-100 shrink-0 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center"><Activity className="w-6 h-6" /></div>
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active_Payload</p>
                       <p className="text-sm font-black text-slate-900">
                         {students.filter(s => !bulkAttendanceData.department || s.department === bulkAttendanceData.department).length} Nodes Loaded
                       </p>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <button onClick={() => setIsBulkAttendanceOpen(false)} className="px-10 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black text-[11px] uppercase tracking-widest">Abort_Mission</button>
                    <button 
                      onClick={submitBulkAttendance}
                      className="px-12 py-5 bg-sky-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-sky-500/40 hover:bg-sky-700 transition-all"
                    >
                      Initialize_Core_Write
                    </button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </div>
  );
}

