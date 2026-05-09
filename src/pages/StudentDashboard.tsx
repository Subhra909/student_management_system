import React, { useState, useEffect } from "react";
import { useAuth } from "../lib/auth";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot, addDoc, getDocs, orderBy, limit, doc, updateDoc } from "firebase/firestore";
import { User, Calendar, Award, CreditCard, MessageSquare, Download, Clock, CheckCircle2, XCircle, Send } from "lucide-react";
import { motion } from "motion/react";
import { getCurrentIST, getISTDate, cn } from "../lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function StudentDashboard() {
  const { profile, user } = useAuth();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [marks, setMarks] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Fetch Attendance
    const attQuery = query(collection(db, "attendance"), where("studentId", "==", user.uid));
    const unsubscribeAtt = onSnapshot(attQuery, (snapshot) => {
      setAttendance(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch Marks
    const marksQuery = query(collection(db, "marks"), where("studentId", "==", user.uid));
    const unsubscribeMarks = onSnapshot(marksQuery, (snapshot) => {
      setMarks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch Fees
    const feesQuery = query(collection(db, "fees"), where("studentId", "==", user.uid));
    const unsubscribeFees = onSnapshot(feesQuery, (snapshot) => {
      setFees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch Messages
    const msgQuery = query(
      collection(db, "messages"), 
      where("senderId", "in", [user.uid, "admin_all"]),
      orderBy("timestamp", "asc")
    );
    // Note: This query might need a different structure if admin replies. 
    // For now, let's just fetch messages where student is sender or recipient (admin_all)
    const unsubscribeMsgs = onSnapshot(msgQuery, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeAtt();
      unsubscribeMarks();
      unsubscribeFees();
      unsubscribeMsgs();
    };
  }, [user]);

  const submitAttendance = async () => {
    if (!user) return;
    const today = getISTDate();
    const existing = attendance.find(a => a.date === today);

    if (existing) {
      alert("Attendance already submitted for today.");
      return;
    }

    await addDoc(collection(db, "attendance"), {
      studentId: user.uid,
      studentName: profile?.name,
      date: today,
      status: "pending",
      submittedAt: getCurrentIST(),
    });
    alert("Attendance request submitted for approval.");
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;
    setSendingMessage(true);

    try {
      await addDoc(collection(db, "messages"), {
        senderId: user.uid,
        receiverId: "admin",
        senderName: profile?.name,
        content: newMessage,
        timestamp: getCurrentIST(),
        isRead: false
      });
      setNewMessage("");
    } catch (err) {
      console.error(err);
    } finally {
      setSendingMessage(false);
    }
  };

  const downloadAdmitCard = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("EduNexus - Admit Card", 105, 20, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`Student Name: ${profile?.name}`, 20, 40);
    doc.text(`Enrollment ID: ${profile?.enrollmentId || "N/A"}`, 20, 50);
    doc.text(`Exam: Semester Finals 2026`, 20, 60);

    autoTable(doc, {
      startY: 70,
      head: [["Subject", "Date", "Duration"]],
      body: marks.map(m => [m.subject, "TBD", "3 Hours"]),
    });

    doc.save(`Admit_Card_${profile?.name}.pdf`);
  };

  const handlePayFee = async (fee: any) => {
    if (!user) return;
    const transactionId = `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    
    await updateDoc(doc(db, "fees", fee.id), {
      status: "paid",
      paidAt: getCurrentIST(),
      transactionId: transactionId
    });
    
    alert(`Payment successful! Transaction ID: ${transactionId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header Widget */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8 card bg-brand-sidebar border-l-4 border-l-brand-accent flex flex-col justify-between overflow-hidden relative">
          <div className="z-10">
            <div className="card-title">Academic Identity</div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">Authenticated: {profile?.name}</h1>
            <p className="text-brand-muted text-[11px] mb-4 uppercase tracking-widest font-mono">Status: Session_Live // No_Alerts</p>
            <button 
              onClick={submitAttendance}
              className="px-4 py-1.5 bg-brand-accent text-brand-bg font-bold rounded text-xs hover:opacity-90 transition-all uppercase"
            >
              Log Daily Attendance
            </button>
          </div>
          <Calendar className="absolute -bottom-6 -right-6 w-32 h-32 text-brand-accent opacity-5" />
        </div>

        <div className="col-span-12 lg:col-span-4 card space-y-3">
          <div className="card-title">Quick Stats</div>
          <div className="space-y-2 text-[11px]">
            <div className="flex justify-between border-b border-brand-border/30 pb-1">
              <span className="text-brand-muted">Enrollment ID</span>
              <span className="font-mono text-brand-accent">{profile?.enrollmentId || "N/A"}</span>
            </div>
            <div className="flex justify-between border-b border-brand-border/30 pb-1">
              <span className="text-brand-muted">Attendance Rate</span>
              <span className="font-bold text-green-500">
                {Math.round((attendance.filter(a => a.status === 'approved').length / (attendance.length || 1)) * 100)}%
              </span>
            </div>
          </div>
          <button 
            onClick={downloadAdmitCard}
            className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-1.5 border border-brand-border rounded text-[11px] font-bold hover:bg-brand-sidebar transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Admit Card (PDF)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Marks Section */}
        <div className="col-span-12 lg:col-span-6 card">
          <div className="card-title">
            <span>Subject Performance</span>
            <Award className="w-4 h-4 text-brand-accent" />
          </div>
          <div className="space-y-2">
            {marks.length === 0 ? (
              <p className="text-brand-muted text-center py-4 text-[11px]">Awaiting assessment data...</p>
            ) : marks.map(m => (
              <div key={m.id} className="flex items-center justify-between p-3 bg-brand-sidebar/40 border border-brand-border/50 rounded">
                <div>
                  <p className="font-bold text-xs uppercase tracking-tight">{m.subject}</p>
                  <p className="text-[10px] text-brand-muted font-mono">{m.updatedAt}</p>
                </div>
                <div className="text-xl font-black text-brand-accent italic">
                  {m.score}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fees Section */}
        <div className="col-span-12 lg:col-span-6 card">
          <div className="card-title">
            <span>Financial Status</span>
            <CreditCard className="w-4 h-4 text-green-500" />
          </div>
          <div className="space-y-2">
            {fees.length === 0 ? (
              <p className="text-brand-muted text-center py-4 text-[11px]">No active billing cycles.</p>
            ) : fees.map(f => (
              <div key={f.id} className="flex items-center justify-between p-3 bg-brand-sidebar/40 border border-brand-border/50 rounded">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded",
                    f.status === 'paid' ? "bg-green-500/10 text-green-500" : "bg-orange-500/10 text-orange-500"
                  )}>
                    {f.status === 'paid' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="font-bold text-xs uppercase">{f.type}</p>
                    <p className="text-[10px] font-bold text-brand-accent italic">${f.amount} USD</p>
                  </div>
                </div>
                {f.status !== 'paid' ? (
                  <button 
                    onClick={() => handlePayFee(f)}
                    className="px-3 py-1 bg-brand-accent text-brand-bg rounded text-[10px] font-black uppercase tracking-widest hover:opacity-90"
                  >
                    Authorize
                  </button>
                ) : (
                  <div className="text-right">
                    <p className="text-[9px] text-green-500 font-black uppercase">Cleared</p>
                    <p className="text-[9px] text-brand-muted font-mono uppercase">{f.transactionId}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Messages Section */}
      <div className="card flex flex-col h-[400px]">
        <div className="card-title">
          <span>Encrypted Message Terminal</span>
          <MessageSquare className="w-4 h-4 text-purple-500" />
        </div>
        <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-2 custom-scrollbar font-mono text-[11px]">
          {messages.length === 0 ? (
            <p className="text-brand-muted text-center py-8 opacity-50 uppercase tracking-widest">[No terminal logs found]</p>
          ) : messages.map(msg => (
            <div key={msg.id} className={cn(
              "max-w-[85%] p-3 border shadow-sm",
              msg.senderId === user?.uid 
                ? "ml-auto bg-brand-accent/5 border-brand-accent/20 text-brand-text" 
                : "mr-auto bg-brand-sidebar border-brand-border text-brand-muted"
            )}>
              <p className="leading-tight">{msg.content}</p>
              <p className="text-[9px] mt-2 opacity-50 uppercase">
                {msg.timestamp}
              </p>
            </div>
          ))}
        </div>
        <form onSubmit={handleSendMessage} className="relative">
          <input
            type="text"
            placeholder="Type message and press enter..."
            className="w-full pl-3 pr-10 py-2.5 bg-brand-sidebar border border-brand-border rounded text-[11px] outline-none focus:border-brand-accent/50 placeholder:text-brand-muted/50"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button 
            disabled={sendingMessage}
            className="absolute right-2 top-2 p-1 text-brand-accent hover:text-brand-text transition-colors disabled:opacity-30"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
