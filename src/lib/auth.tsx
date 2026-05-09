import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser, signOut } from "firebase/auth";
import { doc, onSnapshot, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { v4 as uuidv4 } from "uuid";
import { getCurrentIST } from "./utils";

interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: "admin" | "student";
  currentSessionId?: string;
  enrollmentId?: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [localSessionId] = useState(() => uuidv4());

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Enforce single session on login
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          // Initialize student profile if new
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
            name: firebaseUser.displayName || "New Student",
            role: "student",
            currentSessionId: localSessionId,
          };
          await setDoc(userDocRef, {
            ...newProfile,
            createdAt: getCurrentIST(),
            lastLoginAt: getCurrentIST(),
          });
        } else {
          // Update session ID
          await updateDoc(userDocRef, {
            currentSessionId: localSessionId,
            lastLoginAt: getCurrentIST(),
          });
        }

        // Listen for session changes (for single session enforcement)
        const unsubscribeProfile = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data() as UserProfile;
            setProfile(data);
            
            // Check if another session logged in
            if (data.currentSessionId && data.currentSessionId !== localSessionId) {
              logout();
              alert("Logged out: Your account is signed in on another device.");
            }
          }
        });

        return () => unsubscribeProfile();
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, [localSessionId]);

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
