import React, { useState, useEffect } from "react";
import { X, Send, ShieldCheck, Clock, XCircle, CheckCircle2 } from "lucide-react";
import { ref, set, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import ImageUpload from "./ImageUpload";
import { toast } from "sonner";

interface Props { open: boolean; onClose: () => void; }

const SellerVerificationForm: React.FC<Props> = ({ open, onClose }) => {
  const { user } = useAuth();
  const [form, setForm] = useState({ fullName: "", username: "", mobile: "", dob: "", idPhotoUrl: "" });
  const [existing, setExisting] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = onValue(ref(db, `sellerVerifications/${user.uid}`), (snap) => setExisting(snap.val()));
    return () => unsub();
  }, [user]);

  if (!open || !user) return null;

  const canReapply = !existing || existing.status === "approved"
    ? true
    : existing.status === "pending"
      ? false
      : !existing.reapplyAfter || Date.now() >= existing.reapplyAfter;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.username || !form.mobile || !form.dob || !form.idPhotoUrl) {
      toast.error("Please fill all fields and upload your ID.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form, uid: user.uid, email: user.email,
        status: "pending", submittedAt: Date.now(),
        rejectionReason: null, reapplyAfter: null,
      };
      await set(ref(db, `sellerVerifications/${user.uid}`), payload);
      await set(ref(db, `users/${user.uid}/sellerStatus`), "pending");
      toast.success("Verification submitted! Admin will review shortly.");
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Submission failed");
    }
    setSubmitting(false);
  };

  const inputCls = "w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground outline-none";

  return (
    <div className="fixed inset-0 z-[105] bg-foreground/50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-background rounded-2xl w-full max-w-md p-6 relative my-8" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground"><X size={20} /></button>
        <div className="flex items-center gap-2 mb-2"><ShieldCheck size={20} /><h2 className="text-lg font-bold text-foreground">Seller Verification</h2></div>
        <p className="text-xs text-muted-foreground mb-3">Submit your details. Admin will review and approve from the admin panel.</p>

        {existing?.status === "pending" && (
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 mb-4 flex items-start gap-2">
            <Clock size={16} className="text-warning shrink-0 mt-0.5" />
            <div className="text-xs"><p className="font-semibold text-foreground">Verification pending</p><p className="text-muted-foreground">Submitted {new Date(existing.submittedAt).toLocaleString()}</p></div>
          </div>
        )}
        {existing?.status === "approved" && (
          <div className="bg-primary/10 rounded-lg p-3 mb-4 flex items-start gap-2">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            <p className="text-xs text-foreground">You are a verified seller ✅</p>
          </div>
        )}
        {existing?.status === "rejected" && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2"><XCircle size={16} className="text-destructive shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-semibold text-foreground">Rejected</p>
                {existing.rejectionReason && <p className="text-muted-foreground mt-1">Reason: {existing.rejectionReason}</p>}
                {existing.reapplyAfter && (
                  <p className="text-muted-foreground mt-1">
                    {Date.now() < existing.reapplyAfter
                      ? `You can reapply after ${new Date(existing.reapplyAfter).toLocaleDateString()}`
                      : "You can reapply now."}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {(existing?.status !== "approved") && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <fieldset disabled={!canReapply} className="space-y-3 disabled:opacity-50">
              <input placeholder="Full Name (as on ID)" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={inputCls} />
              <input placeholder="Username" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className={inputCls} />
              <input placeholder="Mobile Number" required value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} className={inputCls} />
              <div>
                <label className="text-xs text-muted-foreground">Date of Birth</label>
                <input type="date" required value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">ID Card Photo (name & mobile must match)</label>
                <ImageUpload value={form.idPhotoUrl} onChange={(url) => setForm({ ...form, idPhotoUrl: url })} placeholder="Upload ID card" />
              </div>
              <button type="submit" disabled={submitting || !canReapply}
                className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                <Send size={14} /> {submitting ? "Submitting..." : "Submit for Verification"}
              </button>
            </fieldset>
          </form>
        )}
      </div>
    </div>
  );
};

export default SellerVerificationForm;
