## Scope

Refactor seller onboarding, add matching affiliate verification, and introduce payment settings, wallet balances, and withdrawal flows for both roles — all managed via the admin panel (no WhatsApp).

## 1. Seller Verification (update)

- Remove WhatsApp send from `SellerVerificationForm`. Submission writes to `sellerVerifications/{uid}` and sets `users/{uid}/sellerStatus = pending`. Done.
- Admin panel "Seller Verifications" tab shows full details + ID photo, with:
  - Approve / Reject (reason + reapply-after date)
  - "Download PDF" button — generates a PDF of the submission using `jspdf` (add dep).

## 2. Affiliate Verification (new)

- New component `AffiliateVerificationForm.tsx` — same fields as seller: full name, username, mobile, DOB, ID photo.
- On selecting the affiliate role (or via a "Get Verified" button in `AffiliateDashboard`), the user must submit verification before receiving/using the referral code publicly.
- Data at `affiliateVerifications/{uid}` mirrors the seller shape; `users/{uid}/affiliateStatus`: pending | approved | rejected.
- Admin panel: separate "Affiliate Verifications" tab with the same approve/reject/PDF actions.

## 3. Payment Settings (both roles)

- New component `PaymentSettingsForm.tsx` in `ProfileModal` for sellers and affiliates.
- Fields: first name, last name, username, mobile, address, UPI ID. Saved to `paymentSettings/{uid}` on confirm.
- Admin sees a user's payment settings when reviewing withdrawals.

## 4. Wallet + Commission

- Add `walletBalance` under `users/{uid}/wallet.balance` and a ledger `walletLedger/{uid}/{pushId}`.
- Admin setting `siteSettings/sellerCommissionRate` (default 0.10) — the % the platform keeps.
- Modify `Index.tsx` `handleBuy` payment success:
  - Seller sales (products with `sellerUid`): credit `amount * (1 - sellerCommissionRate)` to seller wallet.
  - Affiliate sales: already recorded; also credit `commission` to affiliate wallet on payment success.
- Wallet UI in `ProfileModal` shows balance, ledger, and a "Withdraw" button (disabled if payment settings incomplete).

## 5. Withdrawals

- Withdraw request writes `withdrawals/{pushId}` with `{ withdrawalId, uid, role, amount, paymentSettingsSnapshot, status: pending, createdAt }`. Balance is decremented immediately into a `pending` ledger entry; on admin rejection, refunded.
- Admin panel "Withdrawals" tab lists all requests (filter seller/affiliate), with Approve (mark paid, add txn ref) / Reject (reason, refund wallet).

## 6. Admin Panel Structure

Reorganize `AdminPanel.tsx` tabs:
- Products, Orders, Site Settings (existing)
- **Seller Verifications**, **Affiliate Verifications**, **Withdrawals**, **Wallets/Commission Rate**.
- Site Settings adds `sellerCommissionRate`, removes admin-WhatsApp requirement (kept optional).

## 7. Files

**Add**
- `src/components/AffiliateVerificationForm.tsx`
- `src/components/PaymentSettingsForm.tsx`
- `src/components/WalletPanel.tsx`
- `src/components/WithdrawModal.tsx`
- `src/lib/pdf.ts` — verification PDF builder (uses `jspdf`)

**Modify**
- `src/components/SellerVerificationForm.tsx` — drop WhatsApp step
- `src/components/AffiliateDashboard.tsx` — gate behind approved status + link to verification/payment/wallet
- `src/components/ProfileModal.tsx` — surface wallet, payment settings, verification entry points for both roles
- `src/components/AdminPanel.tsx` — new tabs (Seller Verif, Affiliate Verif, Withdrawals) + commission rate setting + PDF export
- `src/pages/Index.tsx` — credit seller/affiliate wallets on successful purchase

**Dependency**
- `jspdf` (small, no native deps)

## 8. Data shape (additions)

```text
affiliateVerifications/{uid}   // same shape as sellerVerifications
users/{uid}/affiliateStatus     // pending|approved|rejected
users/{uid}/wallet/balance
walletLedger/{uid}/{pushId}     { type, amount, refId, note, ts }
paymentSettings/{uid}           { firstName,lastName,username,mobile,address,upi, updatedAt }
withdrawals/{pushId}            { withdrawalId, uid, role, amount, payment, status, createdAt, processedAt?, adminNote? }
siteSettings/sellerCommissionRate  // e.g. 0.10
```

## Open Questions

1. Commission rate default: 10% for platform (seller keeps 90%)? Same 10% commission to affiliate on affiliate sales?
2. Minimum withdrawal amount? Suggest ₹100.
3. Does the seller commission also apply when the sale came through an affiliate (i.e., both platform cut and affiliate cut deducted), or only one of them?
