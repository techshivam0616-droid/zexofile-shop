import { ref, get, set, update, push, remove, onValue } from "firebase/database";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";

export const RAZORPAY_KEY = "rzp_live_TiDL9k3NMfvwmO";

export type StoreTheme = "minimal" | "bold" | "elegant";

export interface StorePlan {
  id: string;
  name: string;
  period: "monthly" | "quarterly" | "yearly";
  days: number;
  price: number;
  features?: string;
  active?: boolean;
  maxProducts?: number; // 0 = unlimited
  commissionRate?: number; // percent taken by platform per sale
  flags?: Partial<Record<PlanFlag, boolean>>;
  popular?: boolean;
}

export type PlanFlag = string;
export const PLAN_FLAGS: { k: PlanFlag; l: string }[] = [
  { k: "customTheme", l: "Premium store themes" },
  { k: "customColor", l: "Custom brand color" },
  { k: "banner", l: "Store banner image" },
  { k: "categories", l: "Product categories" },
  { k: "socialLinks", l: "Social & WhatsApp links" },
  { k: "verifiedBadge", l: "Verified store badge" },
  { k: "analytics", l: "Sales analytics" },
  { k: "prioritySupport", l: "Priority support" },
];

export interface Store {
  slug: string;
  ownerUid: string;
  ownerEmail?: string;
  name: string;
  tagline?: string;
  about?: string;
  logo?: string;
  banner?: string;
  primaryColor?: string;
  theme?: StoreTheme;
  email?: string;
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  website?: string;
  address?: string;
  status?: "active" | "suspended";
  planId?: string;
  planName?: string;
  planExpiresAt?: number;
  planMaxProducts?: number;
  planCommissionRate?: number;
  planFlags?: Partial<Record<PlanFlag, boolean>>;
  createdAt?: number;
}

export interface StoreProduct {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  description: string;
  deliveryLink?: string;
  previewLink?: string;
  category?: string;
  active?: boolean;
  createdAt?: number;
}

export const PERIOD_DAYS = { monthly: 30, quarterly: 90, yearly: 365 } as const;

export const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32);

const RESERVED = ["admin", "api", "app", "shop", "store", "login", "zexofile", "support"];

export const isSlugAvailable = async (slug: string) => {
  if (slug.length < 3 || RESERVED.includes(slug)) return false;
  const s = await get(ref(db, `stores/${slug}`));
  return !s.exists();
};

export const storeUrl = (slug: string) => `${window.location.origin}/s/${slug}`;

export const isStoreLive = (s?: Store | null) =>
  !!s && s.status !== "suspended" && !!s.planExpiresAt && s.planExpiresAt > Date.now();

export const createStore = async (uid: string, email: string, data: Partial<Store> & { slug: string; name: string }) => {
  const store: Store = {
    theme: "minimal", primaryColor: "#111111", status: "active",
    ...data, ownerUid: uid, ownerEmail: email, createdAt: Date.now(),
  } as Store;
  await set(ref(db, `stores/${data.slug}`), store);
  await update(ref(db, `users/${uid}`), { storeSlug: data.slug });
};

export const updateStore = (slug: string, data: Partial<Store>) => update(ref(db, `stores/${slug}`), data);

export const activatePlan = async (store: Store, plan: StorePlan, paymentId: string) => {
  const base = store.planExpiresAt && store.planExpiresAt > Date.now() ? store.planExpiresAt : Date.now();
  const expires = base + plan.days * 86400000;
  await update(ref(db, `stores/${store.slug}`), {
    planId: plan.id, planName: plan.name, planExpiresAt: expires,
    planMaxProducts: plan.maxProducts ?? 0,
    planCommissionRate: typeof plan.commissionRate === "number" ? plan.commissionRate : null,
    planFlags: plan.flags || {},
  });
  await push(ref(db, `storeSubscriptions/${store.slug}`), {
    planId: plan.id, planName: plan.name, amount: plan.price, paymentId, ownerUid: store.ownerUid,
    startedAt: Date.now(), expiresAt: expires,
  });
};

export const saveStoreProduct = async (slug: string, p: Partial<StoreProduct>) => {
  const { id, ...rest } = p;
  if (id) await update(ref(db, `storeProducts/${slug}/${id}`), rest);
  else await push(ref(db, `storeProducts/${slug}`), { active: true, ...rest, createdAt: Date.now() });
};

export const deleteStoreProduct = (slug: string, id: string) => remove(ref(db, `storeProducts/${slug}/${id}`));

export const openRazorpay = (opts: {
  amount: number; name: string; description: string; email?: string; userName?: string; color?: string;
  onSuccess: (paymentId: string) => void;
}) => {
  try {
    const rzp = new (window as any).Razorpay({
      key: RAZORPAY_KEY,
      amount: Math.round(opts.amount * 100),
      currency: "INR",
      name: opts.name,
      description: opts.description,
      handler: (r: any) => opts.onSuccess(r.razorpay_payment_id),
      prefill: { name: opts.userName || "", email: opts.email || "" },
      theme: { color: opts.color || "#000000" },
    });
    rzp.open();
  } catch {
    throw new Error("Payment gateway not available");
  }
};

/** Plan feature checklist: defaults + admin-added (siteSettings/planFeatures), minus admin-removed (siteSettings/planFeaturesRemoved). */
export const usePlanFeatures = () => {
  const [custom, setCustom] = useState<{ k: string; l: string }[]>([]);
  const [removed, setRemoved] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const a = onValue(ref(db, "siteSettings/planFeatures"), (s) => setCustom(Object.entries(s.val() || {}).map(([k, l]: any) => ({ k, l }))));
    const b = onValue(ref(db, "siteSettings/planFeaturesRemoved"), (s) => setRemoved(s.val() || {}));
    return () => { a(); b(); };
  }, []);
  return [...PLAN_FLAGS, ...custom].filter((f) => !removed[f.k]);
};
