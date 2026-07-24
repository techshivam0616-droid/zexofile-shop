import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

export type UserRole = "buyer" | "seller" | "affiliate";

export interface UserRoleData {
  role?: UserRole;
  roleSelectedAt?: number;
  buyerProfile?: any;
  sellerStatus?: "pending" | "approved" | "rejected" | null;
  affiliateCode?: string | null;
}

export const useUserRole = () => {
  const { user } = useAuth();
  const [data, setData] = useState<UserRoleData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setData(null); setLoading(false); return; }
    const unsub = onValue(ref(db, `users/${user.uid}`), (snap) => {
      setData(snap.val() || {});
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  return { data, loading, needsRoleSelection: !!user && !loading && !data?.role };
};
