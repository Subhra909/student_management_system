import React, { useState, useEffect } from "react";
import { useAuth } from "../lib/auth";
import { db } from "../lib/firebase";
import { collection, query, onSnapshot, updateDoc, doc, addDoc, getDocs, deleteDoc, where } from "firebase/firestore";
import { 
  Users, CheckCircle2, XCircle, Award, MessageSquare, 
  BarChart3, Shield, Search, Filter, Download, Upload,
  MoreVertical, Mail, Trash2
} from "lucide-react";
import { motion } from "motion/react";
import { getCurrentIST, cn } from "../lib/utils";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface Student {
  id: string;
  name: string;
  email: string;
  role: string;
  enrollmentId?: string;
  lastLoginAt?: string;
  lastLoginIp?: string;
}

export default function AdminDashboard() {
  const { user, profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRequests, setAttendanceRequests] = useState<any[]>([]);
  const [marks, setMarks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"students" | "attendance" | "marks" | "analytics" | "messages">("analytics");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Bulk messaging state
  const [bulkMessage, setBulkMessage] = useState("");
  const [sendingBulk, setSendingBulk] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Fetch all students
    const qStudents = query(collection(db, "users"), where("role", "==", "student"));
    const unsubscribeStudents = onSnapshot(qStudents, (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
    });

    // Fetch all attendance requests
    const unsubscribeAtt = onSnapshot(collection(db, "attendance"), (snapshot) => {
      setAttendanceRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch all marks
    const unsubscribeMarks = onSnapshot(collection(db, "marks"), (snapshot) => {
      setMarks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeStudents();
      unsubscribeAtt();
      unsubscribeMarks();
    };
  }, [user]);

  const approveAttendance = async (id: string, approved: boolean) => {
    const ref = doc(db, "attendance", id);
    await updateDoc(ref, {
      status: approved ? "approved" : "rejected",
      updatedAt: getCurrentIST()
    });
    
    // Log action
    await addDoc(collection(db, "audit_logs"), {
      adminId: user?.uid,
      action: approved ? "APPROVE_ATTENDANCE" : "REJECT_ATTENDANCE",
      targetId: id,
      timestamp: getCurrentIST()
    });
  };

  const updateStudentMarks = async (studentId: string, subject: string, score: number) => {
    const q = query(collection(db, "marks"), where("studentId", "==", studentId), where("subject", "==", subject));
    const snap = await getDocs(q);
    
    if (snap.empty) {
      await addDoc(collection(db, "marks"), { studentId, subject, score, updatedAt: getCurrentIST() });
    } else {
      await updateDoc(doc(db, "marks", snap.docs[0].id), { score, updatedAt: getCurrentIST() });
    }

    await addDoc(collection(db, "audit_logs"), {
      adminId: user?.uid,
      action: "UPDATE_MARKS",
      targetId: studentId,
      details: `${subject}: ${score}`,
      timestamp: getCurrentIST()
    });
  };

  const sendBulkMessage = async () => {
    if (!bulkMessage.trim()) return;
    setSendingBulk(true);
    try {
      await addDoc(collection(db, "messages"), {
        senderId: "admin",
        receiverId: "admin_all", // Special ID for all students
        senderName: "Administration",
        content: bulkMessage,
        timestamp: getCurrentIST(),
        isRead: false
      });
      setBulkMessage("");
      alert("Bulk message sent to all students.");
    } catch (err) {
      console.error(err);
    } finally {
      setSendingBulk(false);
    }
  };

  const chartData = {
    labels: ['Approved', 'Pending', 'Rejected'],
    datasets: [
      {
        label: 'Attendance Requests',
        data: [
          attendanceRequests.filter(a => a.status === 'approved').length,
          attendanceRequests.filter(a => a.status === 'pending').length,
          attendanceRequests.filter(a => a.status === 'rejected').length
        ],
        backgroundColor: ['#22c55e', '#f97316', '#ef4444'],
        borderWidth: 0,
      },
    ],
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Admin Nav */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {[
          { id: "analytics", icon: BarChart3, label: "Analytics" },
          { id: "students", icon: Users, label: "Students" },
          { id: "attendance", icon: CheckCircle2, label: "Attendance" },
          { id: "marks", icon: Award, label: "Marks" },
          { id: "messages", icon: MessageSquare, label: "Bulk Message" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
              activeTab === tab.id 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:border-blue-500"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "analytics" && (
        <div className="grid grid-cols-12 gap-4 auto-rows-min">
          <div className="col-span-12 lg:col-span-8 card h-[350px]">
            <div className="card-title">Attendance Velocity (Daily Requests)</div>
            <div className="h-[250px] flex items-center justify-center">
              <Pie data={chartData} options={{ maintainAspectRatio: false, plugins: { legend: { labels: { color: '#94a3b8', font: { size: 10 } } } } }} />
            </div>
          </div>
          <div className="col-span-12 lg:col-span-4 space-y-4">
            <div className="card">
              <div className="card-title">Total Students</div>
              <div className="stat-value">{students.length}</div>
              <div className="text-[10px] text-green-500 mt-1 uppercase font-bold tracking-wider">↑ 12% this cycle</div>
            </div>
            <div className="card border-l-4 border-l-emerald-500">
              <div className="card-title">Pending Approvals</div>
              <div className="stat-value">{attendanceRequests.filter(a => a.status === 'pending').length}</div>
              <div className="text-[10px] text-yellow-500 mt-1 uppercase font-bold tracking-wider">Critical Action Required</div>
            </div>
            <div className="card border-l-4 border-l-brand-accent">
              <div className="card-title">System Health</div>
              <div className="flex items-center gap-2 mt-1">
                 <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                 <span className="text-xs font-bold font-mono">STABLE_V1.0</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "students" && (
        <div className="card p-0 overflow-hidden">
          <div className="p-4 border-b border-brand-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="card-title mb-0">Student Registry</div>
            <div className="relative">
              <Search className="absolute left-3 top-2 w-3.5 h-3.5 text-brand-muted" />
              <input 
                type="text" 
                placeholder="Query name/ID..."
                className="pl-9 pr-4 py-1.5 bg-brand-bg border border-brand-border rounded text-[11px] outline-none w-full sm:w-48 focus:border-brand-accent/50"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-brand-sidebar text-[10px] uppercase tracking-wider text-brand-muted">
                <tr>
                  <th className="px-5 py-3 font-bold border-b border-brand-border">Identity</th>
                  <th className="px-5 py-3 font-bold border-b border-brand-border">System ID</th>
                  <th className="px-5 py-3 font-bold border-b border-brand-border">Last Access</th>
                  <th className="px-5 py-3 font-bold border-b border-brand-border text-right">Security</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {filteredStudents.map(student => (
                  <tr key={student.id} className="hover:bg-brand-sidebar/50 transition-colors group">
                    <td className="px-5 py-3 border-b border-brand-border/50">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent font-bold text-[10px]">
                          {student.name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-xs">{student.name}</p>
                          <p className="text-[10px] text-brand-muted">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 border-b border-brand-border/50 text-xs font-mono text-brand-accent">{student.enrollmentId || student.id.substring(0, 8)}</td>
                    <td className="px-5 py-3 border-b border-brand-border/50 text-[10px]">
                      <p className="font-medium">{student.lastLoginAt?.split(' ')[0]}</p>
                      <p className="text-brand-muted">{student.lastLoginIp || "0.0.0.0"}</p>
                    </td>
                    <td className="px-5 py-3 border-b border-brand-border/50 text-right">
                      <span className="badge-security border border-red-500/30 text-red-500 text-[9px] px-1.5 py-0.5 rounded font-mono">MFA_DISABLED</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "attendance" && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6">
          <h3 className="font-bold mb-6">Attendance Approval Requests</h3>
          <div className="space-y-4">
            {attendanceRequests.filter(a => a.status === 'pending').map(req => (
              <div key={req.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                    {req.studentName?.[0]}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{req.studentName}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>Date: <span className="font-semibold text-gray-900 dark:text-gray-100">{req.date}</span></span>
                      <span>Submitted: {req.submittedAt}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => approveAttendance(req.id, false)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={() => approveAttendance(req.id, true)}
                    className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-950/20 rounded-xl"
                  >
                    <CheckCircle2 className="w-6 h-6" />
                  </button>
                </div>
              </div>
            ))}
            {attendanceRequests.filter(a => a.status === 'pending').length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                No pending requests. Good job!
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "marks" && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6">
          <h3 className="font-bold mb-6">Subject Marks Management</h3>
          <div className="space-y-6">
            {students.map(student => (
              <div key={student.id} className="p-6 border border-gray-100 dark:border-gray-800 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-bold">{student.name}</p>
                  <span className="text-[10px] font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded tracking-tighter">{student.id}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {["Mathematics", "Physics", "Chemistry"].map(subject => {
                    const mark = marks.find(m => m.studentId === student.id && m.subject === subject);
                    return (
                      <div key={subject} className="space-y-1">
                        <label className="text-xs text-gray-500 uppercase font-bold">{subject}</label>
                        <input 
                          type="number"
                          className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                          defaultValue={mark?.score || 0}
                          onBlur={(e) => updateStudentMarks(student.id, subject, parseInt(e.target.value))}
                        />
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
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-purple-100 text-purple-600 rounded-2xl">
              <Mail className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Bulk Student Messaging</h3>
              <p className="text-sm text-gray-500">Send an announcement or alert to all registered students.</p>
            </div>
          </div>
          <div className="space-y-4">
            <textarea
              className="w-full h-40 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
              placeholder="Enter your message here..."
              value={bulkMessage}
              onChange={e => setBulkMessage(e.target.value)}
            />
            <div className="flex items-center gap-2 p-4 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-2xl text-xs border border-amber-200 dark:border-amber-900">
              <Shield className="w-4 h-4 shrink-0" />
              This message will be visible to all students in their Message Center.
            </div>
            <button 
              disabled={sendingBulk || !bulkMessage.trim()}
              onClick={sendBulkMessage}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
            >
              {sendingBulk ? "Sending..." : "Blast Message to All"}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
