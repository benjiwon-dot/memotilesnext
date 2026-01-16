// app/checkout/CheckoutClient.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { useApp } from "@/context/AppContext";
import { Image as ImageIcon, Loader2 } from "lucide-react";

import { createOrder } from "@/utils/orders";
import { ensureStorageUrl } from "@/utils/storageUpload";

type OrderItem = {
  id: string;
  previewUrl?: string;
  src?: string;
  qty?: number;
};

type ShippingAddress = {
  fullName: string;
  email: string;
  address1: string;
  address2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone: string;
  instagram?: string;
};

const SESSION_KEY = "MYTILE_ORDER_ITEMS";
const CART_STORAGE_PREFIX = "MEMOTILES_CART_V1";

function cartStorageKey(uid?: string | null) {
  return `${CART_STORAGE_PREFIX}:${uid || "guest"}`;
}

function safeParseItems(raw: string | null): OrderItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x) => x && typeof x.id === "string")
      .map((x) => ({
        id: String(x.id),
        previewUrl: typeof x.previewUrl === "string" ? x.previewUrl : undefined,
        src: typeof x.src === "string" ? x.src : undefined,
        qty: Number(x.qty) > 0 ? Number(x.qty) : 1,
      }));
  } catch {
    return [];
  }
}

function pickItemUrl(it: OrderItem) {
  return (it.previewUrl || it.src || "").trim();
}

function userFriendlyCheckoutError(err: any) {
  const code = String(err?.code || "");
  const msg = String(err?.message || "");

  if (code === "storage/retry-limit-exceeded") {
    return "사진 업로드가 계속 실패해서 시간 초과가 났습니다.\n(Storage 재시도 한도 초과)\nStorage Rules/CORS 설정을 확인한 뒤 다시 시도해 주세요.";
  }
  if (code === "storage/unauthorized" || code === "storage/unauthenticated") {
    return "Storage 업로드 권한이 없습니다.\n로그인 상태와 Storage Rules(쓰기 권한)를 확인해 주세요.";
  }
  if (msg.toLowerCase().includes("cors") || msg.toLowerCase().includes("blocked by cors")) {
    return "브라우저가 Storage 업로드 요청을 CORS 정책 때문에 차단했습니다.\nFirebase Storage 설정/Rules 또는 도메인 설정을 확인해야 합니다.";
  }

  return msg || "Checkout failed. Please try again.";
}

declare global {
  interface Window {
    TossPayments?: any;
  }
}

async function loadTossPaymentsScript() {
  if (typeof window === "undefined") return;
  if (window.TossPayments) return;

  await new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://js.tosspayments.com/v2/standard";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load TossPayments script."));
    document.head.appendChild(s);
  });

  if (!window.TossPayments) {
    throw new Error("TossPayments SDK not available after script load.");
  }
}

