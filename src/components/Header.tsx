import React, { useState, useEffect } from "react";
import { Menu, X, Search, ShoppingBag, User, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";

interface HeaderProps {
  onNavigate: (section: string) => void;
  onCartOpen: () => void;
  onAuthOpen: () => void;
  onProfileOpen: () => void;
  onSearchOpen: () => void;
  cartCount: number;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, onCartOpen, onAuthOpen, onProfileOpen, onSearchOpen, cartCount }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();
  const [announcement, setAnnouncement] = useState(0);
  const [announcements, setAnnouncements] = useState([
    "For any issues, mail at ZexoFile@gmail.com",
    "Welcome to ZexoFile Shop! Browse our collections.",
  ]);

  useEffect(() => {
    const unsub = onValue(ref(db, "siteSettings/announcements"), (snap) => {
      const data = snap.val();
      if (data && Array.isArray(data) && data.length > 0) {
        setAnnouncements(data);
      }
    });
    return () => unsub();
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-background">
      <div className="bg-muted px-4 py-2 text-center text-sm flex items-center justify-between">
        <button onClick={() => setAnnouncement((a) => (a - 1 + announcements.length) % announcements.length)} className="text-foreground">
          <ChevronLeft size={16} />
        </button>
        <span className="text-muted-foreground text-xs sm:text-sm">{announcements[announcement]}</span>
        <button onClick={() => setAnnouncement((a) => (a + 1) % announcements.length)} className="text-foreground">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-b">
        <button onClick={() => setMenuOpen(!menuOpen)} className="text-foreground">
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <button onClick={() => onNavigate("home")} className="text-xl font-semibold tracking-tight text-foreground">
          ZexoFile Shop
        </button>
        <div className="flex items-center gap-3">
          <button onClick={onSearchOpen} className="text-foreground"><Search size={22} /></button>
          <button onClick={onCartOpen} className="relative text-foreground">
            <ShoppingBag size={22} />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="absolute top-full left-0 right-0 bg-muted border-b z-50 animate-fade-in">
          <nav className="flex flex-col p-4">
            {["Home", "All Products", "Custom Project", "Contact"].map((item) => (
              <button
                key={item}
                onClick={() => { onNavigate(item.toLowerCase().replace(" ", "-")); setMenuOpen(false); }}
                className="py-3 text-left text-foreground font-medium border-b border-border last:border-0"
              >
                {item}
              </button>
            ))}
            <button
              onClick={() => { user ? onProfileOpen() : onAuthOpen(); setMenuOpen(false); }}
              className="py-3 text-left text-muted-foreground flex items-center gap-2 mt-2"
            >
              <User size={18} /> {user ? "Profile" : "Log in"}
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
