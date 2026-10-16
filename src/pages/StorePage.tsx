import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ref, onValue, get, push } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "@/components/AuthModal";
import { Store, StoreProduct, isStoreLive, openRazorpay } from "@/lib/stores";
import { creditWallet } from "@/lib/wallet";
import { Mail, Phone, MessageCircle, Instagram, Globe, MapPin, X, ShoppingBag, ExternalLink, Search, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { BadgeCheck, Library, Zap, ShieldCheck, Infinity, Headphones, Package, ChevronDown } from "lucide-react";

type LegalKey = "privacy" | "terms" | "refund" | "contact";

const StorePage = () => {
  const { slug = "" } = useParams();
  const { user } = useAuth();
  const [store, setStore] = useState<Store | null | undefined>(undefined);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [selected, setSelected] = useState<StoreProduct | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [sort, setSort] = useState("new");
  const [libOpen, setLibOpen] = useState(false);
  const [legal, setLegal] = useState<LegalKey | null>(null);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [sales, setSales] = useState(0);

  useEffect(() => {
    if (!user) { setMyOrders([]); return; }
    return onValue(ref(db, `purchases/${user.uid}`), (s) =>
      setMyOrders(Object.values(s.val() || {}).filter((o: any) => o.storeSlug === slug).sort((a: any, b: any) => b.purchasedAt - a.purchasedAt)));
  }, [user, slug]);
  useEffect(() => onValue(ref(db, `storeOrders/${slug}`), (s) => setSales(Object.keys(s.val() || {}).length), () => {}), [slug]);

  useEffect(() => {
    const u1 = onValue(ref(db, `stores/${slug}`), (s) => setStore(s.val()));
    const u2 = onValue(ref(db, `storeProducts/${slug}`), (s) => {
      const d = s.val() || {};
      setProducts(Object.entries(d).map(([id, v]: any) => ({ id, ...v })).filter((p) => p.active !== false));
    });
    return () => { u1(); u2(); };
  }, [slug]);

  useEffect(() => {
    if (store?.name) document.title = `${store.name} — ${store.tagline || "Online Store"}`;
  }, [store]);

  const cats = useMemo(() => ["All", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean) as string[]))], [products]);
  const shown = products.filter((p) => (cat === "All" || p.category === cat) && p.title.toLowerCase().includes(q.toLowerCase()));

  if (store === undefined) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground">Loading store...</div></div>;
  }
  if (!store || !isStoreLive(store)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <ShoppingBag size={40} className="text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold text-foreground">Store unavailable</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">This store doesn't exist or is currently inactive.</p>
        <a href="/" className="mt-6 px-5 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-medium">Go to ZexoFile Shop</a>
      </div>
    );
  }

  const accent = store.primaryColor || "#111111";
  const theme = store.theme || "minimal";
  const dark = theme === "bold";
  const serif = theme === "elegant";

  const contact = store.email || store.phone || "the contact details on this page";
  const LEGAL: Record<LegalKey, { t: string; b: string }> = {
    privacy: { t: "Privacy Policy", b: `${store.name} respects your privacy.\n\nWhat we collect: your name, email and the products you purchase. Payments are processed by Razorpay; we never see or store your card or UPI details.\n\nHow we use it: to deliver your products, keep a record of your purchases so you can access them again, and provide support.\n\nWe don't sell your data. Contact ${contact} to request access or deletion of your data.` },
    terms: { t: "Terms of Service", b: `By purchasing from ${store.name} you agree to these terms.\n\n• All products are digital and delivered online immediately after payment.\n• Purchases are licensed for personal use; redistribution or resale is not allowed unless stated.\n• Prices are in INR and may change without notice.\n• ${store.name} is operated independently and hosted on ZexoFile Shop.\n\nQuestions? Contact ${contact}.` },
    refund: { t: "Refund Policy", b: `Because products are digital and delivered instantly, all sales are generally final.\n\nWe will issue a refund or replacement if:\n• the product link doesn't work and we can't fix it within 72 hours, or\n• you were charged twice for the same product.\n\nRequest within 7 days of purchase by contacting ${contact} with your payment ID.` },
    contact: { t: "Contact Us", b: [store.email && `Email: ${store.email}`, store.phone && `Phone: ${store.phone}`, store.whatsapp && `WhatsApp: ${store.whatsapp}`, store.address && `Address: ${store.address}`].filter(Boolean).join("\n") || "Contact details coming soon." },
  };

  const buy = (p: StoreProduct) => {
    if (!user) { setAuthOpen(true); return; }
    try {
      openRazorpay({
        amount: p.price, name: store.name, description: p.title, email: user.email || "", userName: user.displayName || "", color: accent,
        onSuccess: async (paymentId) => {
          try {
            const order = {
              productId: p.id, productTitle: p.title, price: p.price, razorpayPaymentId: paymentId,
              purchasedAt: Date.now(), deliveryLink: p.deliveryLink || p.previewLink || "", storeSlug: store.slug, storeName: store.name,
            };
            await push(ref(db, `purchases/${user.uid}`), order);
            await push(ref(db, `storeOrders/${store.slug}`), { ...order, buyerUid: user.uid, buyerEmail: user.email });
            const [rateSnap, holdSnap] = await Promise.all([
              get(ref(db, "siteSettings/storeCommissionRate")), get(ref(db, "siteSettings/payoutHoldDays")),
            ]);
            const rate = typeof store.planCommissionRate === "number" ? store.planCommissionRate / 100 : typeof rateSnap.val() === "number" ? rateSnap.val() : 0.1;
            const hold = typeof holdSnap.val() === "number" ? holdSnap.val() : 7;
            const earn = Math.round(p.price * (1 - rate) * 100) / 100;
            await creditWallet(store.ownerUid, earn, {
              type: "credit_store_sale", refId: paymentId, note: `Store sale · ${p.title}`, releaseAt: Date.now() + hold * 86400000,
            });
            if (p.deliveryLink) { toast.success("Payment successful! Opening your product..."); window.open(p.deliveryLink, "_blank"); }
            else toast.success("Payment successful!");
            setSelected(null); setLibOpen(true);
          } catch { toast.error("Payment done but failed to save. Contact the store."); }
        },
      });
    } catch (e: any) { toast.error(e.message); }
  };

  const h = serif ? "font-serif tracking-tight" : "tracking-tight";
  const pageBg = dark ? "bg-foreground text-background" : "bg-background text-foreground";
  const muted = dark ? "text-background/60" : "text-muted-foreground";
  const card = dark ? "bg-background/5 border-background/10" : "bg-card border-border";
  const line = dark ? "border-background/10" : "border-border";
  const sorted = [...shown].sort((a, b) => sort === "low" ? a.price - b.price : sort === "high" ? b.price - a.price : (b.createdAt || 0) - (a.createdAt || 0));
  const openLibrary = () => { if (!user) { setAuthOpen(true); return; } setLibOpen(true); };

  return (
    <div className={`min-h-screen ${pageBg}`}>
      <div className="text-center text-[11px] font-medium py-2 px-4" style={{ background: accent, color: "#fff" }}>
        Instant digital delivery · Secure payments · Lifetime access to your purchases
      </div>
      <header className={`sticky top-0 z-30 backdrop-blur-xl ${dark ? "bg-foreground/80" : "bg-background/80"} border-b ${line}`}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <a href="#top" className="flex items-center gap-3 min-w-0">
            {store.logo ? <img src={store.logo} alt={store.name} className="w-9 h-9 rounded-xl object-cover ring-1 ring-border" />
              : <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold" style={{ background: accent, color: "#fff" }}>{store.name[0]}</div>}
            <span className={`font-bold text-lg truncate ${h}`}>{store.name}</span>
            {store.planFlags?.verifiedBadge && <BadgeCheck size={16} style={{ color: accent }} />}
          </a>
          <nav className={`hidden md:flex items-center gap-6 text-sm ${muted}`}>
            <a href="#products" className="hover:opacity-100">Products</a>
            <a href="#faq">FAQ</a>
            <a href="#contact">Contact</a>
          </nav>
          <button onClick={openLibrary} className={`text-sm font-medium px-4 py-2 rounded-full border ${line} flex items-center gap-2 transition-colors`}>
            <Library size={14} /> My purchases{myOrders.length ? ` (${myOrders.length})` : ""}
          </button>
        </div>
      </header>

      <section id="top" className="relative overflow-hidden">
        {store.banner && <img src={store.banner} alt="" className="absolute inset-0 w-full h-full object-cover scale-105" />}
        <div className={`absolute inset-0 ${store.banner ? "bg-gradient-to-b from-foreground/50 via-foreground/70 to-foreground/95" : ""}`}
          style={store.banner ? undefined : { background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${accent}40, transparent 70%)` }} />
        <div aria-hidden className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl opacity-30 animate-float" style={{ background: accent }} />
        <div aria-hidden className="absolute -bottom-32 -left-24 w-80 h-80 rounded-full blur-3xl opacity-20 animate-float" style={{ background: accent, animationDelay: "1.5s" }} />
        <div className={`relative max-w-6xl mx-auto px-4 animate-fade-in ${theme === "elegant" ? "text-center py-28" : "py-20 md:py-32"}`}>
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border backdrop-blur ${store.banner ? "border-background/30 text-background" : line}`}>
            <Sparkles size={12} /> {store.planFlags?.verifiedBadge ? "Verified Store" : "Official Store"}
          </span>
          <h1 className={`mt-5 font-bold ${h} ${theme === "bold" ? "text-5xl md:text-7xl" : "text-4xl md:text-6xl"} ${store.banner ? "text-background" : ""} max-w-3xl leading-[1.05] ${theme === "elegant" ? "mx-auto" : ""}`}>
            {store.name}
          </h1>
          {store.tagline && <p className={`mt-4 text-base md:text-lg max-w-xl ${theme === "elegant" ? "mx-auto" : ""} ${store.banner ? "text-background/80" : muted}`}>{store.tagline}</p>}
          <div className={`mt-8 flex flex-wrap gap-3 ${theme === "elegant" ? "justify-center" : ""}`}>
            <a href="#products" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium text-sm shadow-lg transition-transform hover:scale-105 active:scale-95" style={{ background: accent, color: "#fff" }}>
              Explore products <ArrowRight size={16} />
            </a>
            <button onClick={openLibrary} className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium text-sm border backdrop-blur ${store.banner ? "border-background/30 text-background" : line}`}>
              <Library size={16} /> Access my purchases
            </button>
          </div>
          <div className={`mt-12 grid grid-cols-3 max-w-md gap-4 ${theme === "elegant" ? "mx-auto" : ""} ${store.banner ? "text-background" : ""}`}>
            {[[products.length, "Products"], [sales || "New", "Sales"], ["24/7", "Access"]].map(([v, l]) => (
              <div key={l as string}><p className="text-2xl md:text-3xl font-bold">{v}</p><p className={`text-xs ${store.banner ? "text-background/70" : muted}`}>{l}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className={`border-y ${line}`}>
        <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[[Zap, "Instant delivery", "Get access right after payment"], [ShieldCheck, "Secure checkout", "UPI, cards & netbanking"], [Infinity, "Lifetime access", "Re-open anytime from My purchases"], [Headphones, "Real support", "Reach the seller directly"]].map(([I, t, d]: any, i) => (
            <div key={t} className="flex items-start gap-3 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${accent}1f`, color: accent }}><I size={16} /></div>
              <div><p className="text-sm font-semibold">{t}</p><p className={`text-[11px] ${muted}`}>{d}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section id="products" className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: accent }}>Catalog</p>
            <h2 className={`text-3xl md:text-4xl font-bold mt-1 ${h}`}>Products</h2>
            <p className={`text-sm mt-1 ${muted}`}>{products.length} item{products.length !== 1 ? "s" : ""} available</p>
          </div>
          <div className="flex gap-2">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-full border ${card} flex-1 md:w-64`}>
              <Search size={14} className={muted} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" className="bg-transparent outline-none text-sm flex-1 min-w-0" />
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className={`px-3 py-2 rounded-full border text-sm bg-transparent ${card}`}>
              <option value="new">Newest</option><option value="low">Price ↑</option><option value="high">Price ↓</option>
            </select>
          </div>
        </div>
        {cats.length > 2 && (
          <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
            {cats.map((c) => (
              <button key={c} onClick={() => setCat(c)} className={`px-4 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-colors ${cat === c ? "" : card}`}
                style={cat === c ? { background: accent, color: "#fff", borderColor: accent } : undefined}>{c}</button>
            ))}
          </div>
        )}
        {sorted.length === 0 ? (
          <div className={`text-center py-20 rounded-3xl border border-dashed ${line}`}><Package className={`mx-auto mb-3 ${muted}`} /><p className={muted}>No products found.</p></div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {sorted.map((p, i) => {
              const owned = myOrders.some((o) => o.productId === p.id);
              return (
                <button key={p.id} onClick={() => setSelected(p)} style={{ animationDelay: `${Math.min(i, 12) * 60}ms` }}
                  className={`group text-left rounded-2xl border overflow-hidden animate-fade-in transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl ${card}`}>
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    {p.originalPrice && p.originalPrice > p.price && <span className="absolute top-2 left-2 z-10 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: accent, color: "#fff" }}>-{Math.round((1 - p.price / p.originalPrice) * 100)}%</span>}
                    {owned && <span className="absolute top-2 right-2 z-10 text-[10px] font-bold px-2 py-0.5 rounded-full bg-background text-foreground">Owned</span>}
                    {p.imageUrl && <img src={p.imageUrl} alt={p.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />}
                    <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 hidden md:block">
                      <span className="block text-center text-xs font-semibold py-2 rounded-full" style={{ background: accent, color: "#fff" }}>View details</span>
                    </div>
                  </div>
                  <div className="p-4">
                    {p.category && <p className={`text-[10px] uppercase tracking-wider ${muted}`}>{p.category}</p>}
                    <p className={`font-semibold text-sm md:text-base mt-1 line-clamp-2 ${h}`}>{p.title}</p>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="font-bold">₹{p.price}</span>
                      {p.originalPrice && p.originalPrice > p.price && <span className={`text-xs line-through ${muted}`}>₹{p.originalPrice}</span>}
                    </div>
                    <p className={`text-[10px] mt-2 flex items-center gap-1 ${muted}`}><Zap size={10} /> Instant delivery</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section id="faq" className={`border-t ${line}`}>
        <div className="max-w-3xl mx-auto px-4 py-16">
          <h2 className={`text-3xl font-bold text-center ${h}`}>Frequently asked questions</h2>
          <div className="mt-8 space-y-3">
            {[
              ["How do I get my product?", "Right after a successful payment your product opens automatically. It is also saved under \"My purchases\" on this store."],
              ["Can I access my purchase again later?", "Yes. Sign in with the same account and tap \"My purchases\" — every product you bought here is saved for lifetime access."],
              ["Which payment methods are accepted?", "UPI, debit/credit cards, netbanking and wallets via Razorpay's secure checkout."],
              ["What if I face an issue?", `Contact ${store.name} using the details below and we'll help you quickly.`],
            ].map(([qq, a]) => (
              <details key={qq} className={`group rounded-2xl border p-4 ${card}`}>
                <summary className="flex items-center justify-between cursor-pointer list-none font-medium text-sm">{qq}<ChevronDown size={16} className="transition-transform group-open:rotate-180" /></summary>
                <p className={`mt-3 text-sm leading-relaxed ${muted}`}>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className={`border-t ${line}`}>
        <div className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-10">
          <div>
            <h2 className={`text-2xl font-bold ${h}`}>About {store.name}</h2>
            <p className={`mt-3 text-sm leading-relaxed whitespace-pre-line ${muted}`}>{store.about || "Welcome to our store."}</p>
          </div>
          <div>
            <h2 className={`text-2xl font-bold ${h}`}>Contact & Support</h2>
            <div className="mt-4 space-y-3 text-sm">
              {store.email && <a href={`mailto:${store.email}`} className="flex items-center gap-3"><Mail size={16} /> {store.email}</a>}
              {store.phone && <a href={`tel:${store.phone}`} className="flex items-center gap-3"><Phone size={16} /> {store.phone}</a>}
              {store.whatsapp && <a href={`https://wa.me/${store.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-3"><MessageCircle size={16} /> WhatsApp</a>}
              {store.instagram && <a href={store.instagram.startsWith("http") ? store.instagram : `https://instagram.com/${store.instagram.replace("@", "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-3"><Instagram size={16} /> {store.instagram}</a>}
              {store.website && <a href={store.website} target="_blank" rel="noreferrer" className="flex items-center gap-3"><Globe size={16} /> {store.website}</a>}
              {store.address && <p className="flex items-center gap-3"><MapPin size={16} /> {store.address}</p>}
            </div>
          </div>
        </div>
        <div className={`border-t ${line}`}>
          <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className={`flex flex-wrap justify-center gap-4 text-xs ${muted}`}>
              {(Object.keys(LEGAL) as LegalKey[]).map((k) => <button key={k} onClick={() => setLegal(k)} className="underline-offset-4 hover:underline">{LEGAL[k].t}</button>)}
            </div>
            <p className={`text-xs ${muted}`}>© {new Date().getFullYear()} {store.name} · Powered by <a href="/" className="underline">ZexoFile Shop</a></p>
          </div>
        </div>
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 bg-foreground/60 backdrop-blur-sm animate-in fade-in duration-200 flex items-end md:items-center justify-center" onClick={() => setSelected(null)}>
          <div className="bg-background text-foreground w-full md:max-w-2xl md:rounded-3xl rounded-t-3xl max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-8 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              {selected.imageUrl && <img src={selected.imageUrl} alt={selected.title} className="w-full aspect-video object-cover rounded-t-3xl" />}
              <button onClick={() => setSelected(null)} className="absolute top-3 right-3 w-9 h-9 rounded-full bg-background/90 flex items-center justify-center"><X size={18} /></button>
            </div>
            <div className="p-6">
              {selected.category && <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{selected.category}</p>}
              <h3 className={`text-2xl font-bold ${h}`}>{selected.title}</h3>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold">₹{selected.price}</span>
                {selected.originalPrice && selected.originalPrice > selected.price && <span className="text-sm line-through text-muted-foreground">₹{selected.originalPrice}</span>}
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><Zap size={12} /> Instant</span>
                <span className="flex items-center gap-1"><Infinity size={12} /> Lifetime access</span>
                <span className="flex items-center gap-1"><ShieldCheck size={12} /> Secure</span>
              </div>
              <p className="mt-4 text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{selected.description}</p>
              {(() => {
                const owned = myOrders.find((o) => o.productId === selected.id && o.deliveryLink);
                return (
                  <div className="flex gap-2 mt-6">
                    {selected.previewLink && (
                      <a href={selected.previewLink} target="_blank" rel="noreferrer" className="flex-1 py-3 border border-border rounded-full text-sm font-medium flex items-center justify-center gap-2"><ExternalLink size={14} /> Preview</a>
                    )}
                    {owned ? (
                      <a href={owned.deliveryLink} target="_blank" rel="noreferrer" className="flex-[2] py-3 rounded-full text-sm font-semibold text-center" style={{ background: accent, color: "#fff" }}>Open your product</a>
                    ) : (
                      <button onClick={() => buy(selected)} className="flex-[2] py-3 rounded-full text-sm font-semibold" style={{ background: accent, color: "#fff" }}>Buy now · ₹{selected.price}</button>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {libOpen && (
        <Sheet onClose={() => setLibOpen(false)} title="My purchases">
          {myOrders.length === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">You haven't bought anything from {store.name} yet.</p> : (
            <div className="space-y-2">
              {myOrders.map((o, i) => (
                <div key={i} className="flex items-center gap-3 p-3 border border-border rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{o.productTitle}</p>
                    <p className="text-[11px] text-muted-foreground">₹{o.price} · {new Date(o.purchasedAt).toLocaleDateString()}</p>
                  </div>
                  {o.deliveryLink ? <a href={o.deliveryLink} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: accent, color: "#fff" }}>Access</a>
                    : <span className="text-[11px] text-muted-foreground">Contact store</span>}
                </div>
              ))}
            </div>
          )}
        </Sheet>
      )}

      {legal && (
        <Sheet onClose={() => setLegal(null)} title={LEGAL[legal].t}>
          <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{LEGAL[legal].b}</div>
        </Sheet>
      )}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
};

const Sheet: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 bg-foreground/60 backdrop-blur-sm animate-in fade-in duration-200 flex items-end md:items-center justify-center" onClick={onClose}>
    <div className="bg-background text-foreground w-full md:max-w-xl md:rounded-3xl rounded-t-3xl max-h-[85vh] overflow-y-auto p-6 animate-in slide-in-from-bottom-8 duration-300" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-4"><h3 className="text-xl font-bold">{title}</h3><button onClick={onClose}><X size={18} /></button></div>
      {children}
    </div>
  </div>
);

export default StorePage;
