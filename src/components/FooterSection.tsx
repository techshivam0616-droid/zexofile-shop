import React, { useState, useEffect } from "react";
import { ArrowRight, Mail, Heart, Code, Globe } from "lucide-react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";

const FooterSection: React.FC = () => {
  const [email, setEmail] = useState("");
  const [siteSettings, setSiteSettings] = useState<any>({});

  useEffect(() => {
    const settingsRef = ref(db, "siteSettings");
    const unsub = onValue(settingsRef, (snap) => {
      const data = snap.val();
      if (data) setSiteSettings(data);
    });
    return () => unsub();
  }, []);

  return (
    <footer>
      <section className="px-4 py-12 text-center">
        <Mail size={28} className="mx-auto mb-3 text-muted-foreground" />
        <h2 className="text-2xl font-semibold text-foreground">Subscribe to our emails</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
          Be the first to know about new collections and exclusive offers.
        </p>
        <div className="mt-6 flex items-center max-w-sm mx-auto border border-border rounded-lg overflow-hidden">
          <input
            type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-4 py-3 text-sm bg-background text-foreground outline-none"
          />
          <button className="px-4 py-3 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      <section className="bg-footer text-footer-foreground px-4 py-12 text-center">
        <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
          <Heart size={18} /> About
        </h3>
        <p className="text-sm mt-4 max-w-md mx-auto leading-relaxed">
          {siteSettings.aboutText || "We are ZexoFile Shop — passionate about building clean, modern, aesthetic and thoughtfully crafted digital experiences."}
        </p>
        <p className="text-sm mt-4 max-w-md mx-auto text-muted-foreground leading-relaxed">
          Every project here is designed with care, simplicity, and long-term value in mind.
        </p>

        <div className="mt-8">
          <p className="text-xs uppercase tracking-wider text-muted-foreground flex items-center justify-center gap-1">
            <Mail size={12} /> Contact
          </p>
          <a href="mailto:ZexoFile@gmail.com" className="text-sm underline mt-1 inline-block">
            ZexoFile@gmail.com
          </a>
        </div>

        <p className="text-xs text-muted-foreground mt-8">© 2025 ZexoFile Shop. All rights reserved.</p>
      </section>
    </footer>
  );
};

export default FooterSection;
