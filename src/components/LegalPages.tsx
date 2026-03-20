import React, { useState, useEffect } from "react";
import { ArrowLeft, FileText, Shield, HelpCircle, BookOpen, Gem, ShoppingCart, Award } from "lucide-react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";

interface LegalPagesProps {
  page: string;
  onClose: () => void;
}

const LegalPages: React.FC<LegalPagesProps> = ({ page, onClose }) => {
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    const unsub = onValue(ref(db, "siteSettings"), (snap) => {
      if (snap.val()) setSettings(snap.val());
    });
    return () => unsub();
  }, []);

  const pages: Record<string, { title: string; icon: React.ReactNode; content: () => React.ReactNode }> = {
    "privacy-policy": {
      title: "Privacy Policy",
      icon: <Shield size={20} />,
      content: () => (
        <div className="prose-sm text-muted-foreground space-y-4">
          {settings.privacyPolicy ? (
            <p className="whitespace-pre-wrap">{settings.privacyPolicy}</p>
          ) : (
            <>
              <p>At ZexoFile Shop, we value your privacy and are committed to protecting your personal information.</p>
              <h3 className="text-foreground font-semibold text-sm">Information We Collect</h3>
              <p>We collect your name, email address, and payment information when you make a purchase or create an account.</p>
              <h3 className="text-foreground font-semibold text-sm">How We Use Your Information</h3>
              <p>Your information is used to process orders, provide customer support, and improve our services. We never sell or share your data with third parties.</p>
              <h3 className="text-foreground font-semibold text-sm">Data Security</h3>
              <p>We use industry-standard encryption and security measures to protect your data. All payments are processed through secure Razorpay payment links.</p>
              <h3 className="text-foreground font-semibold text-sm">Contact</h3>
              <p>For privacy concerns, email us at {settings.contactEmail || "ZexoFile@gmail.com"}</p>
            </>
          )}
        </div>
      ),
    },
    "terms": {
      title: "Terms of Service",
      icon: <BookOpen size={20} />,
      content: () => (
        <div className="prose-sm text-muted-foreground space-y-4">
          {settings.termsOfService ? (
            <p className="whitespace-pre-wrap">{settings.termsOfService}</p>
          ) : (
            <>
              <p>By using ZexoFile Shop, you agree to the following terms and conditions.</p>
              <h3 className="text-foreground font-semibold text-sm">Products</h3>
              <p>All products sold on ZexoFile Shop are digital goods including online courses, ready-made websites, and custom project services.</p>
              <h3 className="text-foreground font-semibold text-sm">Purchases</h3>
              <p>All purchases grant you lifetime access to the digital product. You may not resell, redistribute, or share purchased products.</p>
              <h3 className="text-foreground font-semibold text-sm">User Accounts</h3>
              <p>You are responsible for maintaining the security of your account credentials. Sharing accounts is not permitted.</p>
              <h3 className="text-foreground font-semibold text-sm">Modifications</h3>
              <p>We reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance.</p>
            </>
          )}
        </div>
      ),
    },
    "refund-policy": {
      title: "Refund Policy",
      icon: <FileText size={20} />,
      content: () => (
        <div className="prose-sm text-muted-foreground space-y-4">
          {settings.refundPolicy ? (
            <p className="whitespace-pre-wrap">{settings.refundPolicy}</p>
          ) : (
            <>
              <p>Due to the digital nature of our products, all sales are final. We do not offer refunds once the product has been delivered.</p>
              <p>If you face any issues with your purchase, please contact us at {settings.contactEmail || "ZexoFile@gmail.com"} and we will do our best to assist you.</p>
              <p>In exceptional cases (e.g., product not delivered, major defects), we may offer a full or partial refund at our discretion.</p>
            </>
          )}
        </div>
      ),
    },
    "faq": {
      title: "FAQ",
      icon: <HelpCircle size={20} />,
      content: () => (
        <div className="prose-sm text-muted-foreground space-y-4">
          {settings.faq ? (
            <p className="whitespace-pre-wrap">{settings.faq}</p>
          ) : (
            <>
              <div>
                <h3 className="text-foreground font-semibold text-sm">What products do you sell?</h3>
                <p>We sell online courses, ready-made websites, and offer custom project development services.</p>
              </div>
              <div>
                <h3 className="text-foreground font-semibold text-sm">How do I access my purchase?</h3>
                <p>After completing payment, you get lifetime access. Check your profile for purchase history and access links.</p>
              </div>
              <div>
                <h3 className="text-foreground font-semibold text-sm">Can I get a refund?</h3>
                <p>Due to digital nature, all sales are final. Contact us for issues at {settings.contactEmail || "ZexoFile@gmail.com"}.</p>
              </div>
              <div>
                <h3 className="text-foreground font-semibold text-sm">How does the custom project service work?</h3>
                <p>Log in, go to "Custom Project", fill out the form with your requirements, and we'll get back to you.</p>
              </div>
              <div>
                <h3 className="text-foreground font-semibold text-sm">What payment methods do you accept?</h3>
                <p>We accept all payment methods supported by Razorpay including UPI, cards, net banking, and wallets.</p>
              </div>
            </>
          )}
        </div>
      ),
    },
    "what-we-offer": {
      title: "What We Offer",
      icon: <Gem size={20} />,
      content: () => (
        <div className="prose-sm text-muted-foreground space-y-6">
          <div className="bg-muted rounded-xl p-4">
            <h3 className="text-foreground font-semibold text-sm flex items-center gap-2 mb-2"><BookOpen size={16} /> Online Courses</h3>
            <p>High-quality courses with lifetime access. Learn at your own pace with comprehensive content and practical examples.</p>
          </div>
          <div className="bg-muted rounded-xl p-4">
            <h3 className="text-foreground font-semibold text-sm flex items-center gap-2 mb-2"><ShoppingCart size={16} /> Ready-made Websites</h3>
            <p>Beautiful, fully customisable website templates ready to deploy. Perfect for businesses, portfolios, and more.</p>
          </div>
          <div className="bg-muted rounded-xl p-4">
            <h3 className="text-foreground font-semibold text-sm flex items-center gap-2 mb-2"><Award size={16} /> Custom Projects</h3>
            <p>Get a tailor-made solution built specifically for your needs. Submit your requirements and we'll bring your vision to life.</p>
          </div>
        </div>
      ),
    },
    "how-to-use": {
      title: "How to Use",
      icon: <BookOpen size={20} />,
      content: () => (
        <div className="prose-sm text-muted-foreground space-y-4">
          <div className="flex gap-3 items-start">
            <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 text-xs font-bold">1</span>
            <div><h3 className="text-foreground font-semibold text-sm">Create an Account</h3><p>Sign up using email or Google login to get started.</p></div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 text-xs font-bold">2</span>
            <div><h3 className="text-foreground font-semibold text-sm">Browse Products</h3><p>Explore our collection of courses, websites, and custom services.</p></div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 text-xs font-bold">3</span>
            <div><h3 className="text-foreground font-semibold text-sm">Purchase</h3><p>Click "Buy it now" and complete payment via Razorpay. Apply coupon codes for discounts!</p></div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 text-xs font-bold">4</span>
            <div><h3 className="text-foreground font-semibold text-sm">Access Forever</h3><p>Get instant lifetime access to your purchased products.</p></div>
          </div>
        </div>
      ),
    },
    "why-choose-us": {
      title: "Why Choose Us",
      icon: <Award size={20} />,
      content: () => (
        <div className="prose-sm text-muted-foreground space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { title: "Premium Quality", desc: "Every product is crafted with attention to detail" },
              { title: "Fast Delivery", desc: "Instant access after payment" },
              { title: "Fully Customisable", desc: "All products can be tailored to your needs" },
              { title: "24/7 Support", desc: "We're always here to help" },
              { title: "Lifetime Access", desc: "Pay once, access forever" },
              { title: "Secure Payments", desc: "Razorpay secured transactions" },
            ].map(item => (
              <div key={item.title} className="bg-muted rounded-xl p-4 text-center">
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
  };

  const currentPage = pages[page];
  if (!currentPage) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background overflow-y-auto animate-fade-in">
      <div className="sticky top-0 bg-background border-b px-4 py-3 flex items-center gap-3 z-10">
        <button onClick={onClose} className="text-foreground"><ArrowLeft size={22} /></button>
        {currentPage.icon}
        <span className="text-sm font-medium text-foreground">{currentPage.title}</span>
      </div>
      <div className="px-4 py-6 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-6">{currentPage.title}</h1>
        {currentPage.content()}
      </div>
    </div>
  );
};

export default LegalPages;
