import React, { useState } from "react";
import { auth, db } from "../lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { BookOpen, Mail, Lock, User, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
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
    role: "student" as "student" | "admin"
  });

  const validatePassword = (pass: string) => {
    const minLength = 8;
    const hasNumber = /\d/.test(pass);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    return pass.length >= minLength && hasNumber && hasSpecial;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isRegister) {
        if (!validatePassword(formData.password)) {
          throw new Error("Password must be at least 8 characters long and contain at least one number and one special character.");
        }

        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: formData.name });

        // Create user document
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: formData.email,
          name: formData.name,
          role: formData.role,
          createdAt: getCurrentIST(),
          lastLoginAt: getCurrentIST(),
        });
      } else {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      }
      navigate("/");
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex">
      {/* Hero Section (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-5/12 bg-brand-sidebar border-r border-brand-border p-12 flex-col justify-between text-brand-text relative overflow-hidden">
        <div className="z-10">
          <div className="flex items-center gap-2 mb-12">
            <div className="bg-brand-accent p-1.5 rounded">
              <BookOpen className="w-5 h-5 text-brand-bg" />
            </div>
            <span className="text-xl font-black uppercase tracking-tighter text-brand-accent">EduNexus</span>
          </div>
          <h1 className="text-5xl font-black leading-none tracking-tighter mb-6 uppercase italic">
            Precision <br />
            Academic <br />
            Management.
          </h1>
          <p className="text-brand-muted text-sm font-mono leading-relaxed max-w-xs border-l-2 border-brand-accent pl-4">
            High-integrity interface for modern educational institutions. Real-time synchronization. Single session enforcement.
          </p>
        </div>
        
        <div className="mt-auto space-y-2">
          <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-brand-muted">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
             System Status: Online
          </div>
          <div className="text-[10px] font-mono text-brand-muted opacity-50">
            Build Hash: 0x4f2a91b...
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-brand-accent rounded-full blur-3xl opacity-5" />
      </div>

      {/* Form Section */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-8 bg-brand-bg relative">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-brand-text mb-2 italic">
              {isRegister ? "Initial_Setup" : "Auth_Access"}
            </h2>
            <p className="text-brand-muted font-mono text-[11px] uppercase tracking-wider">
              {isRegister ? "// Create new identity record" : "// Validate authorization credentials"}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <AnimatePresence mode="popLayout">
              {isRegister && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-4 pt-2"
                >
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-brand-muted tracking-widest ml-1">Identity Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-muted">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="text"
                        required
                        className="block w-full pl-9 pr-3 py-2 bg-brand-sidebar border border-brand-border rounded text-xs outline-none focus:border-brand-accent/50 transition-all font-mono"
                        placeholder="SURNAME_FORENAME"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: "student" })}
                      className={cn(
                        "py-2 rounded border text-[10px] font-black uppercase tracking-widest transition-all",
                        formData.role === "student" 
                          ? "bg-brand-accent border-brand-accent text-brand-bg" 
                          : "bg-brand-sidebar border-brand-border text-brand-muted hover:border-brand-accent/50"
                      )}
                    >
                      Student_Type
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: "admin" })}
                      className={cn(
                        "py-2 rounded border text-[10px] font-black uppercase tracking-widest transition-all",
                        formData.role === "admin" 
                          ? "bg-brand-accent border-brand-accent text-brand-bg" 
                          : "bg-brand-sidebar border-brand-border text-brand-muted hover:border-brand-accent/50"
                      )}
                    >
                      Admin_Type
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-brand-muted tracking-widest ml-1">Registry Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-muted">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <input
                  type="email"
                  required
                  className="block w-full pl-9 pr-3 py-2 bg-brand-sidebar border border-brand-border rounded text-xs outline-none focus:border-brand-accent/50 transition-all font-mono"
                  placeholder="USER@EDUNEXUS.SYS"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-brand-muted tracking-widest ml-1">Access Cipher</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-muted">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input
                  type="password"
                  required
                  className="block w-full pl-9 pr-3 py-2 bg-brand-sidebar border border-brand-border rounded text-xs outline-none focus:border-brand-accent/50 transition-all font-mono"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-2 bg-red-500/10 text-red-500 rounded border border-red-500/20 text-[10px] font-mono italic">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-brand-accent hover:opacity-90 disabled:opacity-30 text-brand-bg font-black py-2.5 rounded text-[11px] uppercase tracking-[0.2em] transition-all active:scale-[0.98] mt-6"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isRegister ? "Execute_Registration" : "Initialize_Session")}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-brand-border text-center">
            <p className="text-[10px] uppercase font-bold text-brand-muted tracking-widest">
              {isRegister ? "Identity already logged?" : "New user registration?"}{" "}
              <button
                onClick={() => setIsRegister(!isRegister)}
                className="text-brand-accent hover:underline decoration-brand-accent underline-offset-4 ml-1"
              >
                {isRegister ? "[Sign_In]" : "[Register]"}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
