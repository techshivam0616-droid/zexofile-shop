import React, { useState, useEffect } from "react";
import {
  ArrowLeft, Plus, Trash2, Edit, Image, Sliders, Users, FolderOpen,
  Settings, Power, PowerOff, Save, Star, ChevronDown, ChevronUp,
  Globe, GraduationCap, Package, Eye, ToggleLeft, ToggleRight,
  FileText, Shield, Mail, Type, AlignLeft, Tag, BarChart3, DollarSign,
  ShoppingCart, TrendingUp, Layers, HelpCircle, BookOpen, MessageSquare, Check, X as XIcon
} from "lucide-react";
import { Feedback } from "@/components/FeedbackSection";
import { ref, push, set, remove, onValue, get, update } from "firebase/database";
import { db } from "@/lib/firebase";
import { Product } from "@/components/ProductGrid";

interface AdminPanelProps {
  onClose: () => void;
}

interface CustomProject {
  id: string;
  title: string;
  type: string;
  description: string;
  budget: string;
  contact: string;
  userEmail: string;
  status: string;
  createdAt: number;
}

interface SliderItem {
  id?: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  link: string;
}

interface Coupon {
  id?: string;
  code: string;
  discount: number;
  active: boolean;
}

type TabKey = "dashboard" | "products" | "categories" | "sliders" | "coupons" | "projects" | "users" | "feedbacks" | "messages" | "settings";

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [tab, setTab] = useState<TabKey>("dashboard");
  const [products, setProducts] = useState<(Product & { id: string })[]>([]);
  const [projects, setProjects] = useState<CustomProject[]>([]);
  const [sliders, setSliders] = useState<(SliderItem & { id: string })[]>([]);
  const [coupons, setCoupons] = useState<(Coupon & { id: string })[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [allPurchases, setAllPurchases] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editProduct, setEditProduct] = useState<(Product & { id: string }) | null>(null);
  const [form, setForm] = useState({
    title: "", type: "website" as "course" | "website", price: "", originalPrice: "",
    imageUrl: "", description: "", previewLink: "", bestSelling: false, category: "",
  });

  const [showSliderForm, setShowSliderForm] = useState(false);
  const [sliderForm, setSliderForm] = useState<SliderItem>({ title: "", subtitle: "", imageUrl: "", link: "" });
  const [editSlider, setEditSlider] = useState<(SliderItem & { id: string }) | null>(null);

  const [showCouponForm, setShowCouponForm] = useState(false);
  const [couponForm, setCouponForm] = useState({ code: "", discount: "", active: true });
  const [editCoupon, setEditCoupon] = useState<(Coupon & { id: string }) | null>(null);

  const [newCategory, setNewCategory] = useState("");
  const [allFeedbacks, setAllFeedbacks] = useState<Feedback[]>([]);

  const [siteSettings, setSiteSettings] = useState<any>({
    maintenance: false, aboutText: "", contactEmail: "ZexoFile@gmail.com",
    announcements: ["For any issues, mail at ZexoFile@gmail.com"],
    refundPolicy: "", privacyPolicy: "", termsOfService: "", faq: "",
    shopName: "ZexoFile Shop",
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    const unsubs: (() => void)[] = [];

    unsubs.push(onValue(ref(db, "products"), (snap) => {
      const data = snap.val();
      setProducts(data ? Object.entries(data).map(([id, val]: any) => ({ id, ...val })) : []);
    }));

    unsubs.push(onValue(ref(db, "customProjects"), (snap) => {
      const data = snap.val();
      setProjects(data ? Object.entries(data).map(([id, val]: any) => ({ id, ...val })) : []);
    }));

    unsubs.push(onValue(ref(db, "sliders"), (snap) => {
      const data = snap.val();
      setSliders(data ? Object.entries(data).map(([id, val]: any) => ({ id, ...val })) : []);
    }));

    unsubs.push(onValue(ref(db, "coupons"), (snap) => {
      const data = snap.val();
      setCoupons(data ? Object.entries(data).map(([id, val]: any) => ({ id, ...val })) : []);
    }));

    unsubs.push(onValue(ref(db, "categories"), (snap) => {
      const data = snap.val();
      setCategories(data ? Object.entries(data).map(([id, val]: any) => ({ id, name: val.name })) : []);
    }));

    unsubs.push(onValue(ref(db, "siteSettings"), (snap) => {
      const data = snap.val();
      if (data) setSiteSettings((prev: any) => ({ ...prev, ...data }));
    }));

    unsubs.push(onValue(ref(db, "purchases"), (snap) => {
      const data = snap.val();
      if (data) {
        const all: any[] = [];
        Object.values(data).forEach((userPurchases: any) => {
          Object.values(userPurchases).forEach((p: any) => all.push(p));
        });
        setAllPurchases(all);
      }
    }));

    unsubs.push(onValue(ref(db, "feedbacks"), (snap) => {
      const data = snap.val();
      if (data) {
        setAllFeedbacks(Object.entries(data).map(([id, val]: any) => ({ id, ...val })).sort((a: any, b: any) => b.createdAt - a.createdAt));
      } else {
        setAllFeedbacks([]);
      }
    }));

    return () => unsubs.forEach(u => u());
  }, []);

  const totalRevenue = allPurchases.reduce((s, p) => s + (p.price || 0), 0);
  const totalPurchases = allPurchases.length;

  // Product CRUD
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const productData = {
      title: form.title, type: form.type,
      price: parseFloat(form.price),
      originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : null,
      imageUrl: form.imageUrl, description: form.description,
      previewLink: form.previewLink,
      bestSelling: form.bestSelling, category: form.category,
    };
    if (editProduct) {
      await set(ref(db, `products/${editProduct.id}`), productData);
    } else {
      await push(ref(db, "products"), productData);
    }
    resetForm();
  };

  const resetForm = () => {
    setForm({ title: "", type: "website", price: "", originalPrice: "", imageUrl: "", description: "", previewLink: "", bestSelling: false, category: "" });
    setShowAddForm(false);
    setEditProduct(null);
  };

  const handleEditProduct = (p: Product & { id: string }) => {
    setEditProduct(p);
    setForm({
      title: p.title, type: p.type, price: String(p.price), originalPrice: String(p.originalPrice || ""),
      imageUrl: p.imageUrl, description: p.description, previewLink: p.previewLink || "",
      bestSelling: p.bestSelling || false, category: p.category || "",
    });
    setShowAddForm(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm("Delete this product?")) await remove(ref(db, `products/${id}`));
  };

  // Slider CRUD
  const handleSaveSlider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editSlider) {
      await set(ref(db, `sliders/${editSlider.id}`), sliderForm);
    } else {
      await push(ref(db, "sliders"), sliderForm);
    }
    setSliderForm({ title: "", subtitle: "", imageUrl: "", link: "" });
    setShowSliderForm(false);
    setEditSlider(null);
  };

  const handleEditSlider = (s: SliderItem & { id: string }) => {
    setEditSlider(s);
    setSliderForm({ title: s.title, subtitle: s.subtitle, imageUrl: s.imageUrl, link: s.link });
    setShowSliderForm(true);
  };

  const handleDeleteSlider = async (id: string) => {
    if (confirm("Delete this slide?")) await remove(ref(db, `sliders/${id}`));
  };

  // Coupon CRUD
  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { code: couponForm.code, discount: parseFloat(couponForm.discount), active: couponForm.active };
    if (editCoupon) {
      await set(ref(db, `coupons/${editCoupon.id}`), data);
    } else {
      await push(ref(db, "coupons"), data);
    }
    setCouponForm({ code: "", discount: "", active: true });
    setShowCouponForm(false);
    setEditCoupon(null);
  };

  // Category CRUD
  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    await push(ref(db, "categories"), { name: newCategory.trim() });
    setNewCategory("");
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm("Delete this category?")) await remove(ref(db, `categories/${id}`));
  };

  // Settings
  const handleSaveSettings = async () => {
    await set(ref(db, "siteSettings"), siteSettings);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  const toggleMaintenance = async () => {
    const newVal = !siteSettings.maintenance;
    setSiteSettings({ ...siteSettings, maintenance: newVal });
    await set(ref(db, "siteSettings/maintenance"), newVal);
  };

  const updateProjectStatus = async (id: string, status: string) => {
    await set(ref(db, `customProjects/${id}/status`), status);
  };

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "dashboard", label: "Stats", icon: <BarChart3 size={14} /> },
    { key: "products", label: "Products", icon: <Package size={14} /> },
    { key: "categories", label: "Category", icon: <Layers size={14} /> },
    { key: "sliders", label: "Sliders", icon: <Image size={14} /> },
    { key: "coupons", label: "Coupons", icon: <Tag size={14} /> },
    { key: "projects", label: "Requests", icon: <FolderOpen size={14} /> },
    { key: "users", label: "Users", icon: <Users size={14} /> },
    { key: "feedbacks", label: "Feedback", icon: <MessageSquare size={14} /> },
    { key: "settings", label: "Settings", icon: <Settings size={14} /> },
  ];

  const toggleFeedbackApproval = async (id: string, currentApproved: boolean) => {
    await set(ref(db, `feedbacks/${id}/approved`), !currentApproved);
  };

  const deleteFeedback = async (id: string) => {
    if (confirm("Delete this feedback?")) await remove(ref(db, `feedbacks/${id}`));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background overflow-y-auto">
      <div className="sticky top-0 bg-background border-b px-4 py-3 flex items-center gap-3 z-10">
        <button onClick={onClose} className="text-foreground"><ArrowLeft size={22} /></button>
        <Shield size={18} className="text-foreground" />
        <span className="text-lg font-semibold text-foreground">Admin Panel</span>
      </div>

      <div className="flex border-b overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`py-3 px-3 text-xs font-medium transition-colors flex items-center justify-center gap-1 min-w-[60px] whitespace-nowrap ${tab === t.key ? "text-foreground border-b-2 border-foreground" : "text-muted-foreground"}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {/* === DASHBOARD === */}
        {tab === "dashboard" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted rounded-xl p-4 text-center">
                <DollarSign size={24} className="mx-auto text-foreground mb-2" />
                <p className="text-2xl font-bold text-foreground">Rs. {totalRevenue.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
              </div>
              <div className="bg-muted rounded-xl p-4 text-center">
                <ShoppingCart size={24} className="mx-auto text-foreground mb-2" />
                <p className="text-2xl font-bold text-foreground">{totalPurchases}</p>
                <p className="text-xs text-muted-foreground">Total Purchases</p>
              </div>
              <div className="bg-muted rounded-xl p-4 text-center">
                <Package size={24} className="mx-auto text-foreground mb-2" />
                <p className="text-2xl font-bold text-foreground">{products.length}</p>
                <p className="text-xs text-muted-foreground">Total Products</p>
              </div>
              <div className="bg-muted rounded-xl p-4 text-center">
                <FolderOpen size={24} className="mx-auto text-foreground mb-2" />
                <p className="text-2xl font-bold text-foreground">{projects.length}</p>
                <p className="text-xs text-muted-foreground">Custom Requests</p>
              </div>
            </div>

            {/* Recent Purchases */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><TrendingUp size={14} /> Recent Purchases</h3>
              {allPurchases.length === 0 ? (
                <p className="text-sm text-muted-foreground">No purchases yet.</p>
              ) : (
                <div className="space-y-2">
                  {allPurchases.slice(-10).reverse().map((p, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-foreground">{p.productTitle}</p>
                        <p className="text-xs text-muted-foreground">{new Date(p.purchasedAt).toLocaleDateString()}</p>
                      </div>
                      <span className="text-sm font-semibold text-foreground">Rs. {p.price}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* === PRODUCTS TAB === */}
        {tab === "products" && (
          <>
            <button onClick={() => { resetForm(); setShowAddForm(true); }}
              className="w-full py-3 mb-4 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground flex items-center justify-center gap-2 hover:border-foreground hover:text-foreground transition-colors">
              <Plus size={16} /> Add Product
            </button>

            {showAddForm && (
              <form onSubmit={handleSaveProduct} className="bg-muted rounded-xl p-4 mb-4 space-y-3">
                <input placeholder="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground outline-none" />
                <div className="grid grid-cols-2 gap-3">
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "course" | "website" })}
                    className="px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground outline-none">
                    <option value="website">Website</option>
                    <option value="course">Course</option>
                  </select>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground outline-none">
                    <option value="">No Category</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Price" type="number" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground outline-none" />
                  <input placeholder="Original Price" type="number" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                    className="px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground outline-none" />
                </div>
                <input placeholder="Image URL" required value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground outline-none" />
                <input placeholder="Razorpay Payment Link" required value={form.razorpayLink} onChange={(e) => setForm({ ...form, razorpayLink: e.target.value })}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground outline-none" />
                <input placeholder="Preview/Demo Link" value={form.previewLink} onChange={(e) => setForm({ ...form, previewLink: e.target.value })}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground outline-none" />
                <textarea placeholder="Description" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground outline-none min-h-[80px]" />

                <button type="button" onClick={() => setForm({ ...form, bestSelling: !form.bestSelling })}
                  className="w-full flex items-center justify-between px-3 py-2.5 border border-border rounded-lg text-sm bg-background">
                  <span className="flex items-center gap-2 text-foreground"><Star size={14} /> Best Selling</span>
                  {form.bestSelling ? <ToggleRight size={22} className="text-primary" /> : <ToggleLeft size={22} className="text-muted-foreground" />}
                </button>

                <div className="flex gap-2">
                  <button type="submit" className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center justify-center gap-1">
                    <Save size={14} /> {editProduct ? "Update" : "Add Product"}
                  </button>
                  <button type="button" onClick={resetForm} className="px-4 py-2.5 border border-border rounded-lg text-sm text-muted-foreground">Cancel</button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {products.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                  <img src={p.imageUrl} alt={p.title} className="w-14 h-14 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate flex items-center gap-1">
                      {p.bestSelling && <Star size={12} className="text-rating shrink-0" />}
                      {p.title}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      {p.type === "course" ? <GraduationCap size={10} /> : <Globe size={10} />}
                      Rs. {p.price} · {p.type} {p.category && `· ${p.category}`}
                    </p>
                  </div>
                  <button onClick={() => handleEditProduct(p)} className="text-muted-foreground hover:text-foreground"><Edit size={16} /></button>
                  <button onClick={() => handleDeleteProduct(p.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={16} /></button>
                </div>
              ))}
              {products.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No products yet.</p>}
            </div>
          </>
        )}

        {/* === CATEGORIES TAB === */}
        {tab === "categories" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input placeholder="Category name" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
                className="flex-1 px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground outline-none" />
              <button onClick={handleAddCategory} className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-1">
                <Plus size={14} /> Add
              </button>
            </div>
            <div className="space-y-2">
              {categories.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-muted rounded-xl">
                  <span className="text-sm font-medium text-foreground flex items-center gap-2"><Layers size={14} /> {c.name}</span>
                  <button onClick={() => handleDeleteCategory(c.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={16} /></button>
                </div>
              ))}
              {categories.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No categories yet.</p>}
            </div>
          </div>
        )}

        {/* === SLIDERS TAB === */}
        {tab === "sliders" && (
          <>
            <button onClick={() => { setSliderForm({ title: "", subtitle: "", imageUrl: "", link: "" }); setEditSlider(null); setShowSliderForm(true); }}
              className="w-full py-3 mb-4 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground flex items-center justify-center gap-2 hover:border-foreground hover:text-foreground transition-colors">
              <Plus size={16} /> Add Slide
            </button>

            {showSliderForm && (
              <form onSubmit={handleSaveSlider} className="bg-muted rounded-xl p-4 mb-4 space-y-3">
                <input placeholder="Slide Title" required value={sliderForm.title} onChange={(e) => setSliderForm({ ...sliderForm, title: e.target.value })}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground outline-none" />
                <input placeholder="Subtitle" value={sliderForm.subtitle} onChange={(e) => setSliderForm({ ...sliderForm, subtitle: e.target.value })}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground outline-none" />
                <input placeholder="Image URL" required value={sliderForm.imageUrl} onChange={(e) => setSliderForm({ ...sliderForm, imageUrl: e.target.value })}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground outline-none" />
                <input placeholder="Link (optional)" value={sliderForm.link} onChange={(e) => setSliderForm({ ...sliderForm, link: e.target.value })}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground outline-none" />
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center justify-center gap-1">
                    <Save size={14} /> {editSlider ? "Update" : "Add Slide"}
                  </button>
                  <button type="button" onClick={() => { setShowSliderForm(false); setEditSlider(null); }} className="px-4 py-2.5 border border-border rounded-lg text-sm text-muted-foreground">Cancel</button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {sliders.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                  <img src={s.imageUrl} alt={s.title} className="w-14 h-14 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{s.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{s.subtitle}</p>
                  </div>
                  <button onClick={() => handleEditSlider(s)} className="text-muted-foreground hover:text-foreground"><Edit size={16} /></button>
                  <button onClick={() => handleDeleteSlider(s.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={16} /></button>
                </div>
              ))}
              {sliders.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No slides yet.</p>}
            </div>
          </>
        )}

        {/* === COUPONS TAB === */}
        {tab === "coupons" && (
          <>
            <button onClick={() => { setCouponForm({ code: "", discount: "", active: true }); setEditCoupon(null); setShowCouponForm(true); }}
              className="w-full py-3 mb-4 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground flex items-center justify-center gap-2 hover:border-foreground hover:text-foreground transition-colors">
              <Plus size={16} /> Add Coupon
            </button>

            {showCouponForm && (
              <form onSubmit={handleSaveCoupon} className="bg-muted rounded-xl p-4 mb-4 space-y-3">
                <input placeholder="Coupon Code (e.g. SAVE20)" required value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground outline-none" />
                <input placeholder="Discount %" type="number" required value={couponForm.discount}
                  onChange={(e) => setCouponForm({ ...couponForm, discount: e.target.value })}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground outline-none" />
                <button type="button" onClick={() => setCouponForm({ ...couponForm, active: !couponForm.active })}
                  className="w-full flex items-center justify-between px-3 py-2.5 border border-border rounded-lg text-sm bg-background">
                  <span className="text-foreground">Active</span>
                  {couponForm.active ? <ToggleRight size={22} className="text-primary" /> : <ToggleLeft size={22} className="text-muted-foreground" />}
                </button>
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center justify-center gap-1">
                    <Save size={14} /> {editCoupon ? "Update" : "Add Coupon"}
                  </button>
                  <button type="button" onClick={() => { setShowCouponForm(false); setEditCoupon(null); }} className="px-4 py-2.5 border border-border rounded-lg text-sm text-muted-foreground">Cancel</button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {coupons.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-muted rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-foreground flex items-center gap-2"><Tag size={12} /> {c.code}</p>
                    <p className="text-xs text-muted-foreground">{c.discount}% off · {c.active ? "Active" : "Inactive"}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditCoupon(c); setCouponForm({ code: c.code, discount: String(c.discount), active: c.active }); setShowCouponForm(true); }}
                      className="text-muted-foreground hover:text-foreground"><Edit size={16} /></button>
                    <button onClick={() => remove(ref(db, `coupons/${c.id}`))}
                      className="text-muted-foreground hover:text-destructive"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
              {coupons.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No coupons yet.</p>}
            </div>
          </>
        )}

        {/* === PROJECTS TAB === */}
        {tab === "projects" && (
          <div className="space-y-3">
            {projects.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No requests yet.</p>}
            {projects.map((p) => (
              <div key={p.id} className="bg-muted rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground flex items-center gap-1"><FolderOpen size={12} /> {p.title}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail size={10} /> {p.userEmail} · {p.type}</p>
                  </div>
                  <select value={p.status} onChange={(e) => updateProjectStatus(p.id, e.target.value)}
                    className="text-xs px-2 py-1 bg-background border border-border rounded text-foreground">
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
                <p className="text-xs text-muted-foreground mt-1">Budget: {p.budget}</p>
                <p className="text-xs text-muted-foreground">Contact: {p.contact}</p>
              </div>
            ))}
          </div>
        )}

        {/* === FEEDBACKS TAB === */}
        {tab === "feedbacks" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              Approve or reject user feedbacks. Only approved feedbacks are shown on the website.
            </p>
            {allFeedbacks.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No feedbacks yet.</p>}
            {allFeedbacks.map((f) => (
              <div key={f.id} className="bg-muted rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{f.name}</p>
                    <div className="flex gap-0.5 mt-1">
                      {Array.from({ length: f.rating }).map((_, j) => (
                        <Star key={j} size={12} fill="hsl(var(--rating))" stroke="hsl(var(--rating))" />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleFeedbackApproval(f.id, f.approved)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 ${
                        f.approved 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-border text-muted-foreground"
                      }`}
                    >
                      {f.approved ? <><Check size={12} /> Approved</> : <><XIcon size={12} /> Hidden</>}
                    </button>
                    <button onClick={() => deleteFeedback(f.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-foreground mt-1">"{f.text}"</p>
                <p className="text-[10px] text-muted-foreground mt-2">{new Date(f.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}

        {/* === USERS TAB === */}
        {tab === "users" && <UsersList />}

        {/* === SETTINGS TAB === */}
        {tab === "settings" && (
          <div className="space-y-6">
            <div className="bg-muted rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {siteSettings.maintenance ? <PowerOff size={18} className="text-destructive" /> : <Power size={18} className="text-primary" />}
                  <div>
                    <p className="text-sm font-semibold text-foreground">Maintenance Mode</p>
                    <p className="text-xs text-muted-foreground">{siteSettings.maintenance ? "Site is offline" : "Site is live"}</p>
                  </div>
                </div>
                <button onClick={toggleMaintenance}
                  className={`px-4 py-2 rounded-lg text-xs font-medium ${siteSettings.maintenance ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"}`}>
                  {siteSettings.maintenance ? "Turn OFF" : "Turn ON"}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground flex items-center gap-1 mb-2"><Type size={14} /> Shop Name</label>
              <input value={siteSettings.shopName || ""} onChange={(e) => setSiteSettings({ ...siteSettings, shopName: e.target.value })}
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground outline-none" />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground flex items-center gap-1 mb-2"><Mail size={14} /> Contact Email</label>
              <input value={siteSettings.contactEmail || ""} onChange={(e) => setSiteSettings({ ...siteSettings, contactEmail: e.target.value })}
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground outline-none" />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground flex items-center gap-1 mb-2"><AlignLeft size={14} /> About Text</label>
              <textarea value={siteSettings.aboutText || ""} onChange={(e) => setSiteSettings({ ...siteSettings, aboutText: e.target.value })}
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground outline-none min-h-[80px]" placeholder="About your shop..." />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground flex items-center gap-1 mb-2"><Sliders size={14} /> Announcements</label>
              {(siteSettings.announcements || []).map((ann: string, i: number) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input value={ann} onChange={(e) => {
                    const newAnns = [...(siteSettings.announcements || [])];
                    newAnns[i] = e.target.value;
                    setSiteSettings({ ...siteSettings, announcements: newAnns });
                  }} className="flex-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground outline-none" />
                  <button onClick={() => {
                    const newAnns = (siteSettings.announcements || []).filter((_: any, j: number) => j !== i);
                    setSiteSettings({ ...siteSettings, announcements: newAnns });
                  }} className="text-destructive"><Trash2 size={14} /></button>
                </div>
              ))}
              <button onClick={() => setSiteSettings({ ...siteSettings, announcements: [...(siteSettings.announcements || []), ""] })}
                className="text-xs text-muted-foreground flex items-center gap-1 mt-1 hover:text-foreground">
                <Plus size={12} /> Add announcement
              </button>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground flex items-center gap-1 mb-2"><FileText size={14} /> Refund Policy</label>
              <textarea value={siteSettings.refundPolicy || ""} onChange={(e) => setSiteSettings({ ...siteSettings, refundPolicy: e.target.value })}
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground outline-none min-h-[80px]" placeholder="Refund policy..." />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground flex items-center gap-1 mb-2"><Shield size={14} /> Privacy Policy</label>
              <textarea value={siteSettings.privacyPolicy || ""} onChange={(e) => setSiteSettings({ ...siteSettings, privacyPolicy: e.target.value })}
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground outline-none min-h-[80px]" placeholder="Privacy policy..." />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground flex items-center gap-1 mb-2"><BookOpen size={14} /> Terms of Service</label>
              <textarea value={siteSettings.termsOfService || ""} onChange={(e) => setSiteSettings({ ...siteSettings, termsOfService: e.target.value })}
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground outline-none min-h-[80px]" placeholder="Terms of service..." />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground flex items-center gap-1 mb-2"><HelpCircle size={14} /> FAQ</label>
              <textarea value={siteSettings.faq || ""} onChange={(e) => setSiteSettings({ ...siteSettings, faq: e.target.value })}
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground outline-none min-h-[80px]" placeholder="FAQ content..." />
            </div>

            <button onClick={handleSaveSettings}
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium text-sm flex items-center justify-center gap-2">
              <Save size={16} /> {settingsSaved ? "Saved ✓" : "Save All Settings"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const UsersList: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onValue(ref(db, "users"), (snap) => {
      const data = snap.val();
      if (data) setUsers(Object.entries(data).map(([id, val]: any) => ({ id, ...val })));
    });
    return () => unsub();
  }, []);

  return (
    <div className="space-y-2">
      {users.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No users yet.</p>}
      {users.map((u) => (
        <div key={u.id} className="flex items-center gap-3 p-3 bg-muted rounded-xl">
          <div className="w-9 h-9 rounded-full bg-border flex items-center justify-center text-xs font-bold text-foreground">
            {(u.name?.[0] || u.email?.[0] || "?").toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{u.name || "No name"}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail size={10} /> {u.email}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminPanel;
