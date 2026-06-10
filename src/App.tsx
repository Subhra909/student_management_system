import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import Layout from "./components/Layout";
import NotFound from "./pages/NotFound";
import { motion, AnimatePresence } from "motion/react";

const ProtectedRoute = ({ children, role }: { children: React.ReactNode; role?: "superadmin" | "admin" | "student" }) => {
  const { user, profile, loading } = useAuth();

  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-brand-bg">
    <div className="w-12 h-12 rounded-[1.5rem] border-4 border-sky-100 border-t-sky-600 animate-spin" />
  </div>;
  if (!user) return <Navigate to="/login" />;
  
  if (role) {
    if (role === "admin" && profile?.role === "superadmin") return <>{children}</>; // Super Admin can see Admin pages
    if (profile?.role !== role) return <Navigate to="/" />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { profile } = useAuth();
  
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<Layout />}>
          <Route path="/" element={
            <ProtectedRoute>
              {profile?.role === "superadmin" ? <SuperAdminDashboard /> : 
               profile?.role === "admin" ? <AdminDashboard /> : <StudentDashboard />}
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              {profile?.role === "superadmin" ? <SuperAdminDashboard /> : 
               profile?.role === "admin" ? <AdminDashboard /> : <StudentDashboard />}
            </ProtectedRoute>
          } />

          <Route path="/superadmin" element={
            <ProtectedRoute role="superadmin">
              <SuperAdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />

          
          
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

