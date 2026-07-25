import React, { useEffect, useState } from "react";
import { X, Save, CreditCard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getPaymentSettings, savePaymentSettings } from "@/lib/wallet";
import { toast } from "sonner";

interface Props { open: boolean; onClose: () => void; }

const empty = { firstName: "", lastName: "", username: "", mobile: "", address: "", upi: "" };

const PaymentSettingsForm: React.FC<Props> = ({ open, onClose }) => {
  const { user } = useAuth();
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || !open) return;
    getPaymentSettings(user.uid).then((d) => { if (d) setForm({ ...empty, ...d }); });
  }, [user, open]);

  if (!open || !user) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const required = ["firstName", "lastName", "username", "mobile", "address", "upi"] as const;
    for (const k of required) if (!form[k]?.trim()) { toast.error(`${k} is required`); return; }
    setSaving(true);
    try {
      await savePaymentSettings(user.uid, form);
      toast.success("Payment settings saved");
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Failed to save");
    }
    setSaving(false);
  };

  const inputCls = "w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground outline-none";

  return (
    <div className="fixed inset-0 z-[110] bg-foreground/50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-background rounded-2xl w-full max-w-md p-6 relative my-8" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground"><X size={20} /></button>
        <div className="flex items-center gap-2 mb-4"><CreditCard size={20} /><h2 className="text-lg font-bold text-foreground">Payment Settings</h2></div>
        <p className="text-xs text-muted-foreground mb-4">Enter details used for withdrawals. Verified before payouts.</p>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className={inputCls} />
            <input placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className={inputCls} />
          </div>
          <input placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className={inputCls} />
          <input placeholder="Mobile number" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} className={inputCls} />
          <textarea placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputCls + " min-h-[70px]"} />
          <input placeholder="UPI ID (e.g. name@bank)" value={form.upi} onChange={(e) => setForm({ ...form, upi: e.target.value })} className={inputCls} />
          <button type="submit" disabled={saving} className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50">
            <Save size={14} /> {saving ? "Saving..." : "Save & Confirm"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PaymentSettingsForm;