export default function CheckoutClient() {
  const router = useRouter();
  const app = useApp() as any;

  const t = app?.t as ((key: string) => string) | undefined;
  const tr = (key: string, fallback: string) => {
    const v = t?.(key);
    if (!v || v === key) return fallback;
    return v;
  };

  const cartFromCtx: OrderItem[] = (app?.cart || []) as OrderItem[];
  const [hydrating, setHydrating] = useState(true);

  // ✅ 핵심: Checkout에서 직접 storage 복원까지 한다 (Vercel/라우팅/리셋에도 안 꼬임)
  useEffect(() => {
    if (app?.authLoading) return;

    const uid = app?.user?.uid as string | undefined;

    // 1) Context cart 있으면 끝
    if (Array.isArray(cartFromCtx) && cartFromCtx.length > 0) {
      setHydrating(false);
      return;
    }

    try {
      // 2) sessionStorage (Editor가 저장)
      const sessionRaw = sessionStorage.getItem(SESSION_KEY);
      const sessionItems = safeParseItems(sessionRaw);

      if (sessionItems.length > 0) {
        if (typeof app?.setCart === "function") app.setCart(sessionItems);
        setHydrating(false);
        return;
      }

      // 3) localStorage (AppContext persist)
      const uidRaw = localStorage.getItem(cartStorageKey(uid));
      const uidItems = safeParseItems(uidRaw);

      if (uidItems.length > 0) {
        if (typeof app?.setCart === "function") app.setCart(uidItems);
        setHydrating(false);
        return;
      }

      // 4) guest fallback
      const guestRaw = localStorage.getItem(cartStorageKey("guest"));
      const guestItems = safeParseItems(guestRaw);

      if (guestItems.length > 0) {
        if (typeof app?.setCart === "function") app.setCart(guestItems);
        setHydrating(false);
        return;
      }
    } catch {
      // ignore
    } finally {
      setHydrating(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app?.authLoading]);

  const cart: OrderItem[] = cartFromCtx;

  const [shipping, setShipping] = useState<ShippingAddress>({
    fullName: "",
    email: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Thailand",
    phone: "",
    instagram: "",
  });

  const [busy, setBusy] = useState(false);
  const [stepLabel, setStepLabel] = useState<string>("");

  const tilesCount = useMemo(() => {
    return Array.isArray(cart) ? cart.reduce((sum, it) => sum + (Number(it.qty) || 1), 0) : 0;
  }, [cart]);

  const totalTHB = useMemo(() => tilesCount * 200, [tilesCount]);
  const totalKRW = useMemo(() => {
    const v = Math.round(tilesCount * 2000);
    return Number.isFinite(v) && v > 0 ? v : 0;
  }, [tilesCount]);

  const startPaymentFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart?.length) return;

    const uid = app?.user?.uid as string | undefined;
    if (!uid) {
      router.replace(`/login?next=${encodeURIComponent("/checkout")}`);
      return;
    }

    const email = (shipping.email || "").trim();
    if (!email) return alert(tr("emailRequired", "Email is required."));
    if (!/^\S+@\S+\.\S+$/.test(email)) return alert(tr("emailInvalid", "Please enter a valid email address."));

    const tossClientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
    if (!tossClientKey) return alert("Missing NEXT_PUBLIC_TOSS_CLIENT_KEY in Vercel env");

    if (!Number.isFinite(totalKRW) || totalKRW <= 0) return alert("Invalid payment amount.");

    setBusy(true);
    setStepLabel("");

    const publicOrderId = `ORD-${Date.now()}`;

    try {
      const cleanedShipping: ShippingAddress = {
        ...shipping,
        email,
        address2: shipping.address2?.trim() || undefined,
        state: shipping.state?.trim() || undefined,
        instagram: shipping.instagram?.trim() || undefined,
      };

      // 1) 이미지 업로드
      const uploadedItems: OrderItem[] = [];
      for (let i = 0; i < cart.length; i++) {
        const it = cart[i];
        const url = pickItemUrl(it);

        setStepLabel(tr("uploadingPhoto", `Uploading photo ${i + 1} / ${cart.length}…`));

        const finalUrl = url ? await ensureStorageUrl({ url, uid, orderId: publicOrderId, index: i }) : "";
        if (!finalUrl) throw new Error("Image upload failed. Please try again.");

        uploadedItems.push({
          ...it,
          previewUrl: finalUrl,
          src: finalUrl,
          qty: it.qty ?? 1,
        });
      }

      // 2) 주문 생성(결제 전)
      setStepLabel(tr("creatingOrder", "Creating order…"));

      const order = createOrder(uid, {
        items: uploadedItems,
        total: totalTHB,
        currency: "THB",
        shippingAddress: cleanedShipping,
        status: "payment_pending",
        publicOrderId: publicOrderId,
        paymentProvider: "toss",
      } as any);

      // 3) Toss 결제창 오픈
      setStepLabel(tr("openingPayment", "Opening secure payment…"));

      await loadTossPaymentsScript();

      const origin = window.location.origin;

      const tossPayments = window.TossPayments(tossClientKey);
      const payment = tossPayments.payment({ customerKey: uid });

      // ✅ 결제 성공/실패와 별개로, 여기서 cart 비우면 실패시 복구가 귀찮다.
      // 일단 주석 처리하고 success에서 clear하는 게 안전.
      // if (typeof app?.setCart === "function") app.setCart([]);

      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: totalKRW },
        orderId: publicOrderId,
        orderName: `MEMOTILE ${tilesCount} tiles`,
        customerName: cleanedShipping.fullName || "Customer",
        customerEmail: email,
        successUrl: `${origin}/toss/success?docId=${encodeURIComponent(order.id)}`,
        failUrl: `${origin}/toss/fail?docId=${encodeURIComponent(order.id)}`,
      });

      setStepLabel("");
    } catch (err: any) {
      console.error(err);
      alert(userFriendlyCheckoutError(err));
      setStepLabel("");
      setBusy(false);
    }
  };

  if (hydrating) {
    return (
      <AppLayout>
        <div className="container" style={{ textAlign: "center", padding: "4rem 1rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, color: "var(--text-tertiary)" }}>
            <Loader2 className="animate-spin" size={18} />
            <span style={{ fontWeight: 650 }}>{tr("loadingCart", "Loading your cart…")}</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!cart || cart.length === 0) {
    return (
      <AppLayout>
        <div className="container" style={{ textAlign: "center", padding: "4rem 1rem" }}>
          <div style={{ fontSize: 22, fontWeight: 950 }}>{tr("cartEmpty", "Your cart is empty")}</div>
          <div style={{ marginTop: 10, color: "var(--text-tertiary)", fontWeight: 650 }}>
            {tr("cartEmptyHint", "Add some photos first, then come back to checkout.")}
          </div>
          <button onClick={() => router.push("/editor")} className="btn btn-primary" style={{ marginTop: "1.25rem" }}>
            {tr("goToEditor", "Go to editor")}
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container" style={{ marginTop: "2rem", marginBottom: "4rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 950, marginBottom: "2rem" }}>
          {tr("checkoutTitle", "Checkout")}
        </h1>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: "4rem", alignItems: "start" }}>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "1.5rem" }}>
              {tr("shippingAddress", "Shipping address")}
            </h2>

            <form
              id="checkout-form"
              onSubmit={startPaymentFlow}
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}
            >
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="text-secondary text-sm">{tr("fullName", "Full name")}</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={shipping.fullName}
                  onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label className="text-secondary text-sm">{tr("email", "Email")}</label>
                <input
                  type="email"
                  required
                  className="input"
                  value={shipping.email}
                  onChange={(e) => setShipping({ ...shipping, email: e.target.value })}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label className="text-secondary text-sm">{tr("address", "Address")}</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={shipping.address1}
                  onChange={(e) => setShipping({ ...shipping, address1: e.target.value })}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label className="text-secondary text-sm">
                  {tr("address2", "Address line 2")} ({tr("optional", "optional")})
                </label>
                <input
                  type="text"
                  className="input"
                  value={shipping.address2 || ""}
                  onChange={(e) => setShipping({ ...shipping, address2: e.target.value })}
                />
              </div>

              <div>
                <label className="text-secondary text-sm">{tr("city", "City")}</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={shipping.city}
                  onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                />
              </div>

              <div>
                <label className="text-secondary text-sm">{tr("postalCode", "Postal code")}</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={shipping.postalCode}
                  onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value })}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label className="text-secondary text-sm">
                  {tr("state", "State / Province")} ({tr("optional", "optional")})
                </label>
                <input
                  type="text"
                  className="input"
                  value={shipping.state || ""}
                  onChange={(e) => setShipping({ ...shipping, state: e.target.value })}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label className="text-secondary text-sm">{tr("country", "Country")}</label>
                <select
                  className="input"
                  value={shipping.country}
                  onChange={(e) => setShipping({ ...shipping, country: e.target.value })}
                >
                  <option value="Thailand">{tr("thailand", "Thailand")}</option>
                  <option value="USA">{tr("usa", "USA")}</option>
                </select>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label className="text-secondary text-sm">{tr("phone", "Phone")}</label>
                <input
                  type="tel"
                  required
                  className="input"
                  value={shipping.phone}
                  onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label className="text-secondary text-sm">
                  {tr("instagram", "Instagram")} ({tr("optional", "optional")})
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder={tr("instagramPlaceholder", "@username or link")}
                  value={shipping.instagram || ""}
                  onChange={(e) => setShipping({ ...shipping, instagram: e.target.value })}
                />
              </div>
            </form>
          </div>

          <div>
            <div className="card" style={{ position: "sticky", top: "100px" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 950, marginBottom: "1rem" }}>
                {tr("orderSummary", "Order summary")}
              </h3>

              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  overflowX: "auto",
                  paddingBottom: "1rem",
                  marginBottom: "1rem",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                {cart.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      flexShrink: 0,
                      width: "60px",
                      height: "60px",
                      background: "#E5E7EB",
                      borderRadius: "var(--radius-sm)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    {item.previewUrl || item.src ? (
                      <img
                        src={(item.previewUrl || item.src) as string}
                        alt="tile"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <ImageIcon size={16} color="var(--text-tertiary)" />
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ color: "var(--text-secondary)" }}>
                  {tilesCount} {tr("tilesCount", "tiles")}
                </span>
                <span>฿{totalTHB}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                <span style={{ color: "var(--text-secondary)" }}>{tr("shipping", "Shipping")}</span>
                <span style={{ color: "#10B981" }}>{tr("free", "Free")}</span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "1.25rem",
                  fontWeight: 950,
                  borderTop: "1px solid var(--border)",
                  paddingTop: "1rem",
                  marginBottom: "1rem",
                }}
              >
                <span>{tr("total", "Total")}</span>
                <span>฿{totalTHB}</span>
              </div>

              <button
                type="submit"
                form="checkout-form"
                className="btn btn-primary"
                style={{ width: "100%", opacity: busy ? 0.7 : 1, backgroundColor: "black" }}
                disabled={busy}
              >
                {busy ? tr("preparing", "Preparing…") : tr("payWithCard", "Pay with Card")}
              </button>

              {(busy || stepLabel) && (
                <div style={{ marginTop: 12, fontSize: 13, color: "var(--text-tertiary)", fontWeight: 650 }}>
                  {stepLabel || tr("processing", "Processing…")}
                </div>
              )}

              <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-tertiary)" }}>
                {tr("checkoutNote", "This will upload your photos and open secure card payment.")}
              </div>

              <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-tertiary)" }}>
                {tr("currencyNote", "Currency: THB • Visa / Mastercard / JCB • Bank app confirmation may be required")}
              </div>

              <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-tertiary)" }}>
                Toss charge (test): ₩{totalKRW}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
