import { ref, push, get, set } from "firebase/database";
import { db } from "@/lib/firebase";

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export const generateRefCode = (len = 8) => {
  let s = "";
  for (let i = 0; i < len; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
};

export const ensureAffiliate = async (uid: string, defaultRate = 0.1) => {
  const snap = await get(ref(db, `affiliates/${uid}`));
  if (snap.exists()) return snap.val();
  // ensure unique code
  let code = generateRefCode();
  for (let i = 0; i < 5; i++) {
    const existing = await get(ref(db, `affiliateCodes/${code}`));
    if (!existing.exists()) break;
    code = generateRefCode();
  }
  const data = { code, commissionRate: defaultRate, createdAt: Date.now(), uid };
  await set(ref(db, `affiliates/${uid}`), data);
  await set(ref(db, `affiliateCodes/${code}`), uid);
  return data;
};

export const buildAffiliateLink = (code: string, productId?: string) => {
  const base = window.location.origin + "/";
  const params = new URLSearchParams({ ref: code });
  if (productId) params.set("p", productId);
  return `${base}?${params.toString()}`;
};

export const captureRefFromUrl = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      localStorage.setItem("affiliateRef", ref);
      localStorage.setItem("affiliateRefAt", String(Date.now()));
      return ref;
    }
  } catch {}
  return null;
};

export const logAffiliateClick = async (code: string, productId?: string) => {
  try {
    await push(ref(db, `affiliateClicks/${code}`), { productId: productId || null, ts: Date.now() });
  } catch (e) {
    console.error("affiliate click log failed", e);
  }
};

export const recordAffiliateSale = async (params: {
  code: string;
  productId: string;
  productTitle: string;
  buyerUid: string;
  amount: number;
  paymentId: string;
}) => {
  try {
    const affCodeSnap = await get(ref(db, `affiliateCodes/${params.code}`));
    if (!affCodeSnap.exists()) return;
    const affUid = affCodeSnap.val();
    const affSnap = await get(ref(db, `affiliates/${affUid}`));
    const rate = affSnap.val()?.commissionRate ?? 0.1;
    const commission = Math.round(params.amount * rate * 100) / 100;
    await push(ref(db, `affiliateSales/${params.code}`), {
      affUid,
      productId: params.productId,
      productTitle: params.productTitle,
      buyerUid: params.buyerUid,
      amount: params.amount,
      commission,
      rate,
      paymentId: params.paymentId,
      status: "pending",
      createdAt: Date.now(),
    });
  } catch (e) {
    console.error("affiliate sale record failed", e);
  }
};
