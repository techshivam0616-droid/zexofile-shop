import React, { useState } from "react";
import { ShoppingBag, Store, Share2, ArrowLeft, Check } from "lucide-react";
import { update, ref, get } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { ensureAffiliate } from "@/lib/affiliate";
import { toast } from "sonner";

interface Props { open: boolean; }

type Step = "pick" | "buyer" | "seller" | "affiliate";

const RoleSelectionModal: React.FC<Props> = ({ open }) => {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("pick");
  const [saving, setSaving] = useState(false);

  // Buyer wizard state
  const [buyer, setBuyer] = useState({ lookingFor: "", teamSize: "", jobRole: "", useCase: "" });

  if (!open || !user) return null;

  const saveRole = async (role: "buyer" | "seller" | "affiliate", extra: any = {}) => {
    setSaving(true);
    try {
      await update(ref(db, `users/${user.uid}`), {
        role, roleSelectedAt: Date.now(), ...extra,
      });
      if (role === "affiliate") {
        const rateSnap = await get(ref(db, "siteSettings/affiliateCommissionRate"));
        const rate = typeof rateSnap.val() === "number" ? rateSnap.val() : 0.1;
        const aff = await ensureAffiliate(user.uid, rate);
        await update(ref(db, `users/${user.uid}`), { affiliateCode: aff.code });
        toast.success(`Affiliate account created! Your code: ${aff.code}`);
      } else if (role === "seller") {
        await update(ref(db, `users/${user.uid}`), { sellerStatus: null });
        toast.success("Seller account created. Complete verification from your profile.");
      } else {
        toast.success("Welcome! Enjoy shopping.");
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to save");
    }
    setSaving(false);
  };

  const RoleCard = ({ icon, title, desc, onClick, color }: any) => (
    <button onClick={onClick}
      className={`w-full text-left p-5 rounded-2xl border-2 border-border hover:border-foreground transition-all group ${color}`}>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center shrink-0">{icon}</div>
        <div className="flex-1">
          <p className="font-bold text-foreground text-base">{title}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{desc}</p>
        </div>
      </div>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[110] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-background rounded-2xl border border-border p-6 my-8">
        {step !== "pick" && (
          <button onClick={() => setStep("pick")} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} /> Back
          </button>
        )}

        {step === "pick" && (
          <>
            <h2 className="text-2xl font-bold text-foreground mb-1">Welcome! 👋</h2>
            <p className="text-sm text-muted-foreground mb-6">How will you use ZexoFile Shop?</p>
            <div className="space-y-3">
              <RoleCard icon={<ShoppingBag size={22} className="text-foreground" />} title="I'm a Buyer"
                desc="Browse and purchase courses, websites and custom projects." onClick={() => setStep("buyer")} />
              <RoleCard icon={<Store size={22} className="text-foreground" />} title="I'm a Seller"
                desc="Sell your own products after a quick verification." onClick={() => setStep("seller")} />
              <RoleCard icon={<Share2 size={22} className="text-foreground" />} title="I'm an Affiliate"
                desc="Share product links and earn commission on every sale." onClick={() => setStep("affiliate")} />
            </div>
          </>
        )}

        {step === "buyer" && (
          <BuyerWizard buyer={buyer} setBuyer={setBuyer} saving={saving}
            onFinish={() => saveRole("buyer", { buyerProfile: buyer })} />
        )}

        {step === "seller" && (
          <div>
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4"><Store size={26} /></div>
            <h2 className="text-xl font-bold text-foreground mb-2">Become a Seller</h2>
            <p className="text-sm text-muted-foreground mb-4">
              You'll be able to sell your products after a quick verification (ID card + basic details).
              You can continue browsing while your verification is pending.
            </p>
            <ul className="space-y-2 mb-6">
              {["Sell your own courses & websites", "Reach thousands of buyers", "Secure verification for trust", "Simple onboarding process"].map(t => (
                <li key={t} className="flex items-center gap-2 text-sm text-foreground"><Check size={14} className="text-foreground" /> {t}</li>
              ))}
            </ul>
            <button disabled={saving} onClick={() => saveRole("seller")}
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium text-sm disabled:opacity-50">
              {saving ? "Setting up..." : "Continue as Seller"}
            </button>
          </div>
        )}

        {step === "affiliate" && (
          <div>
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4"><Share2 size={26} /></div>
            <h2 className="text-xl font-bold text-foreground mb-2">Become an Affiliate</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Get a unique referral code and product links. Earn commission on every purchase made through your link.
            </p>
            <ul className="space-y-2 mb-6">
              {["Unique referral code", "Per-product share links", "Track clicks & conversions", "Earn commission on every sale"].map(t => (
                <li key={t} className="flex items-center gap-2 text-sm text-foreground"><Check size={14} /> {t}</li>
              ))}
            </ul>
            <button disabled={saving} onClick={() => saveRole("affiliate")}
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium text-sm disabled:opacity-50">
              {saving ? "Setting up..." : "Continue as Affiliate"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const BuyerWizard: React.FC<{ buyer: any; setBuyer: any; saving: boolean; onFinish: () => void }> = ({ buyer, setBuyer, saving, onFinish }) => {
  const [q, setQ] = useState(0);
  const questions = [
    { key: "lookingFor", label: "What are you looking for?", options: ["Courses", "Ready-made websites", "Custom projects", "Just browsing"] },
    { key: "teamSize", label: "Are you solo or a team?", options: ["Solo individual", "2 – 10 people", "11 – 50 people", "50+ people"] },
    { key: "jobRole", label: "What's your role?", options: ["Founder / CEO", "Developer", "Designer", "Student", "Marketer", "Other"] },
    { key: "useCase", label: "Primary use case?", options: ["Learning new skills", "Building a business", "Client work", "Personal project"] },
  ];
  const cur = questions[q];
  const value = buyer[cur.key];

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-2">Question {q + 1} of {questions.length}</p>
      <div className="h-1 bg-muted rounded-full mb-5 overflow-hidden">
        <div className="h-full bg-foreground transition-all" style={{ width: `${((q + 1) / questions.length) * 100}%` }} />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-4">{cur.label}</h2>
      <div className="space-y-2 mb-6">
        {cur.options.map(opt => (
          <button key={opt} onClick={() => setBuyer({ ...buyer, [cur.key]: opt })}
            className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all ${value === opt ? "border-foreground bg-muted font-medium" : "border-border text-muted-foreground hover:text-foreground"}`}>
            {opt}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        {q > 0 && <button onClick={() => setQ(q - 1)} className="flex-1 py-3 border border-border rounded-lg text-sm font-medium">Previous</button>}
        {q < questions.length - 1 ? (
          <button disabled={!value} onClick={() => setQ(q + 1)}
            className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg font-medium text-sm disabled:opacity-50">Next</button>
        ) : (
          <button disabled={!value || saving} onClick={onFinish}
            className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg font-medium text-sm disabled:opacity-50">
            {saving ? "Saving..." : "Finish"}
          </button>
        )}
      </div>
    </div>
  );
};

export default RoleSelectionModal;
