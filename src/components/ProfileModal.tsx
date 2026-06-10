import React, { useState, useEffect } from "react";
import { useAuth } from "../lib/auth";
import { X, Camera, Phone, User as UserIcon, Loader2, Building, Hash, Layers, GraduationCap, ShieldCheck, Lock, Eye, EyeOff, KeyRound } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { useNavigate } from "react-router-dom";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type Tab = "profile" | "password";

export default function ProfileModal({ isOpen, onClose, onSuccess }: ProfileModalProps) {
  const { user, profile, updateProfileContext, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  // ── Profile State ────────────────────────────────────────────
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [department, setDepartment] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [semester, setSemester] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [availableDepartments, setAvailableDepartments] = useState<string[]>([]);

  // ── Password State ───────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMessage, setPwdMessage] = useState("");

  // Reset on open
  useEffect(() => {
    if (isOpen && profile) {
      setName(profile.name || "");
      setPhoneNumber(profile.phoneNumber || "");
      setProfilePicture(profile.profilePicture || "");
      setDepartment(profile.department || "");
      setRollNo(profile.rollNo || "");
      setSemester(profile.semester || "");
      setCollegeName(profile.collegeName || "");
      setMessage("");
      // Reset password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPwdMessage("");
      setActiveTab("profile");
    }
  }, [isOpen, profile]);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/tenant/departments", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAvailableDepartments(data.departments || []);
        }
      } catch (err) { console.error(err); }
    };
    if (isOpen) fetchDepts();
  }, [isOpen]);

  // ── Handlers ─────────────────────────────────────────────────
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, phoneNumber: phoneNumber || "", profilePicture: profilePicture || "", department: department || "", rollNo: rollNo || "", semester: semester || "", collegeName: collegeName || "" })
      });

      let data;
      const text = await res.text();
      try { data = JSON.parse(text); } catch { data = { error: `Server Error (${res.status})` }; }

      if (res.ok) {
        updateProfileContext(data.user);
        setMessage("✓ Profile updated successfully!");
        if (onSuccess) onSuccess();
        setTimeout(() => { onClose(); setMessage(""); }, 1500);
      } else {
        setMessage(data.error || "Update failed. Please try again.");
      }
    } catch (err) {
      setMessage("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMessage("");

    if (newPassword !== confirmPassword) {
      setPwdMessage("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setPwdMessage("New password must be at least 8 characters.");
      return;
    }

    setPwdLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();

      if (res.ok) {
        setPwdMessage("✓ " + data.message);
        // Auto-logout after 2 seconds so user must re-login with new password
        setTimeout(async () => {
          await logout();
          navigate("/login");
        }, 2000);
      } else {
        setPwdMessage(data.error || "Failed to update password.");
      }
    } catch {
      setPwdMessage("Network error. Please check your connection.");
    } finally {
      setPwdLoading(false);
    }
  };

  const pwdStrength = (pwd: string) => {
    if (!pwd) return null;
    if (pwd.length < 6) return { label: "Too Short", color: "rose" };
    if (pwd.length < 8) return { label: "Weak", color: "amber" };
    if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) return { label: "Strong", color: "emerald" };
    if (/[A-Z]/.test(pwd) || /[0-9]/.test(pwd)) return { label: "Medium", color: "sky" };
    return { label: "Weak", color: "amber" };
  };
  const strength = pwdStrength(newPassword);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-sky-900/40 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-white/20"
          >
            {/* Modal Header */}
            <div className="relative p-10 pb-6 bg-sky-500 text-white overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl pointer-events-none -z-1" />
               
               <button 
                onClick={onClose}
                className="absolute top-8 right-8 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all group"
               >
                 <X className="w-5 h-5 text-white/70 group-hover:text-white" />
               </button>

               <div className="flex items-center gap-2 px-3 py-1 bg-white/20 text-white rounded-lg text-[9px] font-black uppercase tracking-[0.2em] mb-4 w-fit border border-white/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Account Settings
               </div>
               
               <h2 className="text-3xl font-black italic uppercase tracking-tighter">Manage_<span className="text-teal-200">Account</span></h2>
               <p className="text-[10px] text-white/70 mt-2 font-bold uppercase tracking-widest">// Update your profile or change your password</p>

               {/* Tabs */}
               <div className="flex gap-2 mt-6">
                 <button
                   onClick={() => setActiveTab("profile")}
                   className={cn(
                     "flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all",
                     activeTab === "profile"
                       ? "bg-white text-sky-600 shadow-lg"
                       : "bg-white/15 text-white/70 hover:bg-white/25"
                   )}
                 >
                   <UserIcon className="w-3 h-3" />
                   Edit Profile
                 </button>
                 <button
                   onClick={() => setActiveTab("password")}
                   className={cn(
                     "flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all",
                     activeTab === "password"
                       ? "bg-white text-sky-600 shadow-lg"
                       : "bg-white/15 text-white/70 hover:bg-white/25"
                   )}
                 >
                   <Lock className="w-3 h-3" />
                   Change Password
                 </button>
               </div>
            </div>

            {/* ── Profile Tab ─────────────────────────────────────────── */}
            <AnimatePresence mode="wait">
              {activeTab === "profile" && (
                <motion.form
                  key="profile"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleProfileSubmit}
                  className="p-10 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar bg-slate-50/50"
                >
                  {/* Profile Picture Preview */}
                  <div className="flex justify-center mb-4">
                     <div className="relative group">
                        <div className="w-32 h-32 rounded-[2.5rem] bg-white border-4 border-white shadow-xl overflow-hidden relative">
                           {profilePicture ? (
                              <img src={profilePicture} alt="Avatar" className="w-full h-full object-cover" />
                           ) : (
                              <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                                 <UserIcon className="w-12 h-12" />
                              </div>
                           )}
                        </div>
                        <div className="absolute -bottom-2 -right-2 p-3 bg-teal-500 text-white rounded-2xl shadow-lg border-4 border-white group-hover:scale-110 transition-transform cursor-pointer">
                           <Camera className="w-4 h-4" />
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] ml-1">Full Name</label>
                      <div className="relative group">
                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                        <input
                          type="text" required
                          className="premium-input !pl-12 !py-4"
                          placeholder="Enter your full name"
                          value={name} onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] ml-1">Phone Number</label>
                      <div className="relative group">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                        <input
                          type="tel"
                          className="premium-input !pl-12 !py-4"
                          placeholder="+91 XXXXXXXXXX"
                          value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">Institution</label>
                      {profile?.role === "student" && profile?.collegeName && <ShieldCheck className="w-3 h-3 text-emerald-500" />}
                    </div>
                    <div className="relative group">
                      <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                      <input
                        type="text"
                        className={cn(
                          "premium-input !pl-12 !py-4",
                          profile?.role === "student" && profile?.collegeName && "cursor-not-allowed opacity-75 grayscale-[0.5]"
                        )}
                        placeholder="College / University"
                        value={collegeName} 
                        onChange={(e) => setCollegeName(e.target.value)}
                        disabled={profile?.role === "student" && !!profile?.collegeName}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between ml-1">
                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">Department</label>
                        {profile?.role === "student" && profile?.department && <ShieldCheck className="w-3 h-3 text-emerald-500" />}
                      </div>
                      <div className="relative group">
                        <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-sky-500 transition-colors pointer-events-none" />
                          <select
                            className={cn(
                              "premium-input !pl-12 !py-4 appearance-none w-full bg-white",
                              profile?.role === "student" && profile?.department ? "cursor-not-allowed opacity-75 grayscale-[0.5]" : "cursor-pointer"
                            )}
                            value={department} 
                            onChange={(e) => setDepartment(e.target.value)}
                            disabled={profile?.role === "student" && !!profile?.department}
                          >
                             <option value="">Select Department</option>
                             {availableDepartments.length > 0 ? (
                               availableDepartments.map(dept => (
                                 <option key={dept} value={dept}>{dept}</option>
                               ))
                             ) : (
                               <>
                                 {department && <option value={department}>{department}</option>}
                                 <option value="GENERAL">GENERAL</option>
                                 <option value="CSE">CSE</option>
                                 <option value="ECE">ECE</option>
                                 <option value="ME">ME</option>
                                 <option value="CE">CE</option>
                               </>
                             )}
                          </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between ml-1">
                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">Roll No.</label>
                        {profile?.role === "student" && profile?.rollNo && <ShieldCheck className="w-3 h-3 text-emerald-500" />}
                      </div>
                      <div className="relative group">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                        <input
                          type="text"
                          className={cn(
                            "premium-input !pl-12 !py-4",
                            profile?.role === "student" && profile?.rollNo && "cursor-not-allowed opacity-75 grayscale-[0.5]"
                          )}
                          placeholder="Roll Number"
                          value={rollNo} 
                          onChange={(e) => setRollNo(e.target.value)}
                          disabled={profile?.role === "student" && !!profile?.rollNo}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between ml-1">
                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">Semester</label>
                        {profile?.role === "student" && profile?.semester && <ShieldCheck className="w-3 h-3 text-emerald-500" />}
                      </div>
                      <select
                        className={cn(
                          "premium-input !py-4 appearance-none w-full bg-white text-center",
                          profile?.role === "student" && profile?.semester ? "cursor-not-allowed opacity-75 grayscale-[0.5]" : "cursor-pointer"
                        )}
                        value={semester} 
                        onChange={(e) => setSemester(e.target.value)}
                        disabled={profile?.role === "student" && !!profile?.semester}
                      >
                         <option value="">Semester</option>
                         {[1,2,3,4,5,6,7,8].map(s => (
                           <option key={s} value={s.toString()}>Sem {s}</option>
                         ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] ml-1">Profile Photo</label>
                    <div className="relative group">
                      <div className="premium-input !pl-12 !py-0 flex items-center h-[58px]">
                        <Camera className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                        <input
                          type="file"
                          accept="image/*"
                          className="opacity-0 absolute inset-0 cursor-pointer w-full h-full z-10"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const img = new Image();
                                img.onload = () => {
                                  const canvas = document.createElement('canvas');
                                  const MAX_WIDTH = 800, MAX_HEIGHT = 800;
                                  let width = img.width, height = img.height;
                                  if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } }
                                  else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
                                  canvas.width = width; canvas.height = height;
                                  const ctx = canvas.getContext('2d');
                                  ctx?.drawImage(img, 0, 0, width, height);
                                  setProfilePicture(canvas.toDataURL('image/jpeg', 0.7));
                                };
                                img.src = event.target?.result as string;
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[200px]">
                          {profilePicture && profilePicture.startsWith('data:') ? '✓ Image ready to upload' : 'Click to select image...'}
                        </span>
                        <button type="button" className="ml-auto px-4 py-1.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-sky-600 transition-all z-20">
                          Browse
                        </button>
                      </div>
                    </div>
                  </div>

                  {message && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "p-4 rounded-2xl text-[11px] font-bold text-center border",
                        message.startsWith("✓")
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700" 
                          : "bg-rose-500/10 border-rose-500/20 text-rose-600"
                      )}
                    >
                      {message}
                    </motion.div>
                  )}

                  <div className="pt-4">
                     <button
                      type="submit" disabled={loading}
                      className="w-full flex items-center justify-center gap-3 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-black py-5 rounded-[2rem] text-[11px] transition-all active:scale-[0.98] shadow-2xl shadow-sky-200 uppercase tracking-[0.3em]"
                     >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
                     </button>
                  </div>
                </motion.form>
              )}

              {/* ── Password Tab ────────────────────────────────────────── */}
              {activeTab === "password" && (
                <motion.form
                  key="password"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handlePasswordSubmit}
                  className="p-10 space-y-6 bg-slate-50/50"
                >
                  {/* Info Banner */}
                  <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                    <KeyRound className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">Security Notice</p>
                      <p className="text-[11px] text-amber-700 mt-0.5">After changing your password, you will be logged out automatically and must sign in again with the new password.</p>
                    </div>
                  </div>

                  {/* Current Password */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] ml-1">Current Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                      <input
                        type={showCurrent ? "text" : "password"}
                        required
                        className="premium-input !pl-12 !pr-12 !py-4"
                        placeholder="Enter current password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent(v => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-500 transition-colors"
                      >
                        {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] ml-1">New Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                      <input
                        type={showNew ? "text" : "password"}
                        required
                        className="premium-input !pl-12 !pr-12 !py-4"
                        placeholder="Min. 8 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(v => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-500 transition-colors"
                      >
                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {/* Strength Indicator */}
                    {strength && (
                      <div className="flex items-center gap-2 ml-1">
                        <div className="flex gap-1">
                          {["rose","amber","sky","emerald"].map((c, i) => (
                            <div
                              key={c}
                              className={cn(
                                "h-1 w-8 rounded-full transition-all",
                                strength.color === "rose" && i === 0 ? "bg-rose-400" :
                                strength.color === "amber" && i <= 1 ? "bg-amber-400" :
                                strength.color === "sky" && i <= 2 ? "bg-sky-400" :
                                strength.color === "emerald" ? "bg-emerald-400" :
                                "bg-slate-200"
                              )}
                            />
                          ))}
                        </div>
                        <span className={`text-[10px] font-bold text-${strength.color}-500 uppercase tracking-widest`}>
                          {strength.label}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] ml-1">Confirm New Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                      <input
                        type={showConfirm ? "text" : "password"}
                        required
                        className={cn(
                          "premium-input !pl-12 !pr-12 !py-4 transition-all",
                          confirmPassword && newPassword !== confirmPassword && "!border-rose-400 !ring-rose-100",
                          confirmPassword && newPassword === confirmPassword && newPassword && "!border-emerald-400 !ring-emerald-100"
                        )}
                        placeholder="Re-enter new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(v => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-500 transition-colors"
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-[10px] text-rose-500 font-bold ml-1">Passwords do not match</p>
                    )}
                    {confirmPassword && newPassword === confirmPassword && newPassword && (
                      <p className="text-[10px] text-emerald-600 font-bold ml-1">✓ Passwords match</p>
                    )}
                  </div>

                  {pwdMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "p-4 rounded-2xl text-[11px] font-bold text-center border",
                        pwdMessage.startsWith("✓")
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700"
                          : "bg-rose-500/10 border-rose-500/20 text-rose-600"
                      )}
                    >
                      {pwdMessage}
                      {pwdMessage.startsWith("✓") && (
                        <p className="text-[10px] mt-1 opacity-70">Redirecting to login...</p>
                      )}
                    </motion.div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={pwdLoading || !currentPassword || !newPassword || newPassword !== confirmPassword}
                      className="w-full flex items-center justify-center gap-3 bg-rose-500 hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-5 rounded-[2rem] text-[11px] transition-all active:scale-[0.98] shadow-2xl shadow-rose-200 uppercase tracking-[0.3em]"
                    >
                      {pwdLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Lock className="w-4 h-4" /> Update Password</>}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
