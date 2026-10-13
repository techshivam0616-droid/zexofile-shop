import React, { useEffect, useState } from "react";
import { Wallet, ArrowDownToLine, Clock, CheckCircle2, XCircle } from "lucide-react";
import { onValue, ref, push, set } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { debitWallet, generateWithdrawalId, getPaymentSettings } from "@/lib/wallet";
import { toast } from "sonner";

interface Props {
  role: "seller" | "affiliate" | "store";
  onOpenPaymentSettings: () => void;
}

const MIN_WITHDRAW = 100;

const WalletPanel: React.FC<Props> = ({ role, onOpenPaymentSettings }) => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [ledger, setLedger] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    const u1 = onValue(ref(db, `users/${user.uid}/wallet/balance`), (s) => setBalance(s.val() || 0));
    const u2 = onValue(ref(db, `walletLedger/${user.uid}`), (s) => {
      const d = s.val();
      setLedger(d ? Object.entries(d).map(([id, v]: any) => ({ id, ...v })).sort((a, b) => b.ts - a.ts) : []);
    });
    const u3 = onValue(ref(db, "withdrawals"), (s) => {
      const d = s.val() || {};
      const mine = Object.entries(d)
        .map(([id, v]: any) => ({ id, ...v }))
        .filter((w) => w.uid === user.uid)
        .sort((a, b) => b.createdAt - a.createdAt);
      setWithdrawals(mine);
    });
    return () => { u1(); u2(); u3(); };
  }, [user]);

  if (!user) return null;

  const now = Date.now();
  const locked = ledger.filter((l) => l.releaseAt && l.releaseAt > now && l.amount > 0).reduce((a, l) => a + l.amount, 0);
  const available = Math.max(0, balance - locked);

  const request = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt < MIN_WITHDRAW) { toast.error(`Minimum withdrawal is ₹${MIN_WITHDRAW}`); return; }
    if (amt > available) { toast.error("Amount exceeds available balance"); return; }
    const pay = await getPaymentSettings(user.uid);
    if (!pay?.upi) { toast.error("Add payment settings first"); onOpenPaymentSettings(); return; }
    setBusy(true);
    try {
      const withdrawalId = generateWithdrawalId();
      const ok = await debitWallet(user.uid, amt, { type: "debit_withdraw", refId: withdrawalId, note: "Withdrawal request" });
      if (!ok) { toast.error("Balance changed. Try again."); setBusy(false); return; }
      const key = push(ref(db, "withdrawals")).key!;
      await set(ref(db, `withdrawals/${key}`), {
        withdrawalId, uid: user.uid, role, amount: amt,
        payment: pay, status: "pending", createdAt: Date.now(),
        email: user.email || null, name: user.displayName || null,
      });
      toast.success(`Requested ${withdrawalId}`);
      setAmount("");
    } catch (e: any) {
      toast.error(e?.message || "Failed");
    }
    setBusy(false);
  };

  return (
    <div className="space-y-3">
      <div className="bg-muted rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2"><Wallet size={16} /><p className="text-xs text-muted-foreground">Wallet balance</p></div>
        <p className="text-3xl font-bold text-foreground">₹{balance.toFixed(2)}</p>
        <p className="text-[11px] text-muted-foreground mt-1">Available to withdraw: ₹{available.toFixed(2)}{locked > 0 ? ` · On hold: ₹${locked.toFixed(2)}` : ""}</p>
      </div>

      <div className="bg-muted rounded-xl p-3 space-y-2">
        <p className="text-xs font-medium text-foreground flex items-center gap-1"><ArrowDownToLine size={12} /> Request withdrawal</p>
        <div className="flex gap-2">
          <input type="number" placeholder={`Min ₹${MIN_WITHDRAW}`} value={amount} onChange={(e) => setAmount(e.target.value)}
            className="flex-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground outline-none" />
          <button onClick={request} disabled={busy}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
            Withdraw
          </button>
        </div>
        <button onClick={onOpenPaymentSettings} className="text-[10px] text-muted-foreground underline">Edit payment settings</button>
      </div>

      {withdrawals.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-foreground mb-1">Your withdrawals</p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {withdrawals.map((w) => (
              <div key={w.id} className="flex items-center justify-between p-2 bg-muted rounded text-xs">
                <div className="min-w-0">
                  <p className="font-mono text-foreground truncate">{w.withdrawalId}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(w.createdAt).toLocaleString()}</p>
                  {w.adminNote && <p className="text-[10px] text-muted-foreground">{w.adminNote}</p>}
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">₹{w.amount}</p>
                  <span className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                    w.status === "paid" ? "bg-primary/20 text-foreground"
                    : w.status === "rejected" ? "bg-destructive/20 text-destructive"
                    : "bg-warning/20 text-foreground"
                  }`}>
                    {w.status === "paid" ? <CheckCircle2 size={10} /> : w.status === "rejected" ? <XCircle size={10} /> : <Clock size={10} />}
                    {w.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {ledger.length > 0 && (
        <details>
          <summary className="text-xs text-muted-foreground cursor-pointer">Ledger ({ledger.length})</summary>
          <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
            {ledger.map((l) => (
              <div key={l.id} className="flex justify-between text-[11px] px-2 py-1 bg-muted rounded">
                <span className="text-foreground truncate">{l.note || l.type}</span>
                <span className={l.amount >= 0 ? "text-foreground" : "text-destructive"}>
                  {l.amount >= 0 ? "+" : ""}₹{l.amount}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
};

export default WalletPanel;
