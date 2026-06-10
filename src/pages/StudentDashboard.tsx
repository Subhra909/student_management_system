import React, { useState, useEffect } from "react";
import { useAuth } from "../lib/auth";
import { getISTDate, cn, getCurrentIST } from "../lib/utils";
import { 
  User as UserIcon, Calendar, Award, CreditCard, MessageSquare, 
  Download, Clock, CheckCircle2, XCircle, Send, Phone,
  GraduationCap, Hash, Loader2, BookOpen,
  TrendingUp, Bell, LayoutDashboard, CreditCard as PaymentIcon,
  BookMarked, AlarmClock, Target, Sparkles, ChevronRight, History, Mail, FileText, Info, Zap,
  Upload, CheckCheck, X as XIcon, Paperclip, FileCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ProfileModal from "../components/ProfileModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function StudentDashboard() {
  const { user, profile: authProfile, updateProfileContext } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [marks, setMarks] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "attendance" | "marks" | "fees" | "messages" | "schedule" | "assignments" | "announcements" | "admit">("overview");
  const [admitCard, setAdmitCard] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Assignment states
  const [submitModal, setSubmitModal] = useState<{open: boolean, assignment: any}>({ open: false, assignment: null });
  const [submitText, setSubmitText] = useState("");
  const [submitFile, setSubmitFile] = useState<{name: string, data: string, type: string} | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submissionMap, setSubmissionMap] = useState<Record<string, any>>({}); // assignmentId -> submission
  const [submitToast, setSubmitToast] = useState("");

  const fetchAdmitCard = async () => {
    try {
      const res = await fetch("/api/student/admit-card", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) setAdmitCard(await res.json());
      else setAdmitCard(null);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (activeTab === "admit") fetchAdmitCard();
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/student/dashboard", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load your student profile node.");
      const data = await res.json();
      if (res.ok) {
        setProfile(data.profile);
        updateProfileContext(data.profile);
        setAttendance(data.attendance || []);
        setMarks(data.marks || []);
        setFees(data.fees || []);
        setTimetable(data.timetable || []);
        setMessages(data.messages || []);
        setNotifications(data.notifications || []);
        setAssignments(data.assignments || []);
        
        // Map submissions
        const smap: any = {};
        data.assignments?.forEach((a: any) => {
          if (a.submission) smap[a._id] = a.submission;
        });
        setSubmissionMap(smap);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    setSendingMsg(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/student/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: newMessage })
      });
      if (res.ok) {
        setMessages([...messages, { content: newMessage, senderId: user?.uid, timestamp: "Just now" }]);
        setNewMessage("");
      }
    } catch (e) { console.error(e); }
    finally { setSendingMsg(true); setTimeout(() => setSendingMsg(false), 500); }
  };

  const handlePayFee = async (fee: any) => {
    try {
      const token = localStorage.getItem("token");
      const transactionId = 'TXN_' + Math.random().toString(36).substr(2, 9).toUpperCase();
      const res = await fetch("/api/student/fee/pay", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          feeId: fee._id,
          transactionId,
          paidAt: new Date().toISOString()
        })
      });
      if (res.ok) {
        setFees(fees.map(f => f._id === fee._id ? { ...f, status: 'paid', transactionId } : f));
        alert("TRANSACTION_SUCCESS: Your payment has been authenticated and logged in the institution registry.");
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (submitToast) {
      const timer = setTimeout(() => setSubmitToast(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [submitToast]);

  const pendingFeesCount = fees.filter(f => f.status !== 'paid').length;


  const exportAdmitCard = () => {
    if (!admitCard) {
      alert("ADMISSION_CARD_NOT_FOUND: Your admit card has not been generated by the college administration yet.");
      return;
    }
    if (pendingFeesCount > 0) {
      alert("ADMISSION_CARD_LOCKED: You have outstanding fees. Please clear all dues to download your admit card.");
      return;
    }
    const doc = new jsPDF();
    doc.setFillColor(242, 159, 103); // Orange #F29F67
    doc.rect(0, 0, 210, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("EDUNEXUS ACADEMIC SYSTEM", 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text(`OFFICIAL EXAMINATION ADMIT CARD // ${admitCard.examName}`, 105, 30, { align: "center" });
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text("STUDENT IDENTITY RECORD", 20, 55);
    doc.setLineWidth(0.5);
    doc.line(20, 57, 190, 57);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`FULL NAME: ${authProfile?.name?.toUpperCase()}`, 20, 65);
    doc.text(`ENROLLMENT ID: ${authProfile?.enrollmentId || "N/A"}`, 20, 72);
    doc.text(`COLLEGE: ${authProfile?.collegeName?.toUpperCase() || "N/A"}`, 20, 79);
    doc.text(`DEPARTMENT: ${authProfile?.department?.toUpperCase() || "N/A"}`, 110, 65);
    doc.text(`ROLL NO: ${authProfile?.rollNo || "N/A"}`, 110, 72);
    doc.text(`SEMESTER: ${authProfile?.semester || "N/A"}`, 110, 79);
    autoTable(doc, {
      startY: 100,
      head: [["SUBJECT", "DATE", "TIME", "ROOM", "STATUS"]],
      body: admitCard.schedules.map((s: any) => [s.subject.toUpperCase(), s.date, s.time, s.room || "HALL-A", "ELIGIBLE"]),
      headStyles: { fillColor: [14, 165, 233] },
    });
    doc.save(`Admit_Card_${profile?.name}.pdf`);
  };



  const navItems = [
    { id: "overview",       icon: LayoutDashboard, label: "Overview" },
    { id: "attendance",    icon: Calendar,        label: "Attendance" },
    { id: "marks",         icon: Award,           label: "Performance" },
    { id: "fees",          icon: PaymentIcon,     label: "Fees" },
    { id: "schedule",      icon: AlarmClock,      label: "Timetable" },
    { id: "assignments",   icon: BookMarked,      label: "Assignments" },
    { id: "admit",         icon: FileCheck,       label: "Admit Card" },
    { id: "announcements", icon: Bell,            label: "Announcements" },
    { id: "messages",      icon: MessageSquare,   label: "Messages" },
  ];

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="premium-card max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto">
            <XCircle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Network_Protocol_Error</h2>
            <p className="text-sm text-slate-500 mt-2 font-medium">{error}</p>
          </div>
          <button 
            onClick={() => { setError(null); setIsLoading(true); fetchDashboardData(); }}
            className="w-full py-4 bg-sky-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-sky-700 transition-all active:scale-95"
          >
            Reconnect_Session
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-dashboard min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl border-4 border-sky-100 border-t-sky-600 animate-spin" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">Loading your dashboard...</p>
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
                {activeTab === "overview" ? (() => {
                  const h = new Date().getHours();
                  if (h >= 5 && h < 12) return "Good Morning";
                  if (h >= 12 && h < 17) return "Good Afternoon";
                  if (h >= 17 && h < 21) return "Good Evening";
                  return "Good Night";
                })() : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                {activeTab === "overview" && <span className="gradient-text">, {authProfile?.name?.split(" ")[0] || "Student"}!</span>}
              </h1>
              <p className="text-[11px] font-medium text-slate-400 mt-1">
                {authProfile?.collegeName || "EduNexus"} · {authProfile?.department || "Student Portal"}
              </p>
            </div>
            <button onClick={() => setIsProfileModalOpen(true)} className="flex items-center gap-3 px-4 py-2.5 bg-white/70 backdrop-blur-md rounded-2xl border border-sky-100 hover:border-sky-300 hover:shadow-md transition-all shrink-0 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 text-white flex items-center justify-center font-black text-[11px] overflow-hidden shadow-lg shadow-sky-100">
                {authProfile?.profilePicture
                  ? <img src={authProfile.profilePicture} className="w-8 h-8 rounded-xl object-cover" alt="" />
                  : authProfile?.name?.[0]?.toUpperCase() || "S"}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-[12px] font-bold text-slate-900">{authProfile?.name || "Student"}</p>
                <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">{authProfile?.enrollmentId || "Edit Profile"}</p>
              </div>
            </button>
          </header>

          {/* Pill Navigation */}
          <nav className="pill-nav mb-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={cn("pill-nav-item", activeTab === item.id && "active")}
              >
                <item.icon className="w-3.5 h-3.5 shrink-0" />
                <span>{item.label}</span>
                {item.id === "messages" && messages.filter(m => m.senderId !== user?.uid).length > 0 && (
                  <span className="pill-badge pill-badge-rose">
                    {messages.filter(m => m.senderId !== user?.uid).length}
                  </span>
                )}
                {item.id === "assignments" && assignments.length > 0 && (
                  <span className="pill-badge pill-badge-amber">
                    {assignments.length}
                  </span>
                )}
                {item.id === "announcements" && notifications.filter((n: any) => !n.readBy?.includes(user?.uid)).length > 0 && (
                  <span className="pill-badge pill-badge-rose">
                    {notifications.filter((n: any) => !n.readBy?.includes(user?.uid)).length}
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
              {activeTab === "overview" && (() => {
                const approvedAtt = attendance.filter(a => a.status === 'approved').length;
                const attPct = Math.round((approvedAtt / (attendance.length || 1)) * 100);
                const pendingFees = fees.filter(f => f.status !== 'paid').length;
                const avgScore = marks.length ? Math.round(marks.reduce((s: number, m: any) => s + m.score, 0) / marks.length) : 0;
                return (
                <div className="space-y-6">
                  {/* Stat Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: "Attendance", val: `${attPct}%`, sub: `${approvedAtt}/${attendance.length} days`, icon: Calendar, variant: "sky", prog: attPct },
                      { label: "Avg. Score", val: `${avgScore}`, sub: `${marks.length} subjects`, icon: Award, variant: "teal", prog: avgScore },
                      { label: "Pending Fees", val: pendingFees, sub: `${fees.length} total fees`, icon: CreditCard, variant: "rose", prog: null },
                      { label: "Messages", val: messages.length, sub: "From administration", icon: MessageSquare, variant: "amber", prog: null },
                    ].map((s, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                        className={`stat-card stat-card-${s.variant}`}>
                        <div className="flex items-center justify-between">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center`}
                            style={{ background: `var(--color-${s.variant}-50, rgba(14,165,233,0.1))`, color: `var(--color-${s.variant}-600, #0ea5e9)` }}>
                            <s.icon className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-semibold text-slate-400">{s.sub}</span>
                        </div>
                        <div>
                          <p className="text-3xl font-black text-slate-900">{s.val}</p>
                          <p className="text-[11px] font-semibold text-slate-400 mt-0.5">{s.label}</p>
                        </div>
                        {s.prog !== null && (
                          <div className="progress-bar"><div className="progress-fill" style={{ width: `${s.prog}%` }} /></div>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  <div className="grid grid-cols-12 gap-8">
                    {/* Identity Module */}
                    <div className="col-span-12 lg:col-span-8 premium-card !p-10 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                         <GraduationCap className="w-64 h-64 text-slate-900" />
                      </div>
                      
                      <div className="relative z-10">
                         <div className="flex flex-col md:flex-row items-center gap-10 mb-12">
                            <div className="w-32 h-32 rounded-[3rem] bg-sky-500 text-white flex items-center justify-center font-black text-5xl shadow-2xl shadow-sky-100 border-4 border-white overflow-hidden">
                               {authProfile?.profilePicture ? (
                                 <img src={authProfile.profilePicture} alt="" className="w-full h-full object-cover" />
                               ) : (
                                 authProfile?.name?.[0] || "S"
                               )}
                            </div>
                            <div className="text-center md:text-left">
                               <h2 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter leading-none mb-4">{authProfile?.name}</h2>
                               <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                  <span className="px-4 py-1.5 bg-sky-50 text-sky-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-sky-100">{authProfile?.department || "General_Studies"}</span>
                                  <span className="px-4 py-1.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200">Roll: {authProfile?.rollNo || "PENDING"}</span>
                               </div>
                            </div>
                         </div>

                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 flex items-center gap-6 group hover:bg-white hover:shadow-xl transition-all">
                               <div className="p-4 bg-white rounded-2xl shadow-sm text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-all">
                                  <FileCheck className="w-6 h-6" />
                               </div>
                               <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Admit_Card</p>
                                   <button 
                                    onClick={() => setActiveTab("admit")}
                                    className="text-xs font-black text-slate-900 uppercase italic hover:text-sky-600 transition-colors"
                                   >
                                      {admitCard ? "Download_Ready" : "Waiting_For_Release"}
                                   </button>
                               </div>
                            </div>
                            <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 flex items-center gap-6 group hover:bg-white hover:shadow-xl transition-all">
                               <div className="p-4 bg-white rounded-2xl shadow-sm text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                  <Info className="w-6 h-6" />
                               </div>
                               <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Identity_Verify</p>
                                  <button onClick={() => setIsProfileModalOpen(true)} className="text-xs font-black text-slate-900 uppercase italic hover:text-sky-600 transition-colors">Update_Information</button>
                               </div>
                            </div>
                         </div>
                      </div>
                    </div>

                    <div className="col-span-12 lg:col-span-4 space-y-8">
                      <div className="premium-card !bg-sky-600 !text-white border-none shadow-2xl">
                         <h3 className="text-xl font-black italic uppercase tracking-tighter mb-8 flex items-center gap-3">
                            <Zap className="w-5 h-5 text-sky-400" />
                            System_Alerts
                         </h3>
                         <div className="space-y-6">
                            {messages.filter(m => m.senderId === 'admin').slice(0, 2).map((msg, idx) => (
                               <div key={idx} className="p-4 bg-white/5 rounded-2xl border border-white/10 group hover:bg-white/10 transition-all">
                                  <p className="text-[9px] font-black text-sky-400 uppercase tracking-widest mb-2">Broadcast_Received</p>
                                  <p className="text-xs font-medium line-clamp-2 opacity-80">{msg.content}</p>
                               </div>
                            ))}
                            {messages.filter(m => m.senderId === 'admin').length === 0 && (
                               <div className="text-center py-10 opacity-30">
                                  <MessageSquare className="w-10 h-10 mx-auto mb-4" />
                                  <p className="text-[10px] font-black uppercase tracking-widest">No active broadcasts</p>
                               </div>
                            )}
                         </div>
                      </div>


                    </div>
                  </div>
                </div>
                );
              })()}

              {activeTab === "attendance" && (
                <div className="space-y-6">
                  <div className="premium-card flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">Attendance Record</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{attendance.filter(a => a.status === 'approved').length} approved out of {attendance.length} submissions</p>
                    </div>
                    <div className="badge badge-success">{Math.round((attendance.filter(a => a.status === 'approved').length / (attendance.length || 1)) * 100)}% rate</div>
                  </div>
                  <div className="premium-card !p-0 overflow-hidden">
                     <table className="w-full text-left">
                        <thead className="bg-white border-b border-slate-100 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                           <tr>
                              <th className="px-10 py-6">Date_Cycle</th>
                              <th className="px-10 py-6">Submission_Header</th>
                              <th className="px-10 py-6 text-right">Protocol_Status</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {attendance.map((a, idx) => (
                              <tr key={idx} className="hover:bg-sky-50/20 transition-all group">
                                 <td className="px-10 py-8">
                                    <div className="flex items-center gap-4">
                                       <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 group-hover:bg-sky-600 group-hover:text-white transition-all flex items-center justify-center">
                                          <Calendar className="w-5 h-5" />
                                       </div>
                                       <p className="text-lg font-black text-slate-900 uppercase italic tracking-tighter">{a.date}</p>
                                    </div>
                                 </td>
                                 <td className="px-10 py-8 font-mono text-[10px] text-slate-500 uppercase tracking-widest">
                                    {a.submittedAt || "N/A_TIMESTAMP"}
                                 </td>
                                 <td className="px-10 py-8 text-right">
                                    <span className={cn("px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border",
                                       a.status === 'approved' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                       a.status === 'rejected' ? "bg-rose-50 text-rose-600 border-rose-100" :
                                       "bg-amber-50 text-amber-600 border-amber-100"
                                    )}>
                                       {a.status}
                                    </span>
                                 </td>
                              </tr>
                           ))}
                           {attendance.length === 0 && (
                              <tr>
                                 <td colSpan={3} className="py-32 text-center">
                                    <Clock className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em]">Registry_Protocol_Empty</p>
                                 </td>
                              </tr>
                           )}
                        </tbody>
                     </table>
                  </div>
                </div>
              )}

              {activeTab === "marks" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {marks.length > 0 ? marks.map((m, idx) => (
                    <div key={idx} className="premium-card group hover:!border-sky-500/30 transition-all overflow-hidden relative">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-sky-600/5 rounded-full blur-3xl pointer-events-none group-hover:bg-sky-600/10 transition-all" />
                       <div className="flex items-center justify-between mb-8">
                          <div className="p-4 bg-sky-500 text-white rounded-2xl group-hover:bg-sky-600 transition-all duration-500 shadow-xl shadow-sky-100">
                             <Award className="w-6 h-6" />
                          </div>
                          <span className={cn("text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border", 
                            m.score >= 40 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                          )}>
                             {m.score >= 40 ? "Credit_Valid" : "Debt_Accrued"}
                          </span>
                       </div>
                       <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">{m.subject}</h3>
                       <p className="text-5xl font-black text-slate-900 italic tracking-tighter leading-none mb-8">{m.score}<span className="text-sky-600 text-xl font-black not-italic ml-1">%</span></p>
                       
                       <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${m.score}%` }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className={cn("h-full rounded-full", m.score >= 40 ? "bg-sky-600" : "bg-rose-500")}
                          />
                       </div>
                    </div>
                  )) : (
                    <div className="col-span-full py-32 text-center bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200">
                       <Award className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                       <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em]">Merit_Data_Not_Found</p>
                    </div>
                  )}
                </div>
              )}

               {activeTab === "fees" && (() => {
                 const totalDues = fees
                   .filter(f => f.status !== 'paid')
                   .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
                 
                 return (
                 <div className="max-w-4xl mx-auto space-y-10">
                    <div className={cn(
                      "premium-card !p-12 border-none shadow-2xl relative overflow-hidden group transition-all duration-500",
                      totalDues > 0 ? "bg-sky-500 text-white shadow-sky-200" : "bg-teal-500 text-white shadow-teal-200"
                    )}>
                       <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[100px] pointer-events-none" />
                       <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                          <div className="text-center md:text-left">
                             <p className="text-[11px] font-black text-white/70 uppercase tracking-[0.4em] mb-4">
                               {totalDues > 0 ? "Core_Academic_Debt" : "Financial_Status_Clear"}
                             </p>
                             <h3 className="text-7xl font-black italic tracking-tighter leading-none mb-4">
                               ₹{totalDues.toLocaleString()}<span className="text-sky-200 text-3xl font-black ml-2">.00</span>
                             </h3>
                             <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
                               {totalDues > 0 ? `${fees.filter(f => f.status !== 'paid').length} PENDING_TRANSACTIONS` : "ALL_DUES_AUTHENTICATED"}
                             </p>
                          </div>
                          <div className="w-24 h-24 bg-white/20 border border-white/30 rounded-[2.5rem] flex items-center justify-center group-hover:bg-white/30 transition-all duration-700 shadow-xl">
                             {totalDues > 0 ? <CreditCard className="w-10 h-10 text-white" /> : <CheckCircle2 className="w-10 h-10 text-white" />}
                          </div>
                       </div>
                    </div>

                    <div className="space-y-6">
                       <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-8">// Transaction_History</h4>
                       {fees.map((f, idx) => (
                         <div key={idx} className="premium-card flex flex-col md:flex-row items-center justify-between gap-8 hover:!border-sky-500/30 transition-all">
                            <div className="flex items-center gap-6">
                               <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl">
                                  <History className="w-6 h-6" />
                               </div>
                               <div>
                                  <h5 className="text-lg font-black text-slate-900 uppercase italic tracking-tighter">{f.type || "Academic Fee"}</h5>
                                  <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest mt-1">REF: {(f._id || f.id || "").toString().substring(0, 16).toUpperCase()}</p>
                               </div>
                            </div>
                            <div className="flex items-center gap-6 w-full md:w-auto">
                               {f.status === 'paid' ? (
                                 <div className="text-right">
                                    <p className="text-sm font-black text-emerald-600 uppercase tracking-widest mb-1">Authenticated</p>
                                    <p className="text-[9px] font-mono text-slate-400 uppercase">{f.transactionId}</p>
                                 </div>
                               ) : (
                                 <button onClick={() => handlePayFee(f)} className="w-full md:w-auto px-10 py-4 bg-sky-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-sky-700 transition-all">Authorize_Transfer</button>
                               )}
                            </div>
                         </div>
                       ))}
                       {fees.length === 0 && (
                         <div className="text-center py-20 bg-slate-50/50 rounded-[2.5rem] border border-slate-200">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No active transaction nodes found</p>
                         </div>
                       )}
                    </div>
                 </div>
                 );
               })()}

              {activeTab === "messages" && (
                <div className="max-w-5xl mx-auto flex flex-col h-[70vh] premium-card !p-0 overflow-hidden shadow-2xl">
                  <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-sky-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-sky-100">
                           <MessageSquare className="w-6 h-6" />
                        </div>
                        <div>
                           <h3 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter">Secure_Messaging</h3>
                           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">// End-to-end encrypted channel</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[9px] font-black uppercase text-slate-400">Node_Stable</span>
                     </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-10 space-y-6 custom-scrollbar bg-slate-50/30">
                    {messages.map((m, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, x: m.senderId === 'admin' ? -20 : 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={idx} 
                        className={cn("max-w-[70%] p-6 rounded-[2rem] relative group", 
                          m.senderId === 'admin' 
                            ? "bg-white mr-auto text-slate-800 border border-slate-200 shadow-sm" 
                            : "bg-sky-600 ml-auto text-white shadow-2xl"
                        )}
                      >
                        <p className={cn("text-[8px] font-black uppercase tracking-[0.2em] mb-3 opacity-40", 
                          m.senderId === 'admin' ? "text-sky-600" : "text-sky-400"
                        )}>
                           {m.senderId === 'admin' ? "OFFICIAL_ADMIN_NODE" : "USER_IDENTITY_NODE"}
                        </p>
                        <p className="text-sm font-medium leading-relaxed">{m.content}</p>
                        <p className="text-[8px] mt-4 opacity-30 font-mono text-right">{m.timestamp}</p>
                      </motion.div>
                    ))}
                    {messages.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-center opacity-30">
                        <Mail className="w-16 h-16 mb-6" />
                        <p className="text-[12px] font-black uppercase tracking-[0.4em]">Secure Channel Empty</p>
                      </div>
                    )}
                  </div>

                  <div className="p-8 bg-white border-t border-slate-100 flex gap-4">
                    <div className="flex-1 relative">
                       <input 
                        type="text" 
                        placeholder="Inject message content..."
                        className="w-full bg-slate-50 px-8 py-5 rounded-2xl text-sm outline-none font-medium border border-slate-200 focus:border-sky-500 focus:bg-white transition-all pr-16"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && sendMessage()}
                       />
                       <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20 font-mono text-[10px]">
                          CMD_SEND
                       </div>
                    </div>
                    <button 
                      disabled={sendingMsg || !newMessage.trim()}
                      onClick={sendMessage}
                      className="p-5 bg-sky-600 text-white rounded-2xl shadow-xl shadow-sky-100 disabled:opacity-20 hover:bg-sky-700 transition-all active:scale-95 group"
                    >
                      {sendingMsg ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "schedule" && (
                <div className="space-y-4">
                  {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map(day => {
                    const daySlots = timetable.filter((t: any) => t.day === day);
                    if (daySlots.length === 0) return null;
                    return (
                      <div key={day} className="premium-card">
                        <p className="font-bold text-slate-900 mb-4">{day}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {daySlots.map((slot: any, i: number) => (
                            <div key={i} className={`timetable-cell ${slot.type === 'lab' ? 'lab' : slot.type === 'tutorial' ? 'tutorial' : ''}`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-[13px]">{slot.subject}</span>
                                <span className="text-[10px] capitalize opacity-70">{slot.type}</span>
                              </div>
                              <p className="text-[11px] opacity-70">{slot.startTime} – {slot.endTime}</p>
                              {slot.room && <p className="text-[10px] opacity-60 mt-1">📍 {slot.room}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {timetable.length === 0 && (
                    <div className="premium-card text-center py-16">
                      <AlarmClock className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <p className="font-semibold text-slate-400">No timetable published yet</p>
                      <p className="text-[12px] text-slate-300 mt-1">Your administrator will publish your class schedule here</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "assignments" && (
                <div className="space-y-4">
                  <AnimatePresence>
                    {submitModal.open && submitModal.assignment && (
                      <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={(e) => { if (e.target === e.currentTarget) setSubmitModal({ open: false, assignment: null }); }}
                      >
                        <motion.div
                          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                          className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 space-y-5"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-black text-slate-900 text-lg">{submitModal.assignment.title}</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">{submitModal.assignment.subject} \u00b7 Max {submitModal.assignment.maxMarks} marks</p>
                            </div>
                            <button onClick={() => setSubmitModal({ open: false, assignment: null })} className="p-2 text-slate-400 hover:text-slate-700 transition-colors">
                              <XIcon className="w-5 h-5" />
                            </button>
                          </div>

                          {submitModal.assignment.description && (
                            <div className="bg-slate-50 rounded-2xl p-4 text-sm text-slate-600">{submitModal.assignment.description}</div>
                          )}

                          <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Your Answer</label>
                            <textarea
                              className="w-full premium-input resize-none h-32 text-sm"
                              placeholder="Write your answer here (optional if uploading a file)..."
                              value={submitText}
                              onChange={e => setSubmitText(e.target.value)}
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Attach File (PDF, DOC, Image \u2013 max 4MB)</label>
                            <div className="relative">
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  if (file.size > 4 * 1024 * 1024) { setSubmitToast("File too large (max 4MB)"); return; }
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    const base64 = (reader.result as string).split(",")[1];
                                    setSubmitFile({ name: file.name, data: base64, type: file.type });
                                  };
                                  reader.readAsDataURL(file);
                                }}
                              />
                              <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-dashed cursor-pointer transition-colors ${submitFile ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 hover:border-sky-300 bg-slate-50'}`}>
                                {submitFile ? (
                                  <><CheckCheck className="w-4 h-4 text-emerald-500" /><span className="text-sm font-medium text-emerald-600 truncate">{submitFile.name}</span></>
                                ) : (
                                  <><Paperclip className="w-4 h-4 text-slate-400" /><span className="text-sm text-slate-400">Click to select a file...</span></>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            disabled={submitting || (!submitText.trim() && !submitFile)}
                            onClick={async () => {
                              setSubmitting(true);
                              try {
                                const token = localStorage.getItem("token");
                                const res = await fetch(`/api/student/assignments/${submitModal.assignment._id}/submit`, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                                  body: JSON.stringify({
                                    textContent: submitText,
                                    fileName: submitFile?.name || "",
                                    fileData: submitFile?.data || "",
                                    fileType: submitFile?.type || "",
                                  })
                                });
                                const data = await res.json();
                                if (res.ok) {
                                  setSubmissionMap(prev => ({ ...prev, [submitModal.assignment._id]: data.submission }));
                                  setSubmitToast(data.message || "Submitted!");
                                  setSubmitModal({ open: false, assignment: null });
                                  setSubmitText(""); setSubmitFile(null);
                                } else {
                                  setSubmitToast(data.error || "Submission failed");
                                }
                              } catch { setSubmitToast("Network error"); }
                              finally { setSubmitting(false); }
                            }}
                            className="w-full py-4 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all"
                          >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            {submitting ? "Submitting..." : "Submit Assignment"}
                          </button>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {submitToast && (
                    <div className="fixed top-20 right-6 z-50 px-5 py-3 bg-sky-600 text-white rounded-2xl shadow-xl text-sm font-semibold animate-slide-up" style={{ animationDuration: '0.3s' }}>
                      {submitToast}
                    </div>
                  )}

                  {assignments.map((a: any, i: number) => {
                    const due = new Date(a.dueDate);
                    const daysLeft = Math.ceil((due.getTime() - Date.now()) / 86400000);
                    const submission = submissionMap[a._id];
                    const statusColor = submission?.status === "graded" ? "emerald" : submission?.status === "late" ? "amber" : submission ? "indigo" : "slate";
                    const statusLabel = submission?.status === "graded" ? `Graded: ${submission.score}/${a.maxMarks}` : submission?.status === "late" ? "Submitted (Late)" : submission ? "Submitted \u2713" : null;
                    return (
                      <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                        className="premium-card">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${submission ? 'bg-sky-50 text-sky-500' : daysLeft <= 2 ? 'bg-rose-50 text-rose-500' : daysLeft <= 5 ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'}`}>
                            {submission ? <CheckCheck className="w-5 h-5" /> : <BookMarked className="w-5 h-5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                              <div>
                                <p className="font-bold text-slate-900">{a.title}</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">{a.subject} · Max {a.maxMarks} marks</p>
                              </div>
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                <span className={`badge ${daysLeft <= 0 ? 'badge-danger' : daysLeft <= 2 ? 'badge-danger' : daysLeft <= 5 ? 'badge-warning' : 'badge-success'}`}>
                                  {daysLeft <= 0 ? 'Overdue' : `${daysLeft}d left`}
                                </span>
                                {statusLabel && (
                                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-${statusColor}-50 text-${statusColor}-600 border border-${statusColor}-100`}>
                                    {statusLabel}
                                  </span>
                                )}
                              </div>
                            </div>
                            {a.description && <p className="text-[12px] text-slate-500 mt-2 line-clamp-2">{a.description}</p>}
                            {submission?.feedback && (
                              <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                <p className="text-[11px] font-bold text-emerald-700 mb-0.5">Feedback from Admin</p>
                                <p className="text-[12px] text-emerald-600">{submission.feedback}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <p className="text-[10px] text-slate-400">Due: {due.toLocaleDateString()}</p>
                          {submission ? (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400">Submitted {new Date(submission.submittedAt).toLocaleDateString()}</span>
                              {submission.status === "graded" ? (
                                <span className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl flex items-center gap-1">
                                  🔒 Graded — Locked
                                </span>
                              ) : daysLeft <= 0 ? (
                                <span className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider bg-slate-50 text-slate-400 border border-slate-200 rounded-xl flex items-center gap-1">
                                  🔒 Deadline Passed
                                </span>
                              ) : (
                                <button
                                  onClick={() => { setSubmitText(""); setSubmitFile(null); setSubmitModal({ open: true, assignment: a }); }}
                                  className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider border border-slate-200 rounded-xl text-slate-500 hover:border-sky-300 hover:text-sky-600 transition-all"
                                >Resubmit</button>
                              )}
                            </div>
                          ) : (
                            <button
                              disabled={daysLeft <= 0}
                              onClick={() => { setSubmitText(""); setSubmitFile(null); setSubmitModal({ open: true, assignment: a }); }}
                              className={cn(
                                "px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all",
                                daysLeft <= 0 
                                  ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200" 
                                  : "bg-sky-600 hover:bg-sky-700 text-white shadow-lg shadow-sky-100"
                              )}
                            >
                              {daysLeft <= 0 ? (
                                <><XIcon className="w-3 h-3" /> Closed</>
                              ) : (
                                <><Upload className="w-3 h-3" /> Submit</>
                              )}
                            </button>
                          )}
                        </div>

                      </motion.div>
                    );
                  })}
                  {assignments.length === 0 && (
                    <div className="premium-card text-center py-16">
                      <BookMarked className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <p className="font-semibold text-slate-400">No active assignments</p>
                      <p className="text-[12px] text-slate-300 mt-1">Assignments from your department will appear here</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "announcements" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="section-title">Announcements</p>
                      <p className="section-subtitle">Notifications from your institution</p>
                    </div>
                    {notifications.length > 0 && (
                      <button
                        onClick={async () => {
                          const token = localStorage.getItem("token");
                          await fetch("/api/student/notifications/read-all", { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
                          await fetchDashboardData();
                        }}
                        className="btn-secondary text-[10px]"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  {notifications.map((n: any, i: number) => {
                    const isUnread = !n.readBy?.includes(user?.uid);
                    const typeColor: any = { success: "emerald", warning: "amber", alert: "rose", announcement: "indigo", info: "sky" };
                    const color = typeColor[n.type] || "slate";
                    return (
                      <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                        className={`premium-card flex items-start gap-4 transition-all ${isUnread ? "border-sky-200 bg-sky-50/30" : ""}`}>
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 bg-${color}-50 text-${color}-500`}>
                          <Bell className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="font-bold text-slate-900 text-sm">{n.title}</p>
                            {isUnread && <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />}
                            <span className={`badge badge-${color === 'indigo' ? 'info' : color === 'rose' ? 'danger' : color === 'emerald' ? 'success' : 'warning'}`}>{n.type}</span>
                            {n.department && <span className="px-2 py-0.5 bg-sky-50 text-sky-600 rounded-lg text-[9px] font-black uppercase border border-sky-100">{n.department}</span>}
                          </div>
                          <p className="text-sm text-slate-500">{n.message}</p>
                          <p className="text-[10px] text-slate-400 mt-2">{new Date(n.createdAt).toLocaleString()}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                  {notifications.length === 0 && (
                    <div className="premium-card text-center py-16">
                      <Bell className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <p className="font-semibold text-slate-400">No announcements yet</p>
                    </div>
                  )}
                </div>
              )}

               {activeTab === "admit" && (
                 <div className="max-w-4xl mx-auto">
                    <div className="premium-card !p-12 text-center flex flex-col items-center justify-center space-y-8 min-h-[500px]">
                       <div className="w-24 h-24 bg-sky-50 text-sky-500 rounded-[2.5rem] flex items-center justify-center shadow-xl shadow-sky-100">
                          <FileCheck className="w-12 h-12" />
                       </div>
                       <div>
                          <h3 className="text-4xl font-black text-slate-900 italic uppercase tracking-tighter mb-4">
                            {admitCard ? admitCard.examName : "Admit_Card_Vault"}
                          </h3>
                          <p className="text-sm text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
                            {admitCard 
                              ? "Your official examination admit card has been generated. Please ensure all details are correct before downloading."
                              : "The college administration has not yet generated your admit card. Please contact your department for the exam schedule."}
                          </p>
                       </div>

                       {admitCard ? (
                         <div className="space-y-6 w-full">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                               <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Examination_Node</p>
                                  <p className="text-sm font-black text-slate-900 uppercase italic">{admitCard.examName}</p>
                               </div>
                               <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Subject_Payload</p>
                                  <p className="text-sm font-black text-slate-900 uppercase italic">{admitCard.schedules.length} Exam Nodes</p>
                               </div>
                            </div>
                            <button 
                              onClick={exportAdmitCard}
                              className="w-full py-6 bg-sky-600 text-white rounded-[2rem] font-black text-[12px] uppercase tracking-[0.4em] shadow-2xl shadow-sky-500/40 hover:bg-sky-700 transition-all flex items-center justify-center gap-4 group"
                            >
                               <Download className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                               Download_Official_Admit_Card
                            </button>
                         </div>
                       ) : (
                         <div className="px-10 py-5 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100 shadow-sm">
                            Status: Waiting_For_Admin_Generation
                         </div>
                       )}
                    </div>
                 </div>
               )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        onSuccess={fetchDashboardData}
      />
    </div>
  );
}
