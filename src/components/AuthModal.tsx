import React, { useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ open, onClose }) => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, signup, googleLogin } = useAuth();

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await signup(email, password, name);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError("");
    try {
      await googleLogin();
      onClose();
    } catch (err: any) {
      setError(err.message || "Google sign-in failed");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-foreground/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background rounded-2xl w-full max-w-md p-6 relative animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-foreground mb-6">{mode === "login" ? "Log In" : "Sign Up"}</h2>

        {error && <p className="text-destructive text-sm mb-4 bg-destructive/10 p-2 rounded">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <input
              type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-lg text-sm bg-background text-foreground outline-none focus:ring-2 focus:ring-ring"
              required
            />
          )}
          <input
            type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-border rounded-lg text-sm bg-background text-foreground outline-none focus:ring-2 focus:ring-ring"
            required
          />
          <input
            type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-border rounded-lg text-sm bg-background text-foreground outline-none focus:ring-2 focus:ring-ring"
            required minLength={6}
          />
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium text-sm disabled:opacity-50">
            {loading ? "Please wait..." : mode === "login" ? "Log In" : "Create Account"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <button onClick={handleGoogle}
          className="w-full py-3 border border-border rounded-lg text-sm font-medium text-foreground flex items-center justify-center gap-2 hover:bg-muted transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continue with Google
        </button>

        <p className="text-center text-sm text-muted-foreground mt-4">
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
            className="text-foreground font-medium underline">
            {mode === "login" ? "Sign Up" : "Log In"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
