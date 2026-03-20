import React, { useState, useEffect } from "react";
import { X, LogOut, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ref, get, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import AdminPanel from "./AdminPanel";

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

interface Purchase {
  productId: string;
  productTitle: string;
  price: number;
  purchasedAt: number;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ open, onClose }) => {
  const { user, isAdmin, logout } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    if (!user) return;
    const purchasesRef = ref(db, `purchases/${user.uid}`);
    const unsub = onValue(purchasesRef, (snap) => {
      const data = snap.val();
      if (data) {
        setPurchases(Object.values(data));
      }
    });
    return () => unsub();
  }, [user]);

  if (!open || !user) return null;

  if (showAdmin && isAdmin) {
    return <AdminPanel onClose={() => setShowAdmin(false)} />;
  }

  return (
    <div className="fixed inset-0 z-[100] bg-foreground/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-background rounded-2xl w-full max-w-md p-6 relative animate-fade-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground"><X size={20} /></button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto text-2xl font-bold text-foreground">
            {user.displayName?.[0] || user.email?.[0]?.toUpperCase() || "U"}
          </div>
          <p className="text-lg font-semibold text-foreground mt-3">{user.displayName || "User"}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>

        {isAdmin && (
          <button onClick={() => setShowAdmin(true)}
            className="w-full py-3 mb-4 bg-primary text-primary-foreground rounded-lg font-medium text-sm flex items-center justify-center gap-2">
            <Shield size={16} /> Admin Panel
          </button>
        )}

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">Purchase History</h3>
          {purchases.length === 0 ? (
            <p className="text-sm text-muted-foreground">No purchases yet.</p>
          ) : (
            <div className="space-y-2">
              {purchases.map((p, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.productTitle}</p>
                    <p className="text-xs text-muted-foreground">{new Date(p.purchasedAt).toLocaleDateString()}</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground">Rs. {p.price}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button onClick={async () => { await logout(); onClose(); }}
          className="w-full py-3 border border-destructive text-destructive rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-destructive/10 transition-colors">
          <LogOut size={16} /> Log Out
        </button>
      </div>
    </div>
  );
};

export default ProfileModal;
