import { ShieldCheck, Cpu } from "lucide-react";
import { motion } from "motion/react";

export default function About() {
  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-center gap-3">
        <ShieldCheck className="w-6 h-6 text-brand-accent" />
        <h1 className="text-2xl font-black uppercase tracking-tighter">System Blueprint</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="card">
          <div className="card-title">Project Mission</div>
          <p className="text-[11px] leading-relaxed text-brand-muted">
            EduNexus is a high-integrity student management platform engineered for real-time academic tracking and secure session management.
          </p>
        </div>
        <div className="card">
          <div className="card-title">Security Architecture</div>
          <p className="text-[11px] leading-relaxed text-brand-muted">
            Powered by Firebase Auth (Single Session) and Firestore Security Rules. All transactions are logged with IST precision.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Technical Stack</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Frontend", val: "React 19" },
            { label: "State", val: "Firebase" },
            { label: "Styling", val: "Tailwind 4" },
            { label: "Precision", val: "IST/UTC+5:30" }
          ].map(tech => (
            <div key={tech.label} className="p-2 border border-brand-border rounded">
              <p className="text-[9px] uppercase font-bold text-brand-accent mb-0.5">{tech.label}</p>
              <p className="font-mono text-[10px]">{tech.val}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-brand-sidebar/50 border border-brand-border rounded flex items-center justify-between">
           <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-brand-accent" />
              <span className="text-[10px] font-bold uppercase">System Version</span>
           </div>
           <span className="font-mono text-[10px] text-brand-accent">BETA_V1.0.42</span>
        </div>
      </div>
    </div>
  );
}
