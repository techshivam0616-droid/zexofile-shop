import React, { useState } from "react";
import { X, ShoppingCart, Trash2, CreditCard, Tag, Check } from "lucide-react";
import { ref, get } from "firebase/database";
import { db } from "@/lib/firebase";
import { Product } from "./ProductGrid";

interface CartModalProps {
  open: boolean;
  onClose: () => void;
  items: Product[];
  onRemove: (id: string) => void;
  onBuy: (product: Product, discount: number) => void;
}

const CartModal: React.FC<CartModalProps> = ({ open, onClose, items, onRemove, onBuy }) => {
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);

  if (!open) return null;

  const subtotal = items.reduce((s, i) => s + i.price, 0);
  const discountAmount = subtotal * (discount / 100);
  const total = subtotal - discountAmount;

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const snap = await get(ref(db, "coupons"));
      const data = snap.val();
      if (data) {
        const found = Object.values(data).find((c: any) =>
          c.code.toLowerCase() === couponCode.trim().toLowerCase() && c.active
        ) as any;
        if (found) {
          setDiscount(found.discount);
          setCouponMsg(`${found.discount}% discount applied!`);
          setCouponApplied(true);
        } else {
          setDiscount(0);
          setCouponMsg("Invalid or expired coupon code");
          setCouponApplied(false);
        }
      } else {
        setCouponMsg("Invalid coupon code");
        setCouponApplied(false);
      }
    } catch {
      setCouponMsg("Error applying coupon");
      setCouponApplied(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-foreground/50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-background rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 relative animate-fade-in max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground"><X size={20} /></button>

        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
          <ShoppingCart size={18} /> Cart ({items.length})
        </h2>

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Your cart is empty</p>
        ) : (
          <>
            <div className="space-y-3 mb-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                  <img src={item.imageUrl} alt={item.title} className="w-12 h-12 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">Rs. {item.price.toFixed(2)}</p>
                  </div>
                  <button onClick={() => onRemove(item.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>

            {/* Coupon Code */}
            <div className="mb-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter coupon code"
                    className="w-full pl-9 pr-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground outline-none"
                    disabled={couponApplied}
                  />
                </div>
                <button
                  onClick={couponApplied ? () => { setCouponApplied(false); setDiscount(0); setCouponCode(""); setCouponMsg(""); } : applyCoupon}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium ${couponApplied ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"}`}
                >
                  {couponApplied ? "Remove" : "Apply"}
                </button>
              </div>
              {couponMsg && (
                <p className={`text-xs mt-1 flex items-center gap-1 ${couponApplied ? "text-success" : "text-destructive"}`}>
                  {couponApplied && <Check size={12} />} {couponMsg}
                </p>
              )}
            </div>

            {/* Summary */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span>Rs. {subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-success">
                  <span>Discount ({discount}%)</span>
                  <span>- Rs. {discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-semibold text-foreground">
                <span>Total</span>
                <span>Rs. {total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => items.forEach(item => onBuy(item, discount))}
              className="w-full mt-4 py-3.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm flex items-center justify-center gap-2"
            >
              <CreditCard size={16} /> Checkout
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CartModal;
