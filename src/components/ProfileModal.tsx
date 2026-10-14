import React, { useState, useEffect } from "react";
import { X, LogOut, Shield, ShieldCheck, Store, Share2, ShoppingBag, Clock, CheckCircle2, XCircle, CreditCard, Wallet } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import AdminPanel from "./AdminPanel";
import SellerVerificationForm from "./SellerVerificationForm";
import AffiliateDashboard from "./AffiliateDashboard";
import PaymentSettingsForm from "./PaymentSettingsForm";
import WalletPanel from "./WalletPanel";
import StoreDashboard from "./StoreDashboard";

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
  const [userData, setUserData] = useState<any>(null);
  const [showVerify, setShowVerify] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [showStore, setShowStore] = useState(false);

  useEffect(() => {
    if (!user) return;
    const u1 = onValue(ref(db, `purchases/${user.uid}`), (snap) => {
      const data = snap.val();
      setPurchases(data ? Object.values(data) : []);
    });
    const u2 = onValue(ref(db, `users/${user.uid}`), (snap) => setUserData(snap.val() || {}));
    return () => { u1(); u2(); };
  }, [user]);

  if (!open || !user) return null;
  if (showAdmin && isAdmin) return <AdminPanel onClose={() => setShowAdmin(false)} />;
  if (showStore) return <StoreDashboard onClose={() => setShowStore(false)} />;

  const role = userData?.role;
  const sellerStatus = userData?.sellerStatus;
  const affiliateStatus = userData?.affiliateStatus;

  const roleLabel = role === "seller" ? "Seller" : role === "affiliate" ? "Affiliate" : role === "buyer" ? "Buyer" : "";
  const roleIcon = role === "seller" ? <Store size={12} /> : role === "affiliate" ? <Share2 size={12} /> : <ShoppingBag size={12} />;

  const showWallet = (role === "seller" && sellerStatus === "approved") || (role === "affiliate" && affiliateStatus === "approved");

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-foreground/50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-background rounded-2xl w-full max-w-md p-6 relative animate-fade-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground"><X size={20} /></button>

          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto text-2xl font-bold text-foreground">
              {user.displayName?.[0] || user.email?.[0]?.toUpperCase() || "U"}
            </div>
            <p className="text-lg font-semibold text-foreground mt-3">{user.displayName || "User"}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            {role && (
              <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-muted rounded-full text-[10px] font-medium text-foreground">
                {roleIcon} {roleLabel}
              </span>
            )}
          </div>

          {isAdmin && (
            <button onClick={() => setShowAdmin(true)}
              className="w-full py-3 mb-4 bg-primary text-primary-foreground rounded-lg font-medium text-sm flex items-center justify-center gap-2">
              <Shield size={16} /> Admin Panel
            </button>
          )}

          {role === "seller" && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Store size={14} /> Seller Zone</h3>
              {sellerStatus === "approved" ? (
                <div className="space-y-2">
                  <div className="bg-primary/10 rounded-lg p-3 flex items-center gap-2 text-sm">
                    <CheckCircle2 size={16} /> <span className="text-foreground">You are a verified seller</span>
                  </div>
                  <button onClick={() => setShowStore(true)}
                    className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium text-sm flex items-center justify-center gap-2">
                    <Store size={14} /> {userData?.storeSlug ? "Manage My Store" : "Create My Store"}
                  </button>
                </div>
              ) : sellerStatus === "pending" ? (
                <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 flex items-center gap-2 text-sm">
                  <Clock size={16} /> <span className="text-foreground">Verification pending review</span>
                </div>
              ) : sellerStatus === "rejected" ? (
                <button onClick={() => setShowVerify(true)}
                  className="w-full py-3 border border-destructive text-destructive rounded-lg font-medium text-sm flex items-center justify-center gap-2">
                  <XCircle size={14} /> View rejection & reapply
                </button>
              ) : (
                <button onClick={() => setShowVerify(true)}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium text-sm flex items-center justify-center gap-2">
                  <ShieldCheck size={14} /> Get Verified
                </button>
              )}
            </div>
          )}

          {role === "affiliate" && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Share2 size={14} /> Affiliate Dashboard</h3>
              <AffiliateDashboard />
            </div>
          )}

          {(role === "seller" || role === "affiliate") && (
            <div className="mb-6 space-y-2">
              <button onClick={() => setShowPay(true)}
                className="w-full py-3 border border-border rounded-lg font-medium text-sm flex items-center justify-center gap-2 text-foreground hover:bg-muted transition-colors">
                <CreditCard size={14} /> Payment Settings
              </button>
            </div>
          )}

          {showWallet && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Wallet size={14} /> Wallet</h3>
              <WalletPanel role={role as "seller" | "affiliate"} onOpenPaymentSettings={() => setShowPay(true)} />
            </div>
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
      <SellerVerificationForm open={showVerify} onClose={() => setShowVerify(false)} />
      <PaymentSettingsForm open={showPay} onClose={() => setShowPay(false)} />
    </>
  );
};

export default ProfileModal;
