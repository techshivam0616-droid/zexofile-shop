import React, { useEffect, useState } from "react";
import { ref, onValue, push, update, remove, set } from "firebase/database";
import { db } from "@/lib/firebase";
import { Store, StorePlan, PERIOD_DAYS, PLAN_FLAGS, storeUrl } from "@/lib/stores";
import { Plus, Trash2, ExternalLink, Power, Save, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

const inputCls = "w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground outline-none";

const AdminStores = () => {
  const [sub, setSub] = useState<"stores" | "plans" | "payout">("stores");
  return (
    <div>
      <div className="flex gap-2 mb-4">
        {(["stores", "plans", "payout"] as const).map((k) => (
          <button key={k} onClick={() => setSub(k)} className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize ${sub === k ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            {k === "payout" ? "Payout settings" : k}
          </button>
        ))}
      </div>
      {sub === "stores" && <StoresList />}
      {sub === "plans" && <Plans />}
      {sub === "payout" && <Payout />}
    </div>
  );
};

const StoresList = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [q, setQ] = useState("");
  useEffect(() => onValue(ref(db, "stores"), (s) => setStores(Object.values(s.val() || {}) as Store[])), []);
  const shown = stores.filter((s) => (s.name + s.slug + (s.ownerEmail || "")).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-2">
      <input placeholder="Search stores" value={q} onChange={(e) => setQ(e.target.value)} className={inputCls} />
      <p className="text-xs text-muted-foreground">{stores.length} stores</p>
      {shown.map((s) => <StoreRow key={s.slug} s={s} open={open === s.slug} toggle={() => setOpen(open === s.slug ? null : s.slug)} />)}
    </div>
  );
};

const StoreRow: React.FC<{ s: Store; open: boolean; toggle: () => void }> = ({ s, open, toggle }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [days, setDays] = useState("30");
  useEffect(() => {
    if (!open) return;
    const a = onValue(ref(db, `storeProducts/${s.slug}`), (x) => setProducts(Object.entries(x.val() || {}).map(([id, v]: any) => ({ id, ...v }))));
    const b = onValue(ref(db, `storeOrders/${s.slug}`), (x) => setOrders(Object.values(x.val() || {})));
    return () => { a(); b(); };
  }, [open, s.slug]);
  const live = s.status !== "suspended" && (s.planExpiresAt || 0) > Date.now();
  const extend = async () => {
    const base = (s.planExpiresAt || 0) > Date.now() ? s.planExpiresAt! : Date.now();
    await update(ref(db, `stores/${s.slug}`), { planExpiresAt: base + (parseInt(days) || 0) * 86400000, planName: s.planName || "Admin grant" });
    toast.success("Plan extended");
  };
  return (
    <div className="border border-border rounded-lg">
      <button onClick={toggle} className="w-full flex items-center gap-3 p-3 text-left">
        {s.logo ? <img src={s.logo} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-muted" />}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
          <p className="text-[11px] text-muted-foreground truncate">/s/{s.slug} · {s.ownerEmail}</p>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full ${live ? "bg-primary/15 text-foreground" : "bg-destructive/15 text-destructive"}`}>{s.status === "suspended" ? "Suspended" : live ? "Live" : "No plan"}</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && (
        <div className="p-3 border-t border-border space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-1 text-muted-foreground">
            <p>Plan: <span className="text-foreground">{s.planName || "—"}</span></p>
            <p>Expires: <span className="text-foreground">{s.planExpiresAt ? new Date(s.planExpiresAt).toLocaleDateString() : "—"}</span></p>
            <p>Phone: <span className="text-foreground">{s.phone || "—"}</span></p>
            <p>Email: <span className="text-foreground">{s.email || "—"}</span></p>
            <p>Products: <span className="text-foreground">{products.length}</span></p>
            <p>Orders: <span className="text-foreground">{orders.length} · ₹{orders.reduce((a, o: any) => a + (o.price || 0), 0)}</span></p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={storeUrl(s.slug)} target="_blank" rel="noreferrer" className="px-3 py-1.5 border border-border rounded-md flex items-center gap-1"><ExternalLink size={12} /> Open</a>
            <button onClick={() => update(ref(db, `stores/${s.slug}`), { status: s.status === "suspended" ? "active" : "suspended" })}
              className="px-3 py-1.5 border border-border rounded-md flex items-center gap-1"><Power size={12} /> {s.status === "suspended" ? "Activate" : "Suspend"}</button>
            <div className="flex items-center gap-1">
              <input value={days} onChange={(e) => setDays(e.target.value)} className="w-14 px-2 py-1.5 border border-border rounded-md bg-background" />
              <button onClick={extend} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md">+ days</button>
            </div>
            <button onClick={async () => {
              if (!confirm(`Delete store ${s.name} and all its products?`)) return;
              await remove(ref(db, `storeProducts/${s.slug}`)); await remove(ref(db, `stores/${s.slug}`));
              await set(ref(db, `users/${s.ownerUid}/storeSlug`), null); toast.success("Store deleted");
            }} className="px-3 py-1.5 border border-destructive text-destructive rounded-md flex items-center gap-1"><Trash2 size={12} /> Delete</button>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">Products</p>
            {products.map((p) => (
              <div key={p.id} className="flex items-center gap-2 py-1">
                {p.imageUrl && <img src={p.imageUrl} alt="" className="w-8 h-8 rounded object-cover" />}
                <span className="flex-1 truncate text-foreground">{p.title} · ₹{p.price}{p.active === false ? " (hidden)" : ""}</span>
                <button onClick={() => update(ref(db, `storeProducts/${s.slug}/${p.id}`), { active: p.active === false })} className="text-muted-foreground underline">{p.active === false ? "Show" : "Hide"}</button>
                <button onClick={() => confirm("Delete product?") && remove(ref(db, `storeProducts/${s.slug}/${p.id}`))} className="text-destructive"><Trash2 size={12} /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const emptyPlan = { name: "", period: "monthly" as StorePlan["period"], price: "", features: "", maxProducts: "10", commissionRate: "10", flags: {} as Record<string, boolean>, popular: false };

const Plans = () => {
  const [plans, setPlans] = useState<StorePlan[]>([]);
  const [f, setF] = useState<any>(emptyPlan);
  const [editId, setEditId] = useState<string | null>(null);
  useEffect(() => onValue(ref(db, "storePlans"), (s) => setPlans(Object.entries(s.val() || {}).map(([id, v]: any) => ({ id, ...v })))), []);
  const save = async () => {
    if (!f.name || !f.price) return toast.error("Name and price required");
    const data = {
      name: f.name, period: f.period, days: PERIOD_DAYS[f.period as keyof typeof PERIOD_DAYS], price: Number(f.price), features: f.features,
      maxProducts: parseInt(f.maxProducts) || 0, commissionRate: parseFloat(f.commissionRate) || 0, flags: f.flags || {}, popular: !!f.popular,
    };
    if (editId) await update(ref(db, `storePlans/${editId}`), data);
    else await push(ref(db, "storePlans"), { ...data, active: true });
    setF(emptyPlan); setEditId(null); toast.success(editId ? "Plan updated" : "Plan added");
  };
  const edit = (p: StorePlan) => {
    setEditId(p.id);
    setF({ name: p.name, period: p.period, price: String(p.price), features: p.features || "", maxProducts: String(p.maxProducts ?? 0), commissionRate: String(p.commissionRate ?? 10), flags: p.flags || {}, popular: !!p.popular });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <div className="space-y-3">
      <div className="p-3 border border-border rounded-lg space-y-2">
        <p className="text-sm font-semibold text-foreground">{editId ? "Edit plan" : "New plan"}</p>
        <input placeholder="Plan name (e.g. Starter)" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={inputCls} />
        <div className="grid grid-cols-2 gap-2">
          <select value={f.period} onChange={(e) => setF({ ...f, period: e.target.value })} className={inputCls}>
            <option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="yearly">Yearly</option>
          </select>
          <input type="number" placeholder="Price ₹" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-[11px] text-muted-foreground">Max products (0 = unlimited)
            <input type="number" value={f.maxProducts} onChange={(e) => setF({ ...f, maxProducts: e.target.value })} className={inputCls + " mt-1"} />
          </label>
          <label className="text-[11px] text-muted-foreground">Platform fee per sale (%)
            <input type="number" value={f.commissionRate} onChange={(e) => setF({ ...f, commissionRate: e.target.value })} className={inputCls + " mt-1"} />
          </label>
        </div>
        <p className="text-xs font-medium text-foreground pt-1">Features included</p>
        <div className="grid grid-cols-2 gap-1.5">
          {PLAN_FLAGS.map((x) => (
            <label key={x.k} className="flex items-center gap-2 text-xs text-foreground p-2 border border-border rounded-md cursor-pointer">
              <input type="checkbox" checked={!!f.flags?.[x.k]} onChange={(e) => setF({ ...f, flags: { ...f.flags, [x.k]: e.target.checked } })} /> {x.l}
            </label>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs text-foreground"><input type="checkbox" checked={f.popular} onChange={(e) => setF({ ...f, popular: e.target.checked })} /> Mark as "Most popular"</label>
        <textarea placeholder="Extra features (one per line, optional)" value={f.features} onChange={(e) => setF({ ...f, features: e.target.value })} className={inputCls + " min-h-[60px]"} />
        <div className="flex gap-2">
          {editId && <button onClick={() => { setEditId(null); setF(emptyPlan); }} className="flex-1 py-2.5 border border-border rounded-lg text-sm">Cancel</button>}
          <button onClick={save} className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center justify-center gap-1">{editId ? <Save size={14} /> : <Plus size={14} />} {editId ? "Save plan" : "Add plan"}</button>
        </div>
      </div>
      {plans.map((p) => (
        <div key={p.id} className="p-3 border border-border rounded-lg flex items-center gap-2">
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{p.name} · ₹{p.price}{p.popular ? " · ★ Popular" : ""}</p>
            <p className="text-[11px] text-muted-foreground capitalize">{p.period} ({p.days} days) · {p.maxProducts ? `${p.maxProducts} products` : "Unlimited products"} · {p.commissionRate ?? "default"}% fee{p.active === false ? " · disabled" : ""}</p>
          </div>
          <button onClick={() => edit(p)} className="text-xs underline text-muted-foreground">Edit</button>
          <button onClick={() => update(ref(db, `storePlans/${p.id}`), { active: p.active === false })} className="text-xs underline text-muted-foreground">{p.active === false ? "Enable" : "Disable"}</button>
          <button onClick={() => confirm("Delete plan?") && remove(ref(db, `storePlans/${p.id}`))} className="text-destructive"><Trash2 size={14} /></button>
        </div>
      ))}
    </div>
  );
};

const Payout = () => {
  const [hold, setHold] = useState("7");
  const [rate, setRate] = useState("10");
  useEffect(() => {
    const a = onValue(ref(db, "siteSettings/payoutHoldDays"), (s) => typeof s.val() === "number" && setHold(String(s.val())));
    const b = onValue(ref(db, "siteSettings/storeCommissionRate"), (s) => typeof s.val() === "number" && setRate(String(s.val() * 100)));
    return () => { a(); b(); };
  }, []);
  const save = async () => {
    await update(ref(db, "siteSettings"), { payoutHoldDays: parseInt(hold) || 0, storeCommissionRate: (parseFloat(rate) || 0) / 100 });
    toast.success("Saved");
  };
  return (
    <div className="space-y-3 p-3 border border-border rounded-lg">
      <label className="block text-xs text-muted-foreground">Payout hold (days after sale before money can be withdrawn)
        <select value={hold} onChange={(e) => setHold(e.target.value)} className={inputCls + " mt-1"}>
          {[0, 1, 2, 3, 5, 7, 14, 30].map((d) => <option key={d} value={d}>{d === 0 ? "Instant" : d === 7 ? "1 week" : d === 14 ? "2 weeks" : `${d} day${d > 1 ? "s" : ""}`}</option>)}
        </select>
      </label>
      <label className="block text-xs text-muted-foreground">Platform commission on store sales (%)
        <input type="number" value={rate} onChange={(e) => setRate(e.target.value)} className={inputCls + " mt-1"} />
      </label>
      <p className="text-[11px] text-muted-foreground">Withdrawal requests from store owners appear in Roles → Withdrawals, where you can approve or reject them.</p>
      <button onClick={save} className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center justify-center gap-1"><Save size={14} /> Save</button>
    </div>
  );
};

export default AdminStores;
