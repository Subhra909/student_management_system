import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Plus, Send, Trash2, AlarmClock, BookMarked, CreditCard, Bell, Loader2, CheckCircle2, XCircle, Globe, LayoutGrid, Users, FileText, Download, Award, ChevronDown, ChevronUp, Eye, FileCheck, Pencil } from "lucide-react";

// ── Fee Tab ─────────────────────────────────────────────────────────────────
export function FeeTab({ students, token, onRefresh }: any) {
  const [fees, setFees] = useState<any[]>([]);
  const [form, setForm] = useState({ studentId: "", type: "Tuition Fee", amount: "", dueDate: "", description: "", semester: "" });
  const [bulkForm, setBulkForm] = useState({ type: "Tuition Fee", amount: "", dueDate: "", semester: "" });
  const [submitting, setSubmitting] = useState(false);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const fetchFees = async () => {
    const res = await fetch("/api/admin/fees", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setFees(await res.json());
  };
  useEffect(() => { fetchFees(); }, []);

  const createFee = async (e: any) => {
    e.preventDefault(); setSubmitting(true);
    const res = await fetch("/api/admin/fees", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(form)
    });
    if (res.ok) { showToast("Fee created!"); setForm({ studentId: "", type: "Tuition Fee", amount: "", dueDate: "", description: "", semester: "" }); fetchFees(); onRefresh(); }
    setSubmitting(false);
  };

  const createBulkFee = async (e: any) => {
    e.preventDefault(); setBulkSubmitting(true);
    const res = await fetch("/api/admin/fees/bulk", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(bulkForm)
    });
    if (res.ok) { const d = await res.json(); showToast(d.message); fetchFees(); onRefresh(); }
    setBulkSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {toast && <div className="fixed top-20 right-6 z-50 px-5 py-3 bg-emerald-600 text-white rounded-2xl shadow-xl text-sm font-semibold animate-slide-up">{toast}</div>}

      <div className="premium-card">
        <div className="section-header">
          <div><p className="section-title">Bulk Fee Assignment</p><p className="section-subtitle">Assign fee to all active students at once</p></div>
        </div>
        <form onSubmit={createBulkFee} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <input className="premium-input" placeholder="Fee Type" value={bulkForm.type} onChange={e => setBulkForm({ ...bulkForm, type: e.target.value })} required />
          <input className="premium-input" type="number" placeholder="Amount (₹)" value={bulkForm.amount} onChange={e => setBulkForm({ ...bulkForm, amount: e.target.value })} required />
          <input className="premium-input" type="date" value={bulkForm.dueDate} onChange={e => setBulkForm({ ...bulkForm, dueDate: e.target.value })} required />
          <select className="premium-input" value={bulkForm.semester} onChange={e => setBulkForm({ ...bulkForm, semester: e.target.value })}>
             <option value="">SELECT_SEM</option>
             {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s.toString()}>SEM {s}</option>)}
          </select>
          <button type="submit" disabled={bulkSubmitting} className="btn-primary col-span-full flex items-center justify-center gap-2">
            {bulkSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Assign to All Students
          </button>
        </form>
      </div>

      <div className="premium-card">
        <div className="section-header">
          <div><p className="section-title">Individual Fee</p><p className="section-subtitle">Assign a fee to a specific student</p></div>
        </div>
        <form onSubmit={createFee} className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <select className="premium-input col-span-full md:col-span-1" value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} required>
            <option value="">Select Student</option>
            {students.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input className="premium-input" placeholder="Fee Type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} required />
          <input className="premium-input" type="number" placeholder="Amount (₹)" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
          <input className="premium-input" type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
          <select className="premium-input" value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })}>
             <option value="">SELECT_SEM</option>
             {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s.toString()}>SEM {s}</option>)}
          </select>
          <input className="premium-input" placeholder="Description (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <button type="submit" disabled={submitting} className="btn-primary flex items-center justify-center gap-2">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />} Create Fee
          </button>
        </form>
      </div>

      <div className="premium-card !p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100"><p className="font-bold text-slate-900">Fee Records ({fees.length})</p></div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Student</th><th>Type</th><th>Amount</th><th>Due Date</th><th>Status</th></tr></thead>
            <tbody>
              {fees.slice(0, 20).map((f: any, i: number) => (
                <tr key={i}>
                  <td className="font-medium text-slate-900">{f.studentName || f.studentId}</td>
                  <td className="text-slate-600">{f.type}</td>
                  <td className="font-semibold text-slate-900">₹{f.amount?.toLocaleString()}</td>
                  <td className="text-slate-500 text-sm">{f.dueDate || "\u2014"}</td>
                  <td><span className={`badge badge-${f.status === 'paid' ? 'success' : f.status === 'overdue' ? 'danger' : 'warning'}`}>{f.status}</span></td>
                </tr>
              ))}
              {fees.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-slate-400">No fee records yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Notification Tab ──────────────────────────────────────────────────────────
export function NotificationTab({ token, onRefresh, tenant }: any) {
  const [notifs, setNotifs] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", message: "", type: "announcement", department: "", semester: "" });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const fetchNotifs = async () => {
    const res = await fetch("/api/admin/notifications", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setNotifs(await res.json());
  };
  useEffect(() => { fetchNotifs(); }, []);

  const broadcast = async (e: any) => {
    e.preventDefault(); setSubmitting(true);
    const res = await fetch("/api/admin/notifications", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(form)
    });
    if (res.ok) { showToast("Announcement sent!"); setForm({ title: "", message: "", type: "announcement", department: "", semester: "" }); fetchNotifs(); }
    setSubmitting(false);
  };

  const deleteNotif = async (id: string) => {
    if (!confirm("Delete this notification?")) return;
    const res = await fetch(`/api/admin/notifications/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { showToast("Deleted"); fetchNotifs(); }
  };

  const typeColors: any = { announcement: "sky", alert: "rose", warning: "amber", info: "sky", success: "teal" };

  return (
    <div className="space-y-6">
      {toast && <div className="fixed top-20 right-6 z-50 px-5 py-3 bg-emerald-600 text-white rounded-2xl shadow-xl text-sm font-semibold animate-slide-up">{toast}</div>}

      <div className="premium-card">
        <div className="section-header">
          <div><p className="section-title">Broadcast Announcement</p><p className="section-subtitle">Send targeted notifications to departments or all students</p></div>
        </div>
        <form onSubmit={broadcast} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input className="premium-input md:col-span-2" placeholder="Notification Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            <select className="premium-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="announcement">📢 Announcement</option>
              <option value="alert">🚨 Alert</option>
              <option value="warning">⚠️ Warning</option>
              <option value="info">ℹ️ Info</option>
              <option value="success">✅ Success</option>
            </select>
            <select className="premium-input" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
              <option value="">🌐 GLOBAL BROADCAST</option>
              {tenant?.departments?.map((d: string) => <option key={d} value={d}>🏢 {d.toUpperCase()}</option>)}
            </select>
            <select className="premium-input" value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })}>
               <option value="">ALL_SEMESTERS</option>
               {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s.toString()}>SEM {s}</option>)}
            </select>
          </div>
          <textarea className="premium-input min-h-[100px] resize-none" placeholder="Message content..." value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required />
          <button type="submit" disabled={submitting} className="btn-primary flex items-center justify-center gap-2 w-full md:w-fit">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />} 
            {form.department ? `Send to ${form.department}` : "Broadcast to Everyone"}
          </button>
        </form>
      </div>

      <div className="space-y-3">
        {notifs.map((n: any, i: number) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="premium-card flex items-start gap-4 hover:shadow-lg transition-all group">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 bg-${typeColors[n.type] || 'sky'}-50 text-${typeColors[n.type] || 'sky'}-600`}>
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold text-slate-900">{n.title}</p>
                {n.department ? (
                   <span className="px-2 py-0.5 bg-sky-50 text-sky-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-sky-100 flex items-center gap-1">
                      <LayoutGrid className="w-2.5 h-2.5" /> {n.department}
                   </span>
                ) : (
                   <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1">
                      <Globe className="w-2.5 h-2.5" /> ALL_UNITS
                   </span>
                )}
              </div>
              <p className="text-sm text-slate-500">{n.message}</p>
              <p className="text-[10px] text-slate-400 mt-2 font-medium">{new Date(n.createdAt).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`badge badge-${typeColors[n.type] === 'indigo' ? 'info' : typeColors[n.type] === 'rose' ? 'danger' : typeColors[n.type] === 'emerald' ? 'success' : 'warning'}`}>{n.type}</span>
              <button onClick={() => deleteNotif(n._id)} className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </motion.div>
        ))}
        {notifs.length === 0 && (
          <div className="premium-card text-center py-12 border-dashed">
            <Bell className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="font-semibold text-slate-400 uppercase tracking-widest text-[10px]">Registry_Protocol_Silent</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Timetable Tab ─────────────────────────────────────────────────────────────
export function TimetableTab({ token, tenant }: any) {
  const [slots, setSlots] = useState<any[]>([]);
  const [form, setForm] = useState({ department: "", semester: "", day: "Monday", startTime: "", endTime: "", subject: "", teacherName: "", room: "", type: "lecture" });
  const [submitting, setSubmitting] = useState(false);

  const fetchSlots = async () => {
    const res = await fetch("/api/admin/timetable", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setSlots(await res.json());
  };
  useEffect(() => { fetchSlots(); }, []);

  const addSlot = async (e: any) => {
    e.preventDefault(); setSubmitting(true);
    const res = await fetch("/api/admin/timetable", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(form)
    });
    if (res.ok) { fetchSlots(); setForm({ ...form, subject: "", teacherName: "", room: "", startTime: "", endTime: "" }); }
    setSubmitting(false);
  };

  const deleteSlot = async (id: string) => {
    await fetch(`/api/admin/timetable/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    fetchSlots();
  };

  return (
    <div className="space-y-6">
      <div className="premium-card">
        <div className="section-header"><div><p className="section-title">Schedule Management</p><p className="section-subtitle">Define departmental class schedules</p></div></div>
        <form onSubmit={addSlot} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <select className="premium-input" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} required>
             <option value="">SELECT_DEPT</option>
             {tenant?.departments?.map((d: string) => <option key={d} value={d}>{d.toUpperCase()}</option>)}
          </select>
          <select className="premium-input" value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })}>
             <option value="">SELECT_SEM</option>
             {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s.toString()}>SEM {s}</option>)}
          </select>
          <select className="premium-input" value={form.day} onChange={e => setForm({ ...form, day: e.target.value })}>
            {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map(d => <option key={d}>{d}</option>)}
          </select>
          <select className="premium-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
            <option value="lecture">Lecture</option><option value="lab">Lab</option><option value="tutorial">Tutorial</option><option value="seminar">Seminar</option>
          </select>
          <input className="premium-input" placeholder="Subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required />
          <input className="premium-input" placeholder="Teacher Name" value={form.teacherName} onChange={e => setForm({ ...form, teacherName: e.target.value })} />
          <input className="premium-input" type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} required />
          <input className="premium-input" type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} required />
          <input className="premium-input" placeholder="Room (e.g. A-201)" value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} />
          <button type="submit" disabled={submitting} className="btn-primary flex items-center justify-center gap-2">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add Slot
          </button>
        </form>
      </div>

      <div className="space-y-6">
        {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map(day => {
          const daySlots = slots.filter(s => s.day === day);
          if (!daySlots.length) return null;
          return (
            <div key={day} className="premium-card !p-0 overflow-hidden">
              <div className="px-6 py-4 bg-sky-500 text-white flex justify-between items-center">
                 <p className="font-black italic uppercase tracking-tighter text-sm">{day}</p>
                 <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{daySlots.length} Slots Defined</span>
              </div>
              <div className="p-4 space-y-3">
                {daySlots.map((s: any) => (
                  <div key={s._id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl hover:bg-white hover:shadow-md transition-all group border border-slate-100">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center font-black text-[10px] uppercase tracking-widest border", {
                       "bg-sky-50 text-sky-600 border-sky-100": s.type === 'lecture',
                       "bg-rose-50 text-rose-600 border-rose-100": s.type === 'lab',
                       "bg-amber-50 text-amber-600 border-amber-100": s.type === 'tutorial',
                    })}>{s.type}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                         <p className="font-black text-slate-900 text-sm uppercase italic tracking-tighter">{s.subject}</p>
                         <span className="px-2 py-0.5 bg-slate-200 text-slate-500 rounded text-[9px] font-black uppercase">{s.department}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{s.startTime} \u2013 {s.endTime} \u00b7 {s.teacherName || "IDENTITY_PENDING"} \u00b7 ROOM: {s.room || "TBD"}</p>
                    </div>
                    <button onClick={() => deleteSlot(s._id)} className="p-3 text-slate-300 hover:text-rose-500 transition-colors bg-white rounded-xl shadow-sm border border-slate-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {slots.length === 0 && (
          <div className="premium-card text-center py-12 border-dashed">
            <AlarmClock className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="font-semibold text-slate-400 uppercase tracking-widest text-[10px]">Timeline_Registry_Void</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Assignment Tab ────────────────────────────────────────────────────────────
export function AssignmentTab({ token, tenant }: any) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [form, setForm] = useState({ title: "", subject: "", description: "", department: "", semester: "", dueDate: "", maxMarks: "100" });
  const [submitting, setSubmitting] = useState(false);
  const [submissionsPanel, setSubmissionsPanel] = useState<{ open: boolean; data: any | null; loading: boolean }>({
    open: false, data: null, loading: false
  });
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeForm, setGradeForm] = useState({ score: "", feedback: "" });
  const [gradingLoading, setGradingLoading] = useState(false);

  const fetchAssignments = async () => {
    const res = await fetch("/api/admin/assignments", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setAssignments(await res.json());
  };
  useEffect(() => { fetchAssignments(); }, []);

  const viewSubmissions = async (assignmentId: string) => {
    setSubmissionsPanel({ open: true, data: null, loading: true });
    const res = await fetch(`/api/admin/assignments/${assignmentId}/submissions`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setSubmissionsPanel({ open: true, data, loading: false });
    } else {
      setSubmissionsPanel({ open: false, data: null, loading: false });
    }
  };

  const viewFile = async (submissionId: string) => {
    const res = await fetch(`/api/admin/submissions/${submissionId}/file`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return alert("No file/content available");
    const data = await res.json();
    if (data.fileData) {
      // Download the file
      const link = document.createElement("a");
      link.href = `data:${data.fileType};base64,${data.fileData}`;
      link.download = data.fileName || "submission";
      link.click();
    } else if (data.textContent) {
      alert(`Text Submission:\n\n${data.textContent}`);
    }
  };

  const gradeSubmission = async (submissionId: string) => {
    if (!gradeForm.score) return alert("Enter a score");
    setGradingLoading(true);
    const res = await fetch(`/api/admin/submissions/${submissionId}/grade`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ score: Number(gradeForm.score), feedback: gradeForm.feedback })
    });
    if (res.ok) {
      setGradingId(null); setGradeForm({ score: "", feedback: "" });
      // Refresh the panel
      if (submissionsPanel.data?.assignment?._id) viewSubmissions(submissionsPanel.data.assignment._id);
    }
    setGradingLoading(false);
  };

  const [toast, setToast] = useState("");
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const createAssignment = async (e: any) => {
    e.preventDefault(); setSubmitting(true);
    const res = await fetch("/api/admin/assignments", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(form)
    });
    if (res.ok) { showToast("Assignment created!"); setForm({ title: "", subject: "", description: "", department: "", dueDate: "", maxMarks: "100" }); fetchAssignments(); }
    setSubmitting(false);
  };

  const deleteAssignment = async (id: string) => {
    if (!confirm("Delete this assignment?")) return;
    const res = await fetch(`/api/admin/assignments/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { showToast("Deleted"); fetchAssignments(); }
  };

  const toggleStatus = async (id: string, current: string) => {
    const status = current === "active" ? "closed" : "active";
    await fetch(`/api/admin/assignments/${id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ status }) });
    fetchAssignments();
  };

  return (
    <div className="space-y-6">
      <div className="premium-card">
        <div className="section-header"><div><p className="section-title">Academic Tasks</p><p className="section-subtitle">Issue departmental or global assignments</p></div></div>
        <form onSubmit={createAssignment} className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <input className="premium-input col-span-full" placeholder="Assignment Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          <input className="premium-input" placeholder="Subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required />
          <select className="premium-input" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
             <option value="">🌐 GLOBAL_ASSIGNMENT</option>
             {tenant?.departments?.map((d: string) => <option key={d} value={d}>🏢 {d.toUpperCase()}</option>)}
          </select>
          <select className="premium-input" value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })}>
             <option value="">SELECT_SEM</option>
             {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s.toString()}>SEM {s}</option>)}
          </select>
          <input className="premium-input" type="number" placeholder="Max Marks" value={form.maxMarks} onChange={e => setForm({ ...form, maxMarks: e.target.value })} />
          <input className="premium-input" type="date" placeholder="Due Date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} required />
          <textarea className="premium-input col-span-full md:col-span-2 resize-none min-h-[80px]" placeholder="Description / Instructions" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <button type="submit" disabled={submitting} className="btn-primary flex items-center justify-center gap-2">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookMarked className="w-4 h-4" />} Create Assignment
          </button>
        </form>
      </div>

      <div className="space-y-4">
        {assignments.map((a: any, i: number) => {
          const daysLeft = Math.ceil((new Date(a.dueDate).getTime() - Date.now()) / 86400000);
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="premium-card flex items-start gap-5 hover:border-sky-200 transition-all group">
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-2", {
                 "bg-rose-50 text-rose-500 border-rose-100": daysLeft <= 2,
                 "bg-amber-50 text-amber-500 border-amber-100": daysLeft <= 5 && daysLeft > 2,
                 "bg-emerald-50 text-emerald-500 border-emerald-100": daysLeft > 5
              })}>
                <BookMarked className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <p className="font-black text-slate-900 uppercase italic tracking-tighter text-lg">{a.title}</p>
                  <span className="px-2 py-0.5 bg-sky-500 text-white rounded text-[8px] font-black uppercase tracking-widest">{a.subject}</span>
                  {a.department ? (
                    <span className="px-2 py-0.5 bg-teal-500 text-white rounded text-[8px] font-black uppercase tracking-widest">{a.department}</span>
                  ) : (
                    <span className="px-2 py-0.5 bg-cyan-500 text-white rounded text-[8px] font-black uppercase tracking-widest">GLOBAL</span>
                  )}
                  {a.semester && <span className="px-2 py-0.5 bg-amber-500 text-white rounded text-[8px] font-black uppercase tracking-widest">{a.semester}</span>}
                </div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Max Marks: {a.maxMarks} \u00b7 DUE: {new Date(a.dueDate).toLocaleDateString()}</p>
                {a.description && <p className="text-[13px] text-slate-500 font-medium leading-relaxed italic">{a.description}</p>}
              </div>
              <div className="text-right shrink-0 flex flex-col items-end gap-2">
                <div className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border", {
                   "bg-rose-600 text-white border-rose-600": daysLeft <= 2,
                   "bg-amber-500 text-white border-amber-500": daysLeft <= 5 && daysLeft > 2,
                   "bg-emerald-600 text-white border-emerald-600": daysLeft > 5
                })}>
                  {daysLeft <= 0 ? "EXPIRED" : `${daysLeft}D LEFT`}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => viewSubmissions(a._id)} className="px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border bg-sky-50 text-sky-600 border-sky-200 hover:bg-sky-100 flex items-center gap-1 transition-all">
                    <Users className="w-3 h-3" /> Submissions
                  </button>
                  <button onClick={() => toggleStatus(a._id, a.status)} className={cn("px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all", a.status === 'active' ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-200')}>{a.status === 'active' ? 'Close' : 'Reopen'}</button>
                  <button onClick={() => deleteAssignment(a._id)} className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </motion.div>
          );
        })}
        {assignments.length === 0 && (
          <div className="premium-card text-center py-12 border-dashed">
            <BookMarked className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="font-semibold text-slate-400 uppercase tracking-widest text-[10px]">Academic_Stream_Clear</p>
          </div>
        )}
      </div>

      {/* Submissions Panel Modal */}
      {submissionsPanel.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setSubmissionsPanel({ open: false, data: null, loading: false }); }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-sky-100 flex items-center justify-between bg-sky-500 text-white">
              <div>
                <p className="font-black text-lg italic uppercase tracking-tighter">{submissionsPanel.data?.assignment?.title || "Submissions"}</p>
                {submissionsPanel.data?.stats && (
                  <div className="flex items-center gap-4 mt-1">
                    {[
                      { label: "Total", val: submissionsPanel.data.stats.total, color: "text-white/60" },
                      { label: "Submitted", val: submissionsPanel.data.stats.submitted, color: "text-emerald-400" },
                      { label: "Late", val: submissionsPanel.data.stats.late, color: "text-amber-400" },
                      { label: "Pending", val: submissionsPanel.data.stats.pending, color: "text-rose-400" },
                    ].map(s => (
                      <span key={s.label} className={`text-[10px] font-black uppercase tracking-widest ${s.color}`}>{s.label}: {s.val}</span>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => setSubmissionsPanel({ open: false, data: null, loading: false })} className="p-2 text-white/60 hover:text-white transition-colors text-2xl leading-none">&times;</button>
            </div>

            <div className="overflow-y-auto flex-1">
              {submissionsPanel.loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  {/* Submitted students */}
                  {submissionsPanel.data?.submissions?.length > 0 && (
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-3">Submitted ({submissionsPanel.data.submissions.length})</p>
                      <div className="space-y-3">
                        {submissionsPanel.data.submissions.map((sub: any) => (
                          <div key={sub._id} className="premium-card !p-4">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-black text-sm shrink-0">
                                  {sub.studentName?.[0]}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 text-sm">{sub.studentName}</p>
                                  <p className="text-[10px] text-slate-400">{sub.rollNo} · {sub.department}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={cn("px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border",
                                  sub.status === 'graded' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                  sub.status === 'late' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                  'bg-sky-50 text-sky-600 border-sky-100'
                                )}>{sub.status}</span>
                                {sub.status === 'graded' && <span className="text-[10px] font-black text-emerald-600">{sub.score}/{submissionsPanel.data.assignment.maxMarks}</span>}
                                <span className="text-[9px] text-slate-400">{new Date(sub.submittedAt).toLocaleDateString()}</span>
                                <button onClick={() => viewFile(sub._id)} className="p-1.5 text-sky-500 hover:bg-sky-50 rounded-lg transition-colors" title="View/Download">
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button onClick={() => { setGradingId(sub._id); setGradeForm({ score: sub.score?.toString() || "", feedback: sub.feedback || "" }); }} className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" title="Grade">
                                  <Award className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            {/* Grading form */}
                            {gradingId === sub._id && (
                              <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                                <div className="flex gap-3">
                                  <div className="flex-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Score / {submissionsPanel.data.assignment.maxMarks}</label>
                                    <input type="number" className="premium-input w-full" placeholder={`0 – ${submissionsPanel.data.assignment.maxMarks}`}
                                      value={gradeForm.score} onChange={e => setGradeForm(p => ({ ...p, score: e.target.value }))} />
                                  </div>
                                  <div className="flex-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Feedback (optional)</label>
                                    <input type="text" className="premium-input w-full" placeholder="Well done!"
                                      value={gradeForm.feedback} onChange={e => setGradeForm(p => ({ ...p, feedback: e.target.value }))} />
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => gradeSubmission(sub._id)} disabled={gradingLoading}
                                    className="btn-primary flex items-center gap-2 text-[10px] py-2">
                                    {gradingLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Award className="w-3 h-3" />} Save Grade
                                  </button>
                                  <button onClick={() => setGradingId(null)} className="btn-secondary text-[10px] py-2">Cancel</button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Non-submitters */}
                  {submissionsPanel.data?.nonSubmitters?.length > 0 && (
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-widest text-rose-500 mb-3">Not Submitted ({submissionsPanel.data.nonSubmitters.length})</p>
                      <div className="space-y-2">
                        {submissionsPanel.data.nonSubmitters.map((s: any) => (
                          <div key={s.uid} className="flex items-center gap-3 p-3 bg-rose-50/50 rounded-2xl border border-rose-100">
                            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-500 flex items-center justify-center font-black text-xs shrink-0">
                              {s.name?.[0]}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-bold text-slate-800">{s.name}</p>
                              <p className="text-[10px] text-slate-400">{s.rollNo} · {s.department}</p>
                            </div>
                            <span className="text-[9px] font-black uppercase text-rose-500 tracking-widest">Pending</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!submissionsPanel.data?.submissions?.length && !submissionsPanel.data?.nonSubmitters?.length && (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                      <p className="text-slate-400 font-semibold">No students found for this assignment</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ── Admit Card Tab ─────────────────────────────────────────────────────────
export function AdmitCardTab({ token, departments }: any) {
  const [admitCards, setAdmitCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ department: "", examName: "", semester: "", schedules: [{ subject: "", date: "", time: "", room: "" }] });

  const fetchAdmitCards = async () => {
    const res = await fetch("/api/admin/admit-cards", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setAdmitCards(await res.json());
  };

  useEffect(() => { fetchAdmitCards(); }, [token]);

  const addSchedule = () => setForm({ ...form, schedules: [...form.schedules, { subject: "", date: "", time: "", room: "" }] });
  
  const removeSchedule = (idx: number) => {
    const newSchedules = form.schedules.filter((_, i) => i !== idx);
    setForm({ ...form, schedules: newSchedules });
  };

  const updateSchedule = (idx: number, field: string, value: string) => {
    const newSchedules = [...form.schedules];
    (newSchedules[idx] as any)[field] = value;
    setForm({ ...form, schedules: newSchedules });
  };

  const handleGenerate = async (isGenerated: boolean) => {
    if (!form.department || !form.examName) return alert("Department and Exam Name are required");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/admit-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, isGenerated })
      });
      if (res.ok) {
        fetchAdmitCards();
        setForm({ department: "", examName: "", semester: "", schedules: [{ subject: "", date: "", time: "", room: "" }] });
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-8">
       <div className="premium-card">
          <h3 className="text-xl font-black italic uppercase tracking-tighter mb-8 flex items-center gap-3">
             <FileCheck className="w-6 h-6 text-sky-500" /> Admit_Card_Generator
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Target_Dept</label>
                <select className="premium-input" value={form.department} onChange={e => setForm({...form, department: e.target.value})}>
                   <option value="">SELECT_DEPARTMENT</option>
                   {departments.map((d: string) => <option key={d} value={d}>{d}</option>)}
                </select>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Exam_Heading</label>
                <input className="premium-input" placeholder="e.g. SEMESTER_FINAL_2026" value={form.examName} onChange={e => setForm({...form, examName: e.target.value})} />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Semester</label>
                <select className="premium-input" value={form.semester} onChange={e => setForm({...form, semester: e.target.value})}>
                   <option value="">SELECT_SEM</option>
                   {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s.toString()}>SEM {s}</option>)}
                </select>
             </div>
          </div>

          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-900">Exam_Schedule</h4>
                <button onClick={addSchedule} className="flex items-center gap-2 text-sky-600 text-[10px] font-black uppercase tracking-widest hover:text-sky-700">
                   <Plus className="w-3.5 h-3.5" /> Add_Subject
                </button>
             </div>

             {form.schedules.map((s, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-slate-50 rounded-2xl relative group">
                   <input className="premium-input bg-white" placeholder="Subject Name" value={s.subject} onChange={e => updateSchedule(idx, "subject", e.target.value)} />
                   <input type="date" className="premium-input bg-white" value={s.date} onChange={e => updateSchedule(idx, "date", e.target.value)} />
                   <input type="time" className="premium-input bg-white" value={s.time} onChange={e => updateSchedule(idx, "time", e.target.value)} />
                   <div className="flex gap-2">
                      <input className="premium-input bg-white flex-1" placeholder="Room/Hall" value={s.room} onChange={e => updateSchedule(idx, "room", e.target.value)} />
                      {form.schedules.length > 1 && (
                        <button onClick={() => removeSchedule(idx)} className="p-3 text-rose-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                      )}
                   </div>
                </div>
             ))}
          </div>

          <div className="flex gap-4 mt-10">
             <button onClick={() => handleGenerate(false)} disabled={loading} className="flex-1 py-5 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-50">
                Save_Schedule_Draft
             </button>
             <button onClick={() => handleGenerate(true)} disabled={loading} className="flex-[2] py-5 bg-sky-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-sky-100 hover:bg-sky-700 flex items-center justify-center gap-3">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
                GENERATE_&_PUBLISH_ADMIT_CARDS
             </button>
          </div>
       </div>

       <div className="space-y-4">
          <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 ml-2">// Generated_Nodes</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {admitCards.map((card, i) => (
                <div key={i} className="premium-card flex items-start justify-between group">
                   <div>
                      <div className="flex items-center gap-2 mb-2">
                         <span className="px-2 py-0.5 bg-sky-50 text-sky-600 rounded text-[9px] font-black uppercase">{card.department}</span>
                         <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${card.isGenerated ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                            {card.isGenerated ? "PUBLISHED" : "DRAFT"}
                         </span>
                      </div>
                      <h5 className="text-lg font-black italic uppercase tracking-tighter text-slate-900">{card.examName}</h5>
                      <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-widest">{card.schedules.length} Subjects · {card.semester}</p>
                   </div>
                   <button onClick={() => setForm({ department: card.department, examName: card.examName, semester: card.semester, schedules: card.schedules })} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-sky-50 hover:text-sky-600 transition-all">
                      <Pencil className="w-4 h-4" />
                   </button>
                </div>
             ))}
          </div>
       </div>
    </div>
  );
}

const cn = (...classes: any[]) => classes.filter(Boolean).join(" ");

