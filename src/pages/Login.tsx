import React, { useState } from "react";
import { useAuth } from "../lib/auth";
import { useNavigate } from "react-router-dom";
import { BookOpen, Mail, Lock, User, ArrowRight, AlertCircle, Loader2, Phone, Building, Hash, Layers, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getCurrentIST, cn } from "../lib/utils";

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    role: "student" as "student" | "admin",
    phoneNumber: "",
    department: "",
    rollNo: "",
    semester: "",
    collegeName: "",
    collegeSlug: ""
  });
  const [departments, setDepartments] = useState<string[]>([]);
  const [collegeLoading, setCollegeLoading] = useState(false);
  const [collegeVerified, setCollegeVerified] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (formData.collegeSlug.length >= 3) {
        setCollegeLoading(true);
        try {
          const res = await fetch(`/api/tenant/${formData.collegeSlug}/departments`);
          if (res.ok) {
            const data = await res.json();
            setDepartments(data.departments || []);
            setCollegeVerified(true);
            if (data.departments?.length > 0 && !data.departments.includes(formData.department)) {
               setFormData(prev => ({ ...prev, department: data.departments[0] }));
            }
          } else {
            setCollegeVerified(false);
            setDepartments([]);
          }
        } catch (err) { 
          console.error(err); 
          setCollegeVerified(false);
        } finally {
          setCollegeLoading(false);
        }
      } else {
        setDepartments([]);
        setCollegeVerified(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.collegeSlug, isRegister]);

  const validatePassword = (pass: string) => {
    const minLength = 8;
    const hasNumber = /\d/.test(pass);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    return pass.length >= minLength && hasNumber && hasSpecial;
  };

  const { login } = useAuth();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isRegister) {
        if (!validatePassword(formData.password)) {
          throw new Error("Password requires 8+ chars, 1 number, and 1 special char.");
        }

        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Registration failed");
        
        login(data.token, data.user);
      } else {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email, password: formData.password })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Login failed");

        login(data.token, data.user);
      }
      navigate("/");
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 40%, #ccfbf1 100%)" }}>

      {/* Animated soft orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-[65%] h-[65%] rounded-full opacity-40 animate-float-slow"
          style={{ background: "radial-gradient(circle, rgba(14,165,233,0.35) 0%, rgba(6,182,212,0.15) 40%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute -bottom-1/4 -right-1/4 w-[55%] h-[55%] rounded-full opacity-35 animate-float"
          style={{ background: "radial-gradient(circle, rgba(52,177,170,0.40) 0%, rgba(242,159,103,0.15) 40%, transparent 70%)", filter: "blur(70px)", animationDelay: "2.5s" }} />
        <div className="absolute top-1/2 right-1/4 w-[30%] h-[30%] rounded-full opacity-25"
          style={{ background: "radial-gradient(circle, rgba(59,143,243,0.35) 0%, transparent 70%)", filter: "blur(50px)" }} />
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.35]"
          style={{ backgroundImage: "radial-gradient(circle, rgba(242,159,103,0.20) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      </div>

      <div className="w-full max-w-5xl grid lg:grid-cols-2 rounded-[2rem] overflow-hidden relative z-10"
        style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(32px)", border: "1px solid rgba(228,228,235,0.70)", boxShadow: "0 32px 80px -16px rgba(30, 30, 44, 0.08), 0 0 0 1px rgba(255,255,255,0.8) inset" }}>

        {/* Left: Branding */}
        <div className="hidden lg:flex flex-col justify-between p-14 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #F29F67 0%, #3B8FF3 55%, #34B1AA 100%)" }}>

          {/* Decorative */}
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full animate-spin-slow opacity-15"
            style={{ background: "conic-gradient(from 0deg, rgba(255,255,255,0.8), rgba(255,255,255,0.1), rgba(255,255,255,0.8))" }} />
          <div className="absolute bottom-0 left-0 right-0 h-48 opacity-10"
            style={{ background: "radial-gradient(ellipse at bottom, rgba(255,255,255,0.6) 0%, transparent 70%)" }} />
          <div className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

          <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}
            className="flex items-center gap-3 z-10">
            <div className="p-2.5 rounded-2xl" style={{ background: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.35)", boxShadow: "0 8px 24px -4px rgba(0,0,0,0.15)" }}>
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black uppercase tracking-tighter text-white italic">EduNexus</span>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7 }} className="z-10">
            <h1 className="text-6xl font-black leading-[0.88] tracking-tighter mb-8 uppercase italic text-white"
              style={{ textShadow: "0 2px 20px rgba(0,0,0,0.12)" }}>
              Campus<br />Connect<br />
              <span style={{ color: "rgba(255,255,255,0.75)" }}>Portal.</span>
            </h1>
            <p className="text-white/75 text-sm font-medium leading-relaxed max-w-sm border-l-2 border-white/30 pl-5">
              Your centralized hub for academic excellence, real-time campus updates, and student life management.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="z-10 space-y-3">
            {[
              { icon: "🔒", text: "End-to-end encrypted sessions" },
              { icon: "⚡", text: "Real-time data synchronization" },
              { icon: "🎓", text: "Multi-institution support" },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.1 }}
                className="flex items-center gap-3 text-[11px] font-bold text-white/70 uppercase tracking-widest">
                <span>{item.icon}</span><span>{item.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Right: Form */}
        <div className="p-8 lg:p-14 flex flex-col justify-center bg-white">
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
            className="w-full max-w-md mx-auto">

            <div className="mb-10">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-3xl font-black uppercase tracking-tighter italic" style={{ color: "#1E1E2C" }}>
                  {isRegister ? "Join Campus" : "Welcome Back"}
                </h2>
                <ShieldCheck className="w-6 h-6 text-sky-400" />
              </div>
              <p className="font-mono text-[11px] uppercase tracking-wider" style={{ color: "#F29F67" }}>
                {isRegister ? "// Creating your student account" : "// Secure access to your academic records"}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <AnimatePresence mode="popLayout">
                {isRegister && (
                  <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-4">
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-300 group-focus-within:text-sky-500 transition-colors" />
                      <input type="text" required placeholder="Full Name" value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full rounded-2xl pl-12 pr-4 py-3.5 text-sm outline-none transition-all"
                        style={{ background: "#f4f4f7", border: "1px solid #e4e4eb", color: "#1E1E2C" }}
                        onFocus={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#F29F67"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(242,159,103,0.12)"; }}
                        onBlur={e => { e.currentTarget.style.background = "#f4f4f7"; e.currentTarget.style.borderColor = "#e4e4eb"; e.currentTarget.style.boxShadow = "none"; }} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative group">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-300 group-focus-within:text-sky-500 transition-colors" />
                        <input type="tel" required placeholder="Mobile" value={formData.phoneNumber}
                          onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                          className="w-full rounded-2xl pl-12 pr-4 py-3.5 text-sm outline-none transition-all"
                          style={{ background: "#f4f4f7", border: "1px solid #e4e4eb", color: "#1E1E2C" }}
                          onFocus={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#F29F67"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(242,159,103,0.12)"; }}
                          onBlur={e => { e.currentTarget.style.background = "#f4f4f7"; e.currentTarget.style.borderColor = "#e4e4eb"; e.currentTarget.style.boxShadow = "none"; }} />
                      </div>
                      <div className="relative group">
                        <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-300 group-focus-within:text-sky-500 transition-colors" />
                        <input type="text" required placeholder="College Code" value={formData.collegeSlug}
                          onChange={(e) => setFormData({ ...formData, collegeSlug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                          className={cn("w-full rounded-2xl pl-12 pr-10 py-3.5 text-sm outline-none transition-all", collegeVerified && "!border-emerald-400")}
                          style={{ background: "#f4f4f7", border: "1px solid #e4e4eb", color: "#1E1E2C" }}
                          onFocus={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#F29F67"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(242,159,103,0.12)"; }}
                          onBlur={e => { e.currentTarget.style.background = "#f4f4f7"; e.currentTarget.style.borderColor = collegeVerified ? "#34d399" : "#e4e4eb"; e.currentTarget.style.boxShadow = "none"; }} />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {collegeLoading ? <Loader2 className="w-3.5 h-3.5 text-sky-400 animate-spin" />
                            : collegeVerified ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> : null}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <select required value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full rounded-2xl px-4 py-3.5 text-xs outline-none appearance-none cursor-pointer"
                        style={{ background: "#f4f4f7", border: "1px solid #e4e4eb", color: "#1E1E2C" }}>
                        <option value="">Dept</option>
                        {departments.map(d => <option key={d} value={d}>{d.toUpperCase()}</option>)}
                        {!departments.length && <option value="GENERAL">GENERAL</option>}
                      </select>
                      <input type="text" required placeholder="Roll No" value={formData.rollNo}
                        onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                        className="w-full rounded-2xl px-4 py-3.5 text-xs outline-none transition-all"
                        style={{ background: "#f4f4f7", border: "1px solid #e4e4eb", color: "#1E1E2C" }}
                        onFocus={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#F29F67"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(242,159,103,0.12)"; }}
                        onBlur={e => { e.currentTarget.style.background = "#f4f4f7"; e.currentTarget.style.borderColor = "#e4e4eb"; e.currentTarget.style.boxShadow = "none"; }} />
                      <select required value={formData.semester}
                        onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                        className="w-full rounded-2xl px-4 py-3.5 text-xs outline-none appearance-none cursor-pointer"
                        style={{ background: "#f4f4f7", border: "1px solid #e4e4eb", color: "#1E1E2C" }}>
                        <option value="">Sem</option>
                        {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s.toString()}>{s}</option>)}
                      </select>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-300 group-focus-within:text-sky-500 transition-colors" />
                <input type="email" required placeholder="Email Address" value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-2xl pl-12 pr-4 py-3.5 text-sm outline-none transition-all"
                  style={{ background: "#f4f4f7", border: "1px solid #e4e4eb", color: "#1E1E2C" }}
                  onFocus={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#F29F67"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(242,159,103,0.12)"; }}
                  onBlur={e => { e.currentTarget.style.background = "#f4f4f7"; e.currentTarget.style.borderColor = "#e4e4eb"; e.currentTarget.style.boxShadow = "none"; }} />
              </div>

              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-300 group-focus-within:text-sky-500 transition-colors" />
                <input type="password" required placeholder="Password" value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-2xl pl-12 pr-4 py-3.5 text-sm outline-none transition-all"
                  style={{ background: "#f4f4f7", border: "1px solid #e4e4eb", color: "#1E1E2C" }}
                  onFocus={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#F29F67"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(242,159,103,0.12)"; }}
                  onBlur={e => { e.currentTarget.style.background = "#f4f4f7"; e.currentTarget.style.borderColor = "#e4e4eb"; e.currentTarget.style.boxShadow = "none"; }} />
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-4 rounded-2xl text-xs font-bold"
                  style={{ background: "rgba(244,63,94,0.07)", border: "1px solid rgba(244,63,94,0.18)", color: "#e11d48" }}>
                  <AlertCircle className="w-4 h-4 shrink-0" /><p>{error}</p>
                </motion.div>
              )}

              <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-3 font-black py-4 rounded-2xl text-[11px] uppercase tracking-[0.3em] text-white transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #F29F67, #3B8FF3)", boxShadow: "0 8px 28px -4px rgba(242, 159, 103, 0.4), 0 0 0 1px rgba(255,255,255,0.15) inset" }}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isRegister ? "Create Account" : "Sign In")}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </motion.button>
            </form>

            <div className="mt-8 text-center">
              <button onClick={() => setIsRegister(!isRegister)}
                className="text-sky-400 hover:text-sky-600 transition-colors text-[11px] font-bold uppercase tracking-widest">
                {isRegister ? "Already have an account? Sign in →" : "New here? Create an account →"}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
