import React, { useEffect, useState } from "react";
import { Copy, Share2, TrendingUp, MousePointerClick, DollarSign } from "lucide-react";
import { onValue, ref, get } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { buildAffiliateLink, ensureAffiliate } from "@/lib/affiliate";
import { toast } from "sonner";
import type { Product } from "./ProductGrid";

const AffiliateDashboard: React.FC = () => {
  const { user } = useAuth();
  const [affiliate, setAffiliate] = useState<any>(null);
  const [clicks, setClicks] = useState(0);
  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<(Product & { id: string })[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const rateSnap = await get(ref(db, "siteSettings/affiliateCommissionRate"));
      const rate = typeof rateSnap.val() === "number" ? rateSnap.val() : 0.1;
      const aff = await ensureAffiliate(user.uid, rate);
      setAffiliate(aff);
    })();
  }, [user]);

  useEffect(() => {
    if (!affiliate?.code) return;
    const u1 = onValue(ref(db, `affiliateClicks/${affiliate.code}`), (s) => setClicks(s.val() ? Object.keys(s.val()).length : 0));
    const u2 = onValue(ref(db, `affiliateSales/${affiliate.code}`), (s) => setSales(s.val() ? Object.values(s.val()) : []));
    const u3 = onValue(ref(db, "products"), (s) => {
      const d = s.val();
      setProducts(d ? Object.entries(d).map(([id, val]: any) => ({ id, ...val })) : []);
    });
    return () => { u1(); u2(); u3(); };
  }, [affiliate?.code]);

  if (!affiliate) return <p className="text-sm text-muted-foreground">Loading affiliate...</p>;

  const totalEarnings = sales.reduce((s, x: any) => s + (x.commission || 0), 0);
  const pending = sales.filter((x: any) => x.status === "pending").reduce((s, x: any) => s + (x.commission || 0), 0);

  const copy = (text: string) => { navigator.clipboard.writeText(text); toast.success("Link copied!"); };

  return (
    <div className="space-y-4">
      <div className="bg-muted rounded-xl p-4">
        <p className="text-xs text-muted-foreground mb-1">Your referral code</p>
        <div className="flex items-center gap-2">
          <p className="text-2xl font-bold text-foreground font-mono tracking-wider">{affiliate.code}</p>
          <button onClick={() => copy(affiliate.code)} className="ml-auto p-2 hover:bg-background rounded-lg"><Copy size={14} /></button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Commission: {Math.round((affiliate.commissionRate || 0.1) * 100)}%</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-muted rounded-xl p-3 text-center">
          <MousePointerClick size={16} className="mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{clicks}</p>
          <p className="text-[10px] text-muted-foreground">Clicks</p>
        </div>
        <div className="bg-muted rounded-xl p-3 text-center">
          <TrendingUp size={16} className="mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{sales.length}</p>
          <p className="text-[10px] text-muted-foreground">Sales</p>
        </div>
        <div className="bg-muted rounded-xl p-3 text-center">
          <DollarSign size={16} className="mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">₹{totalEarnings.toFixed(0)}</p>
          <p className="text-[10px] text-muted-foreground">Earned</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center">Pending payout: ₹{pending.toFixed(0)}</p>

      <div>
        <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2"><Share2 size={14} /> Share product links</h4>
        <div className="bg-muted rounded-xl p-3 mb-2">
          <p className="text-xs text-muted-foreground mb-1">General link (all products)</p>
          <div className="flex items-center gap-2">
            <code className="text-[10px] text-foreground truncate flex-1">{buildAffiliateLink(affiliate.code)}</code>
            <button onClick={() => copy(buildAffiliateLink(affiliate.code))} className="p-1.5 bg-background rounded"><Copy size={12} /></button>
          </div>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {products.map(p => (
            <div key={p.id} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
              <img src={p.imageUrl} alt="" className="w-10 h-10 rounded object-cover" />
              <p className="text-xs text-foreground flex-1 truncate">{p.title}</p>
              <button onClick={() => copy(buildAffiliateLink(affiliate.code, p.id))}
                className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded flex items-center gap-1">
                <Copy size={10} /> Copy
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AffiliateDashboard;
