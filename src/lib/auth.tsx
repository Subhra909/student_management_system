import React, { createContext, useContext, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

interface UserProfile {
  uid: string;
  tenantId: string;
  email: string;
  name: string;
  role: "admin" | "student" | "superadmin";
  currentSessionId?: string;
  enrollmentId?: string;
  phoneNumber?: string;
  profilePicture?: string;
  department?: string;
  rollNo?: string;
  section?: string;
  semester?: string;
  collegeName?: string;
  collegeSlug?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
  updateProfileContext: (updates: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  login: () => {},
  logout: () => {},
  updateProfileContext: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setProfile(data.user);
        } else {
          // Token invalid or session expired
          localStorage.removeItem("token");
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error("Auth check failed", err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (token: string, userData: UserProfile) => {
    localStorage.setItem("token", token);
    setUser(userData);
    setProfile(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setProfile(null);
  };

  const updateProfileContext = (updates: Partial<UserProfile>) => {
    setProfile((prev) => prev ? { ...prev, ...updates } : null);
    setUser((prev) => prev ? { ...prev, ...updates } : null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, updateProfileContext }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
