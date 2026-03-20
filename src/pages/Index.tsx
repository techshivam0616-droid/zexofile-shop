import React, { useState, useEffect } from "react";
import { ref, onValue, push } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import StatsSection from "@/components/StatsSection";
import ProductGrid, { Product } from "@/components/ProductGrid";
import FeedbackSection from "@/components/FeedbackSection";
import FooterSection from "@/components/FooterSection";
import AuthModal from "@/components/AuthModal";
import ProductDetail from "@/components/ProductDetail";
import ProfileModal from "@/components/ProfileModal";
import CustomProjectModal from "@/components/CustomProjectModal";
import MaintenanceScreen from "@/components/MaintenanceScreen";
import SearchModal from "@/components/SearchModal";
import CartModal from "@/components/CartModal";
import LegalPages from "@/components/LegalPages";
import AboutFounders from "@/components/AboutFounders";
import FloatingChat from "@/components/FloatingChat";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { GraduationCap, Globe, Wrench, Search, CreditCard, Infinity, Gem, Zap, Palette, MessageSquare, Mail, ShieldCheck, FileText, HelpCircle, BookOpen, Award } from "lucide-react";
import { toast } from "sonner";

const RAZORPAY_KEY = "rzp_live_SPo0RmeNnQGYT7";

const Index = () => {
  const { user, isAdmin, loading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [authOpen, setAuthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [cart, setCart] = useState<Product[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [legalPage, setLegalPage] = useState<string | null>(null);
  const [maintenance, setMaintenance] = useState(false);
  const [maintenanceChecked, setMaintenanceChecked] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setMaintenanceChecked(true);
    }, 3000);
    const unsub = onValue(ref(db, "siteSettings/maintenance"), (snap) => {
      setMaintenance(snap.val() === true);
      setMaintenanceChecked(true);
      clearTimeout(timeout);
    });
    return () => { unsub(); clearTimeout(timeout); };
  }, []);

  useEffect(() => {
    const unsub = onValue(ref(db, "products"), (snap) => {
      const data = snap.val();
      if (data) {
        setProducts(Object.entries(data).map(([id, val]: any) => ({ id, ...val })));
      }
    });
    return () => unsub();
  }, []);

  const bestSellingProducts = products.filter(p => p.bestSelling);

  const handleAddToCart = (product: Product) => {
    if (!user) { setAuthOpen(true); return; }
    if (cart.find(c => c.id === product.id)) {
      toast("Already in cart");
      return;
    }
    setCart([...cart, product]);
    toast("Added to cart!");
  };

  const handleRemoveFromCart = (id: string) => {
    setCart(cart.filter(c => c.id !== id));
  };

  const handleBuy = (product: Product, discount: number = 0) => {
    if (!user) { setAuthOpen(true); return; }
    const finalPrice = Math.round(product.price * (1 - discount / 100) * 100);

    const options = {
      key: RAZORPAY_KEY,
      amount: finalPrice,
      currency: "INR",
      name: "ZexoFile Shop",
      description: product.title,
      handler: async (response: any) => {
        try {
          await push(ref(db, `purchases/${user.uid}`), {
            productId: product.id,
            productTitle: product.title,
            price: finalPrice / 100,
            razorpayPaymentId: response.razorpay_payment_id,
            purchasedAt: Date.now(),
            downloadLink: product.previewLink || "",
          });
          setCart(cart.filter(c => c.id !== product.id));
          toast.success("Payment successful! Check your profile for purchase history.");
        } catch (err) {
          console.error("Purchase save error:", err);
          toast.error("Payment done but failed to save. Contact support.");
        }
      },
      prefill: {
        name: user.displayName || "",
        email: user.email || "",
      },
      theme: {
        color: "#000000",
      },
      modal: {
        ondismiss: () => {
          toast("Payment cancelled");
        },
      },
    };

    try {
      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", (response: any) => {
        toast.error("Payment failed: " + (response.error?.description || "Unknown error"));
      });
      rzp.open();
    } catch (err) {
      console.error("Razorpay error:", err);
      toast.error("Payment gateway not available. Please try again.");
    }
  };

  const handleNavigate = (section: string) => {
    if (section === "home") window.scrollTo({ top: 0, behavior: "smooth" });
    if (section === "all-products") document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
    if (section === "custom-project") {
      if (!user) { setAuthOpen(true); return; }
      setCustomOpen(true);
    }
    if (section === "contact") document.getElementById("footer")?.scrollIntoView({ behavior: "smooth" });
  };

  if (maintenanceChecked && maintenance && !isAdmin) {
    return <MaintenanceScreen onAdminLogin={() => setAuthOpen(true)} authOpen={authOpen} onAuthClose={() => setAuthOpen(false)} />;
  }

  if (loading || !maintenanceChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        onNavigate={handleNavigate}
        onCartOpen={() => setCartOpen(true)}
        onAuthOpen={() => setAuthOpen(true)}
        onProfileOpen={() => setProfileOpen(true)}
        onSearchOpen={() => setSearchOpen(true)}
        cartCount={cart.length}
      />

      {maintenance && isAdmin && (
        <div className="bg-warning/20 border-b border-warning px-4 py-2 text-center text-xs font-medium text-foreground">
          ⚠️ Maintenance mode is ON — only you (admin) can see the site.
        </div>
      )}

      <main>
        <HeroSection onShopNow={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })} />
        <StatsSection />

        <div id="products">
          {bestSellingProducts.length > 0 ? (
            <ProductGrid products={bestSellingProducts} onProductClick={setSelectedProduct} onAddToCart={handleAddToCart} title="Best Selling Products" subtitle="People are loving these!" />
          ) : (
            <ProductGrid products={products} onProductClick={setSelectedProduct} onAddToCart={handleAddToCart} />
          )}
        </div>

        {bestSellingProducts.length > 0 && products.length > bestSellingProducts.length && (
          <ProductGrid products={products.filter(p => !p.bestSelling)} onProductClick={setSelectedProduct} onAddToCart={handleAddToCart} title="All Products" subtitle="Browse our full collection" />
        )}

        <AboutFounders />
        <FeedbackSection />

        {/* What we offer */}
        <section className="px-4 py-10 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center justify-center gap-2">
            <Gem size={22} /> What We Offer
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              { icon: <GraduationCap size={28} className="text-foreground" />, title: "Online Courses", desc: "Learn and build with lifetime access" },
              { icon: <Globe size={28} className="text-foreground" />, title: "Ready-made Websites", desc: "Beautiful, customisable website templates" },
              { icon: <Wrench size={28} className="text-foreground" />, title: "Custom Projects", desc: "Get a tailor-made solution for your needs" },
            ].map((item) => (
              <div key={item.title} className="bg-muted rounded-xl p-6 flex flex-col items-center">
                <div className="mb-3">{item.icon}</div>
                <p className="font-semibold text-foreground text-sm">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
          <button onClick={() => setLegalPage("what-we-offer")} className="mt-4 text-xs text-muted-foreground underline hover:text-foreground">Learn more</button>
        </section>

        {/* How to Buy */}
        <section className="px-4 py-10">
          <h2 className="text-2xl font-bold text-foreground text-center mb-6 flex items-center justify-center gap-2">
            <CreditCard size={22} /> How to Buy
          </h2>
          <div className="space-y-4 max-w-md mx-auto">
            {[
              { icon: <Search size={18} />, text: "Browse our collection and choose a product" },
              { icon: <CreditCard size={18} />, text: "Click 'Buy it now' and complete payment via Razorpay" },
              { icon: <Infinity size={18} />, text: "Get instant lifetime access to your purchase" },
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">{s.icon}</div>
                <p className="text-sm text-foreground pt-1">{s.text}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <button onClick={() => setLegalPage("how-to-use")} className="mt-4 text-xs text-muted-foreground underline hover:text-foreground">Detailed guide</button>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="px-4 py-10 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center justify-center gap-2">
            <ShieldCheck size={22} /> Why Choose Us
          </h2>
          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
            {[
              { icon: <Gem size={24} className="text-foreground" />, text: "Premium Quality" },
              { icon: <Zap size={24} className="text-foreground" />, text: "Fast Delivery" },
              { icon: <Palette size={24} className="text-foreground" />, text: "Fully Customisable" },
              { icon: <MessageSquare size={24} className="text-foreground" />, text: "24/7 Support" },
            ].map((item) => (
              <div key={item.text} className="bg-muted rounded-xl p-4 flex flex-col items-center">
                <div className="mb-2">{item.icon}</div>
                <p className="text-xs font-medium text-foreground">{item.text}</p>
              </div>
            ))}
          </div>
          <button onClick={() => setLegalPage("why-choose-us")} className="mt-4 text-xs text-muted-foreground underline hover:text-foreground">Read more</button>
        </section>

        {/* Contact */}
        <section className="px-4 py-10 text-center" id="contact">
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center justify-center gap-2">
            <Mail size={22} /> Contact Us
          </h2>
          <p className="text-sm text-muted-foreground">Have questions? Reach out to us!</p>
          <a href="mailto:ZexoFile@gmail.com"
            className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-medium">
            <Mail size={14} /> ZexoFile@gmail.com
          </a>
        </section>

        {/* Legal Links */}
        <section className="px-4 py-10 max-w-lg mx-auto">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2"><FileText size={18} /> Legal & Info</h2>
          <div className="space-y-2">
            {[
              { key: "privacy-policy", label: "Privacy Policy", icon: <ShieldCheck size={14} /> },
              { key: "terms", label: "Terms of Service", icon: <BookOpen size={14} /> },
              { key: "refund-policy", label: "Refund Policy", icon: <FileText size={14} /> },
              { key: "faq", label: "FAQ", icon: <HelpCircle size={14} /> },
              { key: "what-we-offer", label: "What We Offer", icon: <Gem size={14} /> },
              { key: "how-to-use", label: "How to Use", icon: <Award size={14} /> },
              { key: "why-choose-us", label: "Why Choose Us", icon: <ShieldCheck size={14} /> },
            ].map(item => (
              <button key={item.key} onClick={() => setLegalPage(item.key)}
                className="w-full text-left py-3 px-4 bg-muted rounded-lg text-sm text-foreground font-medium flex items-center gap-2 hover:bg-accent transition-colors">
                {item.icon} {item.label}
              </button>
            ))}
          </div>
        </section>
      </main>

      <div id="footer">
        <FooterSection />
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
      <ProductDetail product={selectedProduct} onClose={() => setSelectedProduct(null)} onBuy={(p) => handleBuy(p, 0)} onAddToCart={handleAddToCart} />
      <CustomProjectModal open={customOpen} onClose={() => setCustomOpen(false)} />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} products={products} onProductClick={(p) => { setSelectedProduct(p); setSearchOpen(false); }} />
      <CartModal open={cartOpen} onClose={() => setCartOpen(false)} items={cart} onRemove={handleRemoveFromCart} onBuy={handleBuy} />
      {legalPage && <LegalPages page={legalPage} onClose={() => setLegalPage(null)} />}
      <WhatsAppFloat />
      <FloatingChat />
    </div>
  );
};

export default Index;
