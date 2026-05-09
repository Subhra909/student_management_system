import { HelpCircle, ChevronRight, MessageSquare, FileText, Shield } from "lucide-react";

export default function Help() {
  const faqs = [
    { q: "Session Expired?", a: "EduNexus enforces single session. Logging in elsewhere terminates active tokens." },
    { q: "Attendance Update?", a: "Requests require manual admin verification. Status updates are real-time." },
    { q: "IST Precision?", a: "Database strictly uses UTC+5:30. Client displays are calculated accordingly." },
  ];

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HelpCircle className="w-6 h-6 text-brand-accent" />
          <h1 className="text-2xl font-black uppercase tracking-tighter">Support Terminal</h1>
        </div>
        <span className="badge-security border border-brand-accent/30 text-brand-accent text-[9px] px-2 py-0.5 rounded font-mono uppercase">V_ONLINE</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="card">
          <div className="card-title">Documentation</div>
          <div className="space-y-3">
            {[
              { title: "User Protocol", icon: FileText },
              { title: "Security Whitepaper", icon: Shield },
              { title: "API Reference", icon: MessageSquare }
            ].map(doc => (
              <button key={doc.title} className="w-full flex items-center justify-between p-2.5 bg-brand-sidebar/50 hover:bg-brand-sidebar border border-brand-border rounded text-[11px] group transition-all">
                <div className="flex items-center gap-3">
                  <doc.icon className="w-3.5 h-3.5 text-brand-accent" />
                  <span className="font-medium">{doc.title}</span>
                </div>
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
              </button>
            ))}
          </div>
        </div>

        <div className="card bg-brand-sidebar border-l-4 border-l-brand-accent">
          <div className="card-title">FAQ_MODULE</div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i}>
                <p className="text-[10px] font-bold text-brand-accent uppercase mb-1">{faq.q}</p>
                <p className="text-[10px] text-brand-muted leading-tight">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card text-center py-8">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full border-2 border-brand-accent border-t-transparent animate-spin flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-brand-accent animate-none" />
          </div>
        </div>
        <h3 className="font-bold text-base mb-2 uppercase tracking-wide">Live Support Interface</h3>
        <p className="text-[11px] text-brand-muted mb-4 max-w-sm mx-auto">Connecting to the nearest available system administrator for direct assistance...</p>
        <button className="px-6 py-2 bg-brand-accent text-brand-bg rounded font-black text-xs uppercase tracking-widest hover:opacity-90">Open Channel</button>
      </div>
    </div>
  );
}
