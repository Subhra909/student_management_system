import { Link } from "react-router-dom";
import { BookOpen, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-8 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="space-y-8"
      >
        <div className="flex justify-center mb-8">
          <BookOpen className="w-16 h-16 text-blue-600" />
        </div>
        <div>
          <h1 className="text-9xl font-black text-blue-600/10 dark:text-blue-500/10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none z-0">404</h1>
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4 relative z-10">Lost in the halls?</h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto relative z-10 leading-relaxed">
            The page you're looking for doesn't exist or has been moved to a different department.
          </p>
        </div>
        <div className="relative z-10">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
