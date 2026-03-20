import React, { useState } from "react";
import { X, Search } from "lucide-react";
import { Product } from "./ProductGrid";

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  products: Product[];
  onProductClick: (product: Product) => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ open, onClose, products, onProductClick }) => {
  const [query, setQuery] = useState("");

  if (!open) return null;

  const filtered = products.filter(p =>
    p.title.toLowerCase().includes(query.toLowerCase()) ||
    p.description.toLowerCase().includes(query.toLowerCase()) ||
    (p.category || "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] bg-background overflow-y-auto animate-fade-in">
      <div className="sticky top-0 bg-background border-b px-4 py-3 flex items-center gap-3 z-10">
        <button onClick={onClose} className="text-foreground"><X size={22} /></button>
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground outline-none"
          />
        </div>
      </div>

      <div className="p-4">
        {query.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Type to search products...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No products found for "{query}"</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => { onProductClick(p); onClose(); }}
                className="w-full flex items-center gap-3 p-3 bg-muted rounded-xl text-left"
              >
                <img src={p.imageUrl} alt={p.title} className="w-14 h-14 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                  <p className="text-xs text-muted-foreground">Rs. {p.price.toFixed(2)} {p.category && `· ${p.category}`}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchModal;
