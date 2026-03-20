import React from "react";
import { Star, ShoppingCart } from "lucide-react";

export interface Product {
  id: string;
  title: string;
  type: "course" | "website";
  price: number;
  originalPrice?: number;
  imageUrl: string;
  description: string;
  razorpayLink: string;
  previewLink?: string;
  bestSelling?: boolean;
  category?: string;
}

interface ProductGridProps {
  products: Product[];
  onProductClick: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  title?: string;
  subtitle?: string;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, onProductClick, onAddToCart, title = "Best Selling Products", subtitle = "People are loving these!" }) => {
  if (products.length === 0) return null;

  return (
    <section className="px-4 py-10">
      <h2 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
        <Star size={24} className="text-rating" /> {title}
      </h2>
      <p className="text-muted-foreground mt-1 mb-6">{subtitle}</p>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {products.map((product) => (
          <div key={product.id} className="bg-muted rounded-xl overflow-hidden group transition-transform hover:scale-[1.02]">
            <button
              onClick={() => onProductClick(product)}
              className="w-full text-left"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" loading="lazy" />
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="absolute bottom-2 right-2 bg-sale text-sale-foreground text-[10px] px-2 py-0.5 rounded">Sale</span>
                )}
                {product.category && (
                  <span className="absolute top-2 left-2 bg-background/80 text-foreground text-[10px] px-2 py-0.5 rounded">{product.category}</span>
                )}
              </div>
              <div className="p-3 pb-1">
                <p className="text-sm font-medium text-foreground leading-tight line-clamp-2">{product.title}</p>
                <div className="mt-2 flex items-baseline gap-2">
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-xs text-muted-foreground line-through">Rs. {product.originalPrice.toFixed(2)}</span>
                  )}
                  <span className="text-sm font-semibold text-foreground">Rs. {product.price.toFixed(2)}</span>
                </div>
              </div>
            </button>
            {onAddToCart && (
              <div className="px-3 pb-3">
                <button
                  onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
                  className="w-full py-2 mt-1 border border-border rounded-lg text-xs font-medium text-foreground flex items-center justify-center gap-1 hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <ShoppingCart size={12} /> Add to Cart
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProductGrid;
