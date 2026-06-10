import { Link } from "react-router-dom";
import { ShieldAlert, Zap } from "lucide-react";
import { motion } from "motion/react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-100/20 rounded-full blur-[120px] pointer-events-none -z-10" />
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="mb-12 relative">
           <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-2 border-dashed border-sky-200 rounded-full scale-150 opacity-40" 
           />
           <div className="w-24 h-24 rounded-[2rem] bg-sky-500 flex items-center justify-center shadow-2xl shadow-sky-100">
              <ShieldAlert className="w-10 h-10 text-white" />
           </div>
        </div>

        <div className="mb-12">
          <h1 className="text-[12rem] font-black text-slate-900/5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none tracking-tighter italic">404_ERR</h1>
          <h2 className="text-5xl font-black italic uppercase tracking-tighter text-slate-900 mb-6 leading-none">Lost_In_The_<span className="text-sky-500">Void</span></h2>
          <div className="flex items-center justify-center gap-3 mb-6">
             <div className="px-3 py-1 bg-rose-500/10 text-rose-600 border border-rose-500/20 rounded-lg text-[9px] font-black uppercase tracking-[0.2em]">
                Protocol_Broken
             </div>
             <div className="px-3 py-1 bg-slate-100 text-slate-400 border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-[0.2em]">
                Node_Not_Found
             </div>
          </div>
          <p className="text-slate-500 max-w-md mx-auto leading-relaxed font-medium italic">
            The requested resource node is unreachable or has been purged from the central database. Please re-authenticate or return to the secure dashboard.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link 
            to="/" 
            className="flex items-center gap-3 px-10 py-5 bg-sky-500 text-white font-black rounded-[2rem] shadow-2xl shadow-sky-100 transition-all hover:scale-105 active:scale-95 uppercase tracking-[0.3em] text-[11px]"
          >
            <Zap className="w-4 h-4" />
            Restore_Session
          </Link>
        </div>
        
        <div className="mt-16 flex items-center gap-2 opacity-30 grayscale">
           <div className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
           <div className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
           <div className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
        </div>
      </motion.div>
    </div>
  );
}
