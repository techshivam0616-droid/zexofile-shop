import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import ImageUpload from "@/components/ImageUpload";
import WalletPanel from "@/components/WalletPanel";
import PaymentSettingsForm from "@/components/PaymentSettingsForm";
import {
  Store, StorePlan, StoreProduct, StoreTheme, createStore, updateStore, slugify, isSlugAvailable, storeUrl,
  isStoreLive, activatePlan, openRazorpay, saveStoreProduct, deleteStoreProduct,
} from "@/lib/stores";
import { ArrowLeft, Copy, ExternalLink, Plus, Trash2, Edit, Check, Package, Palette, Wallet, Crown, ShoppingBag, Save } from "lucide-react";
import { toast } from "sonner";

interface Props { onClose: () => void; }

const inputCls = "w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground outline-none focus:border-foreground";
const btn = "py-3 bg-primary text-primary-foreground rounded-lg font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2";

const StoreDashboard: React.FC<Props> = ({ onClose }) => {
  const { user } = useAuth();
  const [slug, setSlug] = useState<string | null | undefined>(undefined);
  const [store, setStore] = useState<Store | null>(null);
  const [plans, setPlans] = useState<StorePlan[]>([]);
  const [tab, setTab] = useState<"overview" | "products" | "design" | "wallet" | "plan">("overview");

  useEffect(() => {
    if (!user) return;
    const u = onValue(ref(db, `users/${user.uid}/storeSlug`), (s) => setSlug(s.val() || null));
    const p = onValue(ref(db, "storePlans"), (s) => {
      const d = s.val() || {};
      setPlans(Object.entries(d).map(([id, v]: any) => ({ id, ...v })).filter((x) => x.active !== false).sort((a, b) => a.price - b.price));
    });
    return () => { u(); p(); };
  }, [user]);

  useEffect(() => {
    if (!slug) { setStore(null); return; }
    return onValue(ref(db, `stores/${slug}`), (s) => setStore(s.val()));
  }, [slug]);

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-[105] bg-background overflow-y-auto">
      <div className="sticky top-0 bg-background border-b px-4 py-3 flex items-center gap-3 z-10">
        <button onClick={onClose}><ArrowLeft size={22} /></button>
        <span className="text-sm font-semibold text-foreground">{store ? store.name : "Create your store"}</span>
      </div>
      <div className="max-w-2xl mx-auto p-4">
        {slug === undefined ? <p className="text-sm text-muted-foreground">Loading...</p>
          : !store ? <CreateStore />
          : (
            <>
              <div className="flex gap-1 overflow-x-auto border-b mb-4">
                {([
                  ["overview", "Overview", <ShoppingBag size={14} />], ["products", "Products", <Package size={14} />],
                  ["design", "Store Settings", <Palette size={14} />], ["wallet", "Wallet", <Wallet size={14} />], ["plan", "Plan", <Crown size={14} />],
                ] as const).map(([k, l, i]) => (
                  <button key={k} onClick={() => setTab(k)} className={`px-3 py-2.5 text-xs font-medium flex items-center gap-1 whitespace-nowrap ${tab === k ? "border-b-2 border-foreground text-foreground" : "text-muted-foreground"}`}>{i}{l}</button>
                ))}
              </div>
              {!isStoreLive(store) && tab !== "plan" && (
                <div className="mb-4 p-3 rounded-lg bg-warning/10 border border-warning/30 text-sm text-foreground flex items-center justify-between gap-2">
                  <span>{store.status === "suspended" ? "Your store is suspended by admin." : "Your store is offline. Buy a plan to go live."}</span>
                  {store.status !== "suspended" && <button onClick={() => setTab("plan")} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium">Choose plan</button>}
                </div>
              )}
              {tab === "overview" && <Overview store={store} />}
              {tab === "products" && <Products slug={store.slug} />}
              {tab === "design" && <StoreForm store={store} />}
              {tab === "wallet" && <WalletTab />}
              {tab === "plan" && <PlanPicker store={store} plans={plans} />}
            </>
          )}
      </div>
    </div>
  );
};

