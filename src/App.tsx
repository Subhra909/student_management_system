/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Layout from "./components/Layout";
import About from "./pages/About";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";
import { motion, AnimatePresence } from "motion/react";

const ProtectedRoute = ({ children, role }: { children: React.ReactNode; role?: "admin" | "student" }) => {
  const { user, profile, loading } = useAuth();

  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>;
  if (!user) return <Navigate to="/login" />;
  if (role && profile?.role !== role) return <Navigate to="/" />;

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
              {profile?.role === "admin" ? <AdminDashboard /> : <StudentDashboard />}
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              {profile?.role === "admin" ? <AdminDashboard /> : <StudentDashboard />}
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/about" element={<About />} />
          <Route path="/help" element={<Help />} />
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

