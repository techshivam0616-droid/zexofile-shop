
## Overview

Introduce user roles selected during signup: **Buyer**, **Seller**, **Affiliate**. Each role gets a tailored onboarding flow, dedicated profile sections, and admin controls. All data stays in Firebase Realtime DB (matches current stack).

## 1. Role Selection Flow (post-signup)

After a first-time signup (email/password or Google), if the user has no `role` in `users/{uid}`, show a full-screen **RoleSelectionModal** with three cards: Buyer, Seller, Affiliate. Selection triggers a role-specific onboarding wizard. Users cannot dismiss until a role is chosen.

Data written to `users/{uid}`:
- `role`: "buyer" | "seller" | "affiliate"
- `roleSelectedAt`: timestamp
- role-specific sub-object (see below)

## 2. Buyer Onboarding

Short 3–4 question wizard, then normal site access:
1. What are you looking for? (courses / websites / custom projects / just browsing)
2. Are you solo or a team? (solo / 2–10 / 11–50 / 50+)
3. Your role? (founder / developer / designer / student / other — free text if "other")
4. Primary use case? (learning / building a business / client work / personal project)

Stored at `users/{uid}/buyerProfile`. Site then behaves exactly like today.

## 3. Seller Flow

- Sellers get access to the site as buyers do, plus a **"Become a Verified Seller"** button in ProfileModal.
- Verification form asks: full name, username, mobile number, date of birth, ID card photo (uploaded via existing ImgBB integration), and the ID must show matching name + mobile.
- On submit:
  - Record saved to `sellerVerifications/{uid}` with status `pending`, `submittedAt`, all fields, ID image URL.
  - A pre-filled WhatsApp message (with all details + image URL) opens to the admin WhatsApp number so the seller can hit send.
- Profile shows current status: **Pending / Approved / Rejected (with reason + reapply-after date)**.
- If rejected, the "Reapply" button is disabled until `reapplyAfter` timestamp passes.
- Approved sellers unlock a "Sell a Product" area (basic product submission form → saved to `sellerProducts/{uid}/{id}` pending admin listing; full seller storefront can be a follow-up).

## 4. Affiliate Flow

- On selecting affiliate, generate a unique referral code (`affiliates/{uid}/code`, e.g. 8-char nanoid) and store `commissionRate` (defaults to admin-configured global rate at `siteSettings/affiliateCommissionRate`, default 10%).
- Affiliate dashboard section in ProfileModal:
  - Shows their code + a per-product link generator: any product's link becomes `?ref={code}&p={productId}`.
  - "Copy link" button for each product.
  - Stats: clicks, conversions, total earned, pending payout.
- On site load, `Index.tsx` reads `?ref=` from URL, stores it in `localStorage.affiliateRef`, and logs a click to `affiliateClicks/{code}/{ts}`.
- On successful Razorpay purchase (existing `handleBuy` handler), if `affiliateRef` is present, write to `affiliateSales/{code}/{purchaseId}` with `productId`, `buyerUid`, `amount`, `commission = amount * rate`, `status: "pending"`, `createdAt`.

## 5. Admin Panel Additions

Extend `AdminPanel.tsx` with three new tabs:
- **Seller Verifications**: list pending/approved/rejected. Approve, or Reject with required reason + reapply-after date picker. Writes update `sellerVerifications/{uid}` and mirrors status to `users/{uid}/sellerStatus`.
- **Affiliates**: list all affiliates, their code, clicks, sales, earnings. Set global commission rate. Mark sales as `paid`.
- **Role Overview**: counts of buyers / sellers / affiliates.

## 6. Files to Add

- `src/components/RoleSelectionModal.tsx` — role picker
- `src/components/onboarding/BuyerOnboarding.tsx` — 3–4 question wizard
- `src/components/onboarding/SellerOnboarding.tsx` — intro to verification
- `src/components/onboarding/AffiliateOnboarding.tsx` — intro + code generation
- `src/components/SellerVerificationForm.tsx` — verification form with ImgBB upload + WhatsApp send
- `src/components/AffiliateDashboard.tsx` — code, links, stats (rendered inside ProfileModal)
- `src/hooks/useUserRole.ts` — subscribes to `users/{uid}` and exposes `role`, `roleData`, `sellerStatus`
- `src/lib/affiliate.ts` — ref-code helpers, click/sale tracking

## 7. Files to Modify

- `src/contexts/AuthContext.tsx` — expose `role`, `roleData`, `needsRoleSelection` flag.
- `src/pages/Index.tsx` — mount `RoleSelectionModal` when `needsRoleSelection`; capture `?ref=` on load; attach affiliate commission in `handleBuy` on payment success.
- `src/components/ProfileModal.tsx` — show role-specific section (verification button for sellers, dashboard for affiliates, buyer profile summary for buyers).
- `src/components/AdminPanel.tsx` — new tabs described above.

## 8. Firebase Data Shape

```text
users/{uid}
  role, roleSelectedAt
  buyerProfile: { lookingFor, teamSize, jobRole, useCase }
  sellerStatus: "pending" | "approved" | "rejected" | null
  affiliateCode: string | null

sellerVerifications/{uid}
  fullName, username, mobile, dob, idPhotoUrl,
  status, submittedAt,
  rejectionReason?, reapplyAfter?

affiliates/{uid}
  code, commissionRate, createdAt

affiliateClicks/{code}/{pushId}
  productId?, ts

affiliateSales/{code}/{pushId}
  purchaseId, productId, buyerUid, amount, commission, status, createdAt

siteSettings/affiliateCommissionRate: number   // e.g. 0.10
siteSettings/adminWhatsApp: string             // for verification submissions
```

## 9. Technical Notes

- WhatsApp send uses `https://wa.me/{number}?text={encoded}`; opens in a new tab so the user taps Send.
- ID photo upload reuses existing `ImageUpload.tsx` (ImgBB).
- Referral code generation: 8-char base32, checked for uniqueness under `affiliates` before write.
- All new writes gated by existing auth; admin-only mutations continue to rely on the `ADMIN_EMAIL` check in the client (current pattern; DB rules unchanged).
- No new dependencies required.

## Open Questions

1. Admin WhatsApp number to use for verification submissions? (I can put it in `siteSettings/adminWhatsApp` editable from admin panel, defaulting to blank — you set it once.)
2. Default affiliate commission rate to seed? (Suggest 10%.)
3. Can sellers list products to the main storefront immediately after approval, or should each product still require admin approval before appearing publicly? (Recommend admin approval per product.)
