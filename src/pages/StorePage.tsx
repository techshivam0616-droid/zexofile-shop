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

const StorePage = () => {
  const { slug = "" } = useParams();
  const { user } = useAuth();
  const [store, setStore] = useState<Store | null | undefined>(undefined);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [selected, setSelected] = useState<StoreProduct | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");

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
            const rate = typeof rateSnap.val() === "number" ? rateSnap.val() : 0.1;
            const hold = typeof holdSnap.val() === "number" ? holdSnap.val() : 7;
            const earn = Math.round(p.price * (1 - rate) * 100) / 100;
            await creditWallet(store.ownerUid, earn, {
              type: "credit_store_sale", refId: paymentId, note: `Store sale · ${p.title}`, releaseAt: Date.now() + hold * 86400000,
            });
            if (p.deliveryLink) { toast.success("Payment successful! Opening your product..."); window.open(p.deliveryLink, "_blank"); }
            else toast.success("Payment successful!");
            setSelected(null);
          } catch { toast.error("Payment done but failed to save. Contact the store."); }
        },
      });
    } catch (e: any) { toast.error(e.message); }
  };

  const h = serif ? "font-serif tracking-tight" : "tracking-tight";
  const pageBg = dark ? "bg-foreground text-background" : "bg-background text-foreground";
  const muted = dark ? "text-background/60" : "text-muted-foreground";
  const card = dark ? "bg-background/5 border-background/10" : "bg-card border-border";

  return (
    <div className={`min-h-screen ${pageBg}`}>
      {/* Nav */}
      <header className={`sticky top-0 z-30 backdrop-blur-md ${dark ? "bg-foreground/80 border-background/10" : "bg-background/80 border-border"} border-b`}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {store.logo ? <img src={store.logo} alt={store.name} className="w-9 h-9 rounded-xl object-cover" />
              : <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold" style={{ background: accent, color: "#fff" }}>{store.name[0]}</div>}
            <span className={`font-bold text-lg truncate ${h}`}>{store.name}</span>
          </div>
          <a href="#contact" className="text-sm font-medium px-4 py-2 rounded-full" style={{ background: accent, color: "#fff" }}>Contact</a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {store.banner && <img src={store.banner} alt="" className="absolute inset-0 w-full h-full object-cover" />}
        <div className={`absolute inset-0 ${store.banner ? "bg-gradient-to-b from-foreground/40 via-foreground/60 to-foreground/90" : ""}`}
          style={store.banner ? undefined : { background: `radial-gradient(ellipse at top, ${accent}33, transparent 70%)` }} />
        <div className={`relative max-w-6xl mx-auto px-4 ${theme === "elegant" ? "text-center py-28" : "py-24 md:py-32"}`}>
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border ${store.banner ? "border-background/30 text-background" : dark ? "border-background/20" : "border-border"}`}>
            <Sparkles size={12} /> Official Store
          </span>
          <h1 className={`mt-5 font-bold ${h} ${theme === "bold" ? "text-5xl md:text-7xl" : "text-4xl md:text-6xl"} ${store.banner ? "text-background" : ""} max-w-3xl ${theme === "elegant" ? "mx-auto" : ""}`}>
            {store.name}
          </h1>
          {store.tagline && <p className={`mt-4 text-base md:text-lg max-w-xl ${theme === "elegant" ? "mx-auto" : ""} ${store.banner ? "text-background/80" : muted}`}>{store.tagline}</p>}
          <a href="#products" className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium text-sm shadow-lg" style={{ background: accent, color: "#fff" }}>
            Explore products <ArrowRight size={16} />
          </a>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h2 className={`text-3xl font-bold ${h}`}>Products</h2>
            <p className={`text-sm mt-1 ${muted}`}>{products.length} item{products.length !== 1 ? "s" : ""} available</p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-full border ${card} md:w-72`}>
            <Search size={14} className={muted} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" className="bg-transparent outline-none text-sm flex-1" />
          </div>
        </div>
        {cats.length > 2 && (
          <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
            {cats.map((c) => (
              <button key={c} onClick={() => setCat(c)} className={`px-4 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap ${cat === c ? "" : card}`}
                style={cat === c ? { background: accent, color: "#fff", borderColor: accent } : undefined}>{c}</button>
            ))}
          </div>
        )}
        {shown.length === 0 ? (
          <p className={`text-center py-16 ${muted}`}>No products yet.</p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {shown.map((p) => (
              <button key={p.id} onClick={() => setSelected(p)} className={`group text-left rounded-2xl border overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl ${card}`}>
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  {p.imageUrl && <img src={p.imageUrl} alt={p.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                </div>
                <div className="p-4">
                  {p.category && <p className={`text-[10px] uppercase tracking-wider ${muted}`}>{p.category}</p>}
                  <p className={`font-semibold text-sm md:text-base mt-1 line-clamp-2 ${h}`}>{p.title}</p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="font-bold">₹{p.price}</span>
                    {p.originalPrice && p.originalPrice > p.price && <span className={`text-xs line-through ${muted}`}>₹{p.originalPrice}</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* About + contact */}
      <section id="contact" className={`border-t ${dark ? "border-background/10" : "border-border"}`}>
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
        <p className={`text-center text-xs pb-8 ${muted}`}>© {new Date().getFullYear()} {store.name} · Powered by <a href="/" className="underline">ZexoFile Shop</a></p>
      </section>

      {/* Product sheet */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-foreground/60 flex items-end md:items-center justify-center" onClick={() => setSelected(null)}>
          <div className="bg-background text-foreground w-full md:max-w-2xl md:rounded-3xl rounded-t-3xl max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              {selected.imageUrl && <img src={selected.imageUrl} alt={selected.title} className="w-full aspect-video object-cover md:rounded-t-3xl rounded-t-3xl" />}
              <button onClick={() => setSelected(null)} className="absolute top-3 right-3 w-9 h-9 rounded-full bg-background/90 flex items-center justify-center"><X size={18} /></button>
            </div>
            <div className="p-6">
              <h3 className={`text-2xl font-bold ${h}`}>{selected.title}</h3>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold">₹{selected.price}</span>
                {selected.originalPrice && selected.originalPrice > selected.price && <span className="text-sm line-through text-muted-foreground">₹{selected.originalPrice}</span>}
              </div>
              <p className="mt-4 text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{selected.description}</p>
              <div className="flex gap-2 mt-6">
                {selected.previewLink && (
                  <a href={selected.previewLink} target="_blank" rel="noreferrer" className="flex-1 py-3 border border-border rounded-full text-sm font-medium flex items-center justify-center gap-2"><ExternalLink size={14} /> Preview</a>
                )}
                <button onClick={() => buy(selected)} className="flex-[2] py-3 rounded-full text-sm font-semibold" style={{ background: accent, color: "#fff" }}>Buy now · ₹{selected.price}</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
};

export default StorePage;
