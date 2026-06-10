import React, { useState, useEffect } from "react";
import { useAuth } from "../lib/auth";
import { X, Camera, Phone, User as UserIcon, Loader2, Building, Hash, Layers, GraduationCap, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ProfileModal({ isOpen, onClose, onSuccess }: ProfileModalProps) {
  const { user, profile, updateProfileContext } = useAuth();
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

  const handleSubmit = async (e: React.FormEvent) => {
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
        body: JSON.stringify({ 
          name, 
          phoneNumber: phoneNumber || "", 
          profilePicture: profilePicture || "", 
          department: department || "", 
          rollNo: rollNo || "", 
          semester: semester || "", 
          collegeName: collegeName || "" 
        })
      });

      let data;
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        console.error("Parse Error:", text);
        data = { error: `Server Error (${res.status}): Internal system error.` };
      }

      if (res.ok) {
        updateProfileContext(data.user);
        setMessage("IDENTITY_SYNCHRONIZED_SUCCESSFULLY");
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
          setMessage("");
        }, 1500);
      } else {
        setMessage(data.error || "SYNC_FAILURE_RETRY");
      }
    } catch (err) {
      console.error(err);
      setMessage("NETWORK_TIMEOUT_CHECK_LINK");
    } finally {
      setLoading(false);
    }
  };

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
            <div className="relative p-10 bg-sky-500 text-white overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl pointer-events-none -z-1" />
               
               <button 
                onClick={onClose}
                className="absolute top-8 right-8 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all group"
               >
                 <X className="w-5 h-5 text-white/70 group-hover:text-white" />
               </button>

               <div className="flex items-center gap-2 px-3 py-1 bg-white/20 text-white rounded-lg text-[9px] font-black uppercase tracking-[0.2em] mb-4 w-fit border border-white/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Authorized_Data_Override
               </div>
               
               <h2 className="text-3xl font-black italic uppercase tracking-tighter">Configure_<span className="text-teal-200">Identity</span></h2>
               <p className="text-[10px] text-white/70 mt-2 font-bold uppercase tracking-widest">// Modify your centralized academic signature</p>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar bg-slate-50/50">
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
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] ml-1">Assigned_Name</label>
                    <div className="relative group">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                      <input
                        type="text" required
                        className="premium-input !pl-12 !py-4"
                        placeholder="ENTER_FULL_NAME"
                        value={name} onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] ml-1">Contact_Line</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                      <input
                        type="tel"
                        className="premium-input !pl-12 !py-4"
                        placeholder="+91_MOBILE_ADDR"
                        value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">Institutional_Entity</label>
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
                      placeholder="ENTER_COLLEGE_UNIVERSITY"
                      value={collegeName} 
                      onChange={(e) => setCollegeName(e.target.value)}
                      disabled={profile?.role === "student" && !!profile?.collegeName}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between ml-1">
                      <label className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">Dept_Node</label>
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
                           <option value="">SELECT_DEPARTMENT</option>
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
                      <label className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">Registry_UID</label>
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
                        placeholder="ROLL_NUMBER"
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
                       <option value="">SELECT_SEM</option>
                       {[1,2,3,4,5,6,7,8].map(s => (
                         <option key={s} value={s.toString()}>SEM {s}</option>
                       ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] ml-1">Profile_Image_Entity</label>
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
                                const MAX_WIDTH = 800;
                                const MAX_HEIGHT = 800;
                                let width = img.width;
                                let height = img.height;

                                if (width > height) {
                                  if (width > MAX_WIDTH) {
                                    height *= MAX_WIDTH / width;
                                    width = MAX_WIDTH;
                                  }
                                } else {
                                  if (height > MAX_HEIGHT) {
                                    width *= MAX_HEIGHT / height;
                                    height = MAX_HEIGHT;
                                  }
                                }

                                canvas.width = width;
                                canvas.height = height;
                                const ctx = canvas.getContext('2d');
                                ctx?.drawImage(img, 0, 0, width, height);
                                
                                // Compress to 0.7 quality
                                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                                setProfilePicture(compressedBase64);
                              };
                              img.src = event.target?.result as string;
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[200px]">
                        {profilePicture && profilePicture.startsWith('data:') ? 'IMAGE_LOADED_READY' : 'SELECT_IMAGE_FILE...'}
                      </span>
                      <button type="button" className="ml-auto px-4 py-1.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-sky-600 transition-all z-20">
                        Upload_Node
                      </button>
                    </div>
                  </div>
                </div>

                {message && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "p-4 rounded-2xl text-[10px] font-black text-center border uppercase tracking-widest",
                      message.includes("SUCCESSFULLY") 
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" 
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
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                       <>
                          COMM_SYNCHRONIZE_CHANGES
                       </>
                    )}
                   </button>
                </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