const CreateStore = () => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const finalSlug = slugify(touched ? slug : name);

  const submit = async () => {
    if (!name.trim()) return toast.error("Store name is required");
    if (!(await isSlugAvailable(finalSlug))) return toast.error("This store link is taken. Try another.");
    setBusy(true);
    try { await createStore(user!.uid, user!.email || "", { name: name.trim(), slug: finalSlug }); toast.success("Store created! Complete your details."); }
    catch (e: any) { toast.error(e.message); }
    setBusy(false);
  };

  return (
    <div className="py-6">
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4"><ShoppingBag size={26} /></div>
      <h1 className="text-2xl font-bold text-foreground">Create your store</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-6">Get your own premium store page and start selling.</p>
      <div className="space-y-3">
        <input placeholder="Store name" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        <div>
          <div className="flex items-center border border-border rounded-lg overflow-hidden text-sm">
            <span className="px-3 py-2.5 bg-muted text-muted-foreground whitespace-nowrap">{window.location.host}/s/</span>
            <input value={finalSlug} onChange={(e) => { setTouched(true); setSlug(e.target.value); }} className="flex-1 px-2 py-2.5 bg-background outline-none text-foreground min-w-0" />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">This is your personal store link.</p>
        </div>
        <button onClick={submit} disabled={busy} className={`w-full ${btn}`}>{busy ? "Creating..." : "Create store"}</button>
      </div>
    </div>
  );
};

