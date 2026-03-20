import React from "react";
import { ArrowLeft, ShoppingCart, CreditCard, Clock, ExternalLink, Share2 } from "lucide-react";
import { Product } from "@/components/ProductGrid";

interface ProductDetailProps {
  product: Product | null;
  onClose: () => void;
  onBuy: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product, onClose, onBuy, onAddToCart }) => {
  if (!product) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background overflow-y-auto animate-fade-in">
      <div className="sticky top-0 bg-background border-b px-4 py-3 flex items-center gap-3 z-10">
        <button onClick={onClose} className="text-foreground"><ArrowLeft size={22} /></button>
        <span className="text-sm font-medium text-foreground">ZexoFile Shop</span>
      </div>

      <div className="relative">
        <img src={product.imageUrl} alt={product.title} className="w-full aspect-video object-cover" />
        {product.category && (
          <span className="absolute top-3 left-3 bg-background/80 text-foreground text-xs px-3 py-1 rounded">{product.category}</span>
        )}
      </div>

      <div className="px-4 py-6">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">ZEXOFILE SHOP</p>
        <h1 className="text-2xl font-bold text-foreground mt-1">{product.title}</h1>

        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-lg font-semibold text-foreground">Rs. {product.price.toFixed(2)}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-sm text-muted-foreground line-through">Rs. {product.originalPrice.toFixed(2)}</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">Shipping calculated at checkout.</p>

        <div className="mt-6 space-y-3">
          {onAddToCart && (
            <button onClick={() => onAddToCart(product)}
              className="w-full py-3.5 border border-foreground text-foreground rounded-lg font-medium text-sm hover:bg-muted transition-colors flex items-center justify-center gap-2">
              <ShoppingCart size={16} /> Add to cart
            </button>
          )}
          <a href={product.razorpayLink} target="_blank" rel="noopener noreferrer"
            className="w-full py-3.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm flex items-center justify-center gap-2">
            <CreditCard size={16} /> Buy it now
          </a>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button className="text-sm text-muted-foreground flex items-center gap-1"><Share2 size={14} /> Share</button>
          {product.previewLink && (
            <a href={product.previewLink} target="_blank" rel="noopener noreferrer"
              className="text-sm text-foreground font-medium flex items-center gap-1">
              View full details <ExternalLink size={14} />
            </a>
          )}
        </div>

        <div className="mt-8">
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{product.description}</p>
        </div>

        <div className="mt-8 border-t pt-6">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Clock size={16} /> Website Validity
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            Your website will be <strong className="text-foreground">active for 6 months</strong> from the date of delivery.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            To <strong className="text-foreground">extend the validity</strong>, please contact us at{" "}
            <a href="mailto:ZexoFile@gmail.com" className="underline text-foreground">ZexoFile@gmail.com</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
