import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signOut } from "firebase/auth";
import { ref, set, get } from "firebase/database";
import { auth, db, googleProvider, ADMIN_EMAIL } from "@/lib/firebase";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  googleLogin: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | null>(null);
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside provider");
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setIsAdmin(u?.email === ADMIN_EMAIL);
      if (u) {
        const userRef = ref(db, `users/${u.uid}`);
        const snap = await get(userRef);
        if (!snap.exists()) {
          await set(userRef, {
            email: u.email,
            name: u.displayName || "",
            createdAt: Date.now(),
          });
        }
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };
  const signup = async (email: string, password: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await set(ref(db, `users/${cred.user.uid}`), { email, name, createdAt: Date.now() });
  };
  const googleLogin = async () => {
    await signInWithPopup(auth, googleProvider);
  };
  const logout = async () => {
    await signOut(auth);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, login, signup, googleLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
