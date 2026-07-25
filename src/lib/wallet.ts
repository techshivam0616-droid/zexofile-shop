import { ref, get, set, push, runTransaction } from "firebase/database";
import { db } from "@/lib/firebase";

export type LedgerType = "credit_sale" | "credit_affiliate" | "debit_withdraw" | "refund_withdraw";

export const addLedger = async (uid: string, entry: {
  type: LedgerType;
  amount: number;
  refId?: string;
  note?: string;
}) => {
  await push(ref(db, `walletLedger/${uid}`), { ...entry, ts: Date.now() });
};

export const creditWallet = async (uid: string, amount: number, entry: { type: LedgerType; refId?: string; note?: string }) => {
  if (!uid || !amount) return;
  await runTransaction(ref(db, `users/${uid}/wallet/balance`), (bal) => (bal || 0) + amount);
  await addLedger(uid, { ...entry, amount });
};

export const debitWallet = async (uid: string, amount: number, entry: { type: LedgerType; refId?: string; note?: string }) => {
  let ok = false;
  await runTransaction(ref(db, `users/${uid}/wallet/balance`), (bal) => {
    const b = bal || 0;
    if (b < amount) return; // abort
    ok = true;
    return b - amount;
  });
  if (ok) await addLedger(uid, { ...entry, amount: -amount });
  return ok;
};

export const getPaymentSettings = async (uid: string) => {
  const snap = await get(ref(db, `paymentSettings/${uid}`));
  return snap.val();
};

export const savePaymentSettings = async (uid: string, data: any) => {
  await set(ref(db, `paymentSettings/${uid}`), { ...data, updatedAt: Date.now() });
};

export const generateWithdrawalId = () => {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `WD-${t}-${r}`;
};