const Overview: React.FC<{ store: Store }> = ({ store }) => {
  const [orders, setOrders] = useState<any[]>([]);
  useEffect(() => onValue(ref(db, `storeOrders/${store.slug}`), (s) => setOrders(Object.values(s.val() || {}).sort((a: any, b: any) => b.purchasedAt - a.purchasedAt))), [store.slug]);
  const url = storeUrl(store.slug);
  const revenue = orders.reduce((a, o) => a + (o.price || 0), 0);
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-muted">
        <p className="text-xs text-muted-foreground">Your store link</p>
        <p className="text-sm font-mono text-foreground break-all mt-1">{url}</p>
        <div className="flex gap-2 mt-3">
          <button onClick={() => { navigator.clipboard.writeText(url); toast.success("Copied"); }} className="flex-1 py-2 border border-border rounded-lg text-xs font-medium flex items-center justify-center gap-1 bg-background"><Copy size={12} /> Copy</button>
          <a href={url} target="_blank" rel="noreferrer" className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium flex items-center justify-center gap-1"><ExternalLink size={12} /> Open</a>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[["Orders", orders.length], ["Revenue", `₹${revenue}`], ["Plan", store.planExpiresAt && store.planExpiresAt > Date.now() ? `${Math.ceil((store.planExpiresAt - Date.now()) / 86400000)}d left` : "None"]].map(([l, v]) => (
          <div key={l as string} className="p-3 rounded-xl border border-border text-center"><p className="text-lg font-bold text-foreground">{v}</p><p className="text-[10px] text-muted-foreground">{l}</p></div>
        ))}
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground mb-2">Recent orders</p>
        {orders.length === 0 ? <p className="text-xs text-muted-foreground">No orders yet.</p> : orders.slice(0, 20).map((o, i) => (
          <div key={i} className="flex justify-between p-2.5 bg-muted rounded-lg mb-1 text-xs">
            <div><p className="font-medium text-foreground">{o.productTitle}</p><p className="text-muted-foreground">{o.buyerEmail} · {new Date(o.purchasedAt).toLocaleDateString()}</p></div>
            <span className="font-semibold text-foreground">₹{o.price}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const StoreForm: React.FC<{ store: Store }> = ({ store }) => {
  const [f, setF] = useState<Store>(store);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof Store, v: any) => setF({ ...f, [k]: v });
  const save = async () => {
    if (!f.name?.trim()) return toast.error("Name required");
    setBusy(true);
    const { slug, ownerUid, ownerEmail, status, planId, planName, planExpiresAt, createdAt, ...editable } = f;
    await updateStore(store.slug, editable);
    toast.success("Store updated"); setBusy(false);
  };
  const themes: { k: StoreTheme; l: string; d: string }[] = [
    { k: "minimal", l: "Minimal", d: "Clean & light" }, { k: "bold", l: "Bold", d: "Dark & striking" }, { k: "elegant", l: "Elegant", d: "Centered, serif" },
  ];
  return (
    <div className="space-y-4">
      <Section title="Basic details">
        <input placeholder="Store name" value={f.name} onChange={(e) => set("name", e.target.value)} className={inputCls} />
        <input placeholder="Tagline (short line under name)" value={f.tagline || ""} onChange={(e) => set("tagline", e.target.value)} className={inputCls} />
        <textarea placeholder="About your store" value={f.about || ""} onChange={(e) => set("about", e.target.value)} className={inputCls + " min-h-[90px]"} />
      </Section>
      <Section title="Logo & banner">
        <p className="text-xs text-muted-foreground">Logo</p>
        <ImageUpload value={f.logo || ""} onChange={(u) => set("logo", u)} placeholder="Upload logo" />
        <p className="text-xs text-muted-foreground">Banner</p>
        <ImageUpload value={f.banner || ""} onChange={(u) => set("banner", u)} placeholder="Upload banner" />
      </Section>
      <Section title="Theme & color">
        <div className="grid grid-cols-3 gap-2">
          {themes.map((t) => (
            <button key={t.k} onClick={() => set("theme", t.k)} className={`p-3 rounded-lg border text-left ${f.theme === t.k ? "border-foreground bg-muted" : "border-border"}`}>
              <p className="text-sm font-medium text-foreground flex items-center gap-1">{f.theme === t.k && <Check size={12} />}{t.l}</p>
              <p className="text-[10px] text-muted-foreground">{t.d}</p>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <input type="color" value={f.primaryColor || "#111111"} onChange={(e) => set("primaryColor", e.target.value)} className="w-12 h-10 rounded border border-border bg-background" />
          <span className="text-xs text-muted-foreground">Brand color (buttons & highlights)</span>
        </div>
      </Section>
      <Section title="Contact & support">
        <input placeholder="Support email" value={f.email || ""} onChange={(e) => set("email", e.target.value)} className={inputCls} />
        <input placeholder="Phone" value={f.phone || ""} onChange={(e) => set("phone", e.target.value)} className={inputCls} />
        <input placeholder="WhatsApp number" value={f.whatsapp || ""} onChange={(e) => set("whatsapp", e.target.value)} className={inputCls} />
        <input placeholder="Instagram (@handle or link)" value={f.instagram || ""} onChange={(e) => set("instagram", e.target.value)} className={inputCls} />
        <input placeholder="Website" value={f.website || ""} onChange={(e) => set("website", e.target.value)} className={inputCls} />
        <input placeholder="Address" value={f.address || ""} onChange={(e) => set("address", e.target.value)} className={inputCls} />
      </Section>
      <button onClick={save} disabled={busy} className={`w-full ${btn}`}><Save size={14} /> {busy ? "Saving..." : "Save changes"}</button>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="p-4 rounded-xl border border-border space-y-2"><p className="text-sm font-semibold text-foreground">{title}</p>{children}</div>
);

const emptyP: Partial<StoreProduct> = { title: "", price: 0, originalPrice: undefined, imageUrl: "", description: "", deliveryLink: "", previewLink: "", category: "", active: true };

const Products: React.FC<{ slug: string }> = ({ slug }) => {
  const [list, setList] = useState<StoreProduct[]>([]);
  const [edit, setEdit] = useState<Partial<StoreProduct> | null>(null);
  useEffect(() => onValue(ref(db, `storeProducts/${slug}`), (s) => setList(Object.entries(s.val() || {}).map(([id, v]: any) => ({ id, ...v })))), [slug]);

  const save = async () => {
    if (!edit?.title || !edit.price) return toast.error("Title and price required");
    const clean = Object.fromEntries(Object.entries(edit).filter(([, v]) => v !== undefined));
    await saveStoreProduct(slug, { ...clean, price: Number(edit.price), originalPrice: edit.originalPrice ? Number(edit.originalPrice) : null } as any);
    toast.success("Product saved"); setEdit(null);
  };

  if (edit) return (
    <div className="space-y-2">
      <input placeholder="Title" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} className={inputCls} />
      <div className="grid grid-cols-2 gap-2">
        <input type="number" placeholder="Price ₹" value={edit.price || ""} onChange={(e) => setEdit({ ...edit, price: e.target.value as any })} className={inputCls} />
        <input type="number" placeholder="Original price ₹" value={edit.originalPrice || ""} onChange={(e) => setEdit({ ...edit, originalPrice: e.target.value as any })} className={inputCls} />
      </div>
      <input placeholder="Category" value={edit.category || ""} onChange={(e) => setEdit({ ...edit, category: e.target.value })} className={inputCls} />
      <ImageUpload value={edit.imageUrl || ""} onChange={(u) => setEdit({ ...edit, imageUrl: u })} placeholder="Product image" />
      <textarea placeholder="Description" value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} className={inputCls + " min-h-[90px]"} />
      <input placeholder="Delivery link (opens after payment)" value={edit.deliveryLink || ""} onChange={(e) => setEdit({ ...edit, deliveryLink: e.target.value })} className={inputCls} />
      <input placeholder="Preview link (optional)" value={edit.previewLink || ""} onChange={(e) => setEdit({ ...edit, previewLink: e.target.value })} className={inputCls} />
      <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={edit.active !== false} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} /> Visible in store</label>
      <div className="flex gap-2">
        <button onClick={() => setEdit(null)} className="flex-1 py-3 border border-border rounded-lg text-sm">Cancel</button>
        <button onClick={save} className={`flex-1 ${btn}`}>Save</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-2">
      <button onClick={() => setEdit({ ...emptyP })} className={`w-full ${btn}`}><Plus size={14} /> Add product</button>
      {list.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">No products yet.</p>}
      {list.map((p) => (
        <div key={p.id} className="flex items-center gap-3 p-2 border border-border rounded-lg">
          {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-14 h-14 rounded object-cover" /> : <div className="w-14 h-14 rounded bg-muted" />}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
            <p className="text-xs text-muted-foreground">₹{p.price}{p.active === false ? " · Hidden" : ""}</p>
          </div>
          <button onClick={() => setEdit(p)} className="p-2 text-muted-foreground"><Edit size={14} /></button>
          <button onClick={() => confirm("Delete product?") && deleteStoreProduct(slug, p.id)} className="p-2 text-destructive"><Trash2 size={14} /></button>
        </div>
      ))}
    </div>
  );
};

const WalletTab = () => {
  const [pay, setPay] = useState(false);
  const [hold, setHold] = useState(7);
  useEffect(() => onValue(ref(db, "siteSettings/payoutHoldDays"), (s) => setHold(typeof s.val() === "number" ? s.val() : 7)), []);
  return (
    <>
      <p className="text-xs text-muted-foreground mb-3">Sales earnings become available to withdraw {hold} day{hold !== 1 ? "s" : ""} after each sale.</p>
      <WalletPanel role="store" onOpenPaymentSettings={() => setPay(true)} />
      <PaymentSettingsForm open={pay} onClose={() => setPay(false)} />
    </>
  );
};

const PlanPicker: React.FC<{ store: Store; plans: StorePlan[] }> = ({ store, plans }) => {
  const { user } = useAuth();
  const buy = (p: StorePlan) => {
    try {
      openRazorpay({
        amount: p.price, name: "ZexoFile Shop", description: `Store plan · ${p.name}`, email: user?.email || "",
        onSuccess: async (pid) => { await activatePlan(store, p, pid); toast.success("Plan activated! Your store is live."); },
      });
    } catch (e: any) { toast.error(e.message); }
  };
  return (
    <div className="space-y-3">
      {store.planExpiresAt && (
        <p className="text-sm text-foreground">Current plan: <b>{store.planName}</b> · {store.planExpiresAt > Date.now() ? `expires ${new Date(store.planExpiresAt).toLocaleDateString()}` : "expired"}</p>
      )}
      {plans.length === 0 && <p className="text-sm text-muted-foreground">No plans available yet. Please check back soon.</p>}
      {plans.map((p) => (
        <div key={p.id} className="p-4 rounded-xl border border-border">
          <div className="flex items-baseline justify-between">
            <p className="font-bold text-foreground">{p.name}</p>
            <p className="text-xl font-bold text-foreground">₹{p.price}<span className="text-xs font-normal text-muted-foreground"> / {p.period}</span></p>
          </div>
          {p.features && <ul className="mt-2 space-y-1">{p.features.split("\n").filter(Boolean).map((f) => <li key={f} className="text-xs text-muted-foreground flex gap-1"><Check size={12} className="mt-0.5" />{f}</li>)}</ul>}
          <button onClick={() => buy(p)} className={`w-full mt-3 ${btn}`}>{store.planExpiresAt && store.planExpiresAt > Date.now() ? "Extend" : "Buy"} plan</button>
        </div>
      ))}
    </div>
  );
};

export default StoreDashboard;
