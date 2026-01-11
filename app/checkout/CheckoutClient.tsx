"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { useApp } from "@/context/AppContext";
import { CreditCard, Image as ImageIcon, Loader2 } from "lucide-react";

// ✅ uid-scoped orders 유틸
import { createOrder } from "@/utils/orders";

// ✅ blob/data url → firebase downloadURL
import { ensureStorageUrl } from "@/utils/storageUpload";

type OrderItem = {
  id: string;
  previewUrl?: string;
  src?: string;
  qty?: number;
};

type ShippingAddress = {
  fullName: string;
  email: string; // ✅ 필수
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

function safeParseItems(raw: string | null): OrderItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x) => x && typeof x.id === "string");
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

  // Firebase Storage 자주 나오는 케이스들
  if (code === "storage/retry-limit-exceeded") {
    return "사진 업로드가 계속 실패해서 시간 초과가 났습니다. (Storage 재시도 한도 초과)\nStorage Rules/CORS 설정을 확인한 뒤 다시 시도해 주세요.";
  }
  if (code === "storage/unauthorized" || code === "storage/unauthenticated") {
    return "Storage 업로드 권한이 없습니다. 로그인 상태와 Storage Rules(쓰기 권한)를 확인해 주세요.";
  }
  if (code === "storage/canceled") {
    return "업로드가 취소되었습니다. 다시 시도해 주세요.";
  }
  if (code === "storage/unknown") {
    return "알 수 없는 Storage 오류가 발생했습니다. 콘솔 로그를 확인해 주세요.";
  }

  // CORS 류는 보통 message에 'CORS' 또는 'blocked by CORS'가 들어감
  if (msg.toLowerCase().includes("cors") || msg.toLowerCase().includes("blocked by cors")) {
    return "브라우저가 Storage 업로드 요청을 CORS 정책 때문에 차단했습니다.\nFirebase Storage 설정/Rules 또는 도메인 설정을 확인해야 합니다.";
  }

  // 그 외
  return msg || "Checkout failed. Please try again.";
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

  useEffect(() => {
    if (app?.authLoading) return;

    if (Array.isArray(cartFromCtx) && cartFromCtx.length > 0) {
      setHydrating(false);
      return;
    }

    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      const sessionItems = safeParseItems(raw);

      if (sessionItems.length > 0) {
        if (typeof app?.setCart === "function") {
          app.setCart(
            sessionItems.map((it) => ({
              id: it.id,
              previewUrl: it.previewUrl,
              src: it.src,
              qty: it.qty ?? 1,
            }))
          );
        }
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

  const [isPaying, setIsPaying] = useState(false);

  // ✅ 업로드 진행상태
  const [uploadLabel, setUploadLabel] = useState<string>("");

  const total = useMemo(() => {
    const count = Array.isArray(cart)
      ? cart.reduce((sum, it) => sum + (Number(it.qty) || 1), 0)
      : 0;
    return count * 200;
  }, [cart]);

  const tilesCount = useMemo(() => {
    return Array.isArray(cart)
      ? cart.reduce((sum, it) => sum + (Number(it.qty) || 1), 0)
      : 0;
  }, [cart]);

  const onPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart?.length) return;

    const uid = app?.user?.uid as string | undefined;
    if (!uid) {
      router.replace(`/login?next=${encodeURIComponent("/checkout")}`);
      return;
    }

    // ✅ 이메일 필수 검증
    const email = (shipping.email || "").trim();
    if (!email) {
      alert("Email is required.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      alert("Please enter a valid email address.");
      return;
    }

    setIsPaying(true);
    setUploadLabel("");

    try {
      const cleanedShipping: ShippingAddress = {
        ...shipping,
        email, // ✅ 절대 undefined 금지
        address2: shipping.address2?.trim() || undefined,
        state: shipping.state?.trim() || undefined,
        instagram: shipping.instagram?.trim() || undefined,
      };

      // ✅ orderId를 먼저 만들어 업로드 경로에 사용
      const orderId = `ORD-${Date.now()}`;

      const uploadedItems: OrderItem[] = [];

      for (let i = 0; i < cart.length; i++) {
        const it = cart[i];
        const url = pickItemUrl(it);

        setUploadLabel(`Uploading photo ${i + 1} / ${cart.length}…`);

        const finalUrl = url
          ? await ensureStorageUrl({
              url,
              uid,
              orderId,
              index: i,
            })
          : "";

        // ✅ 핵심: 업로드 실패면 여기서 바로 중단 -> 무한 processing 방지
        if (!finalUrl) {
          throw new Error("Image upload failed. Please try again.");
        }

        uploadedItems.push({
          ...it,
          previewUrl: finalUrl,
          src: finalUrl,
          qty: it.qty ?? 1,
        });
      }

      setUploadLabel("Creating order…");

      const newOrder = createOrder(uid, {
        items: uploadedItems,
        total,
        currency: "฿",
        shippingAddress: cleanedShipping,
      });

      if (typeof app?.setCart === "function") app.setCart([]);

      setUploadLabel("");
      router.push(`/order-success?orderId=${encodeURIComponent(newOrder.id)}`);
    } catch (err: any) {
      console.error(err);
      alert(userFriendlyCheckoutError(err));
      setUploadLabel("");
    } finally {
      setIsPaying(false);
    }
  };

  if (hydrating) {
    return (
      <AppLayout>
        <div className="container" style={{ textAlign: "center", padding: "4rem 1rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, color: "var(--text-tertiary)" }}>
            <Loader2 className="animate-spin" size={18} />
            <span style={{ fontWeight: 650 }}>{tr("loading", "Loading your cart…")}</span>
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
            {tr("goToDashboard", "Go to editor")}
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

        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "4rem" }}>
          {/* Left */}
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "1.5rem" }}>
              {tr("shippingAddress", "Shipping address")}
            </h2>

            <form
              id="checkout-form"
              onSubmit={onPay}
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

              {/* ✅ Email required */}
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
                  <option value="Thailand">Thailand</option>
                  <option value="USA">USA</option>
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
                <label className="text-secondary text-sm">Instagram ({tr("optional", "optional")})</label>
                <input
                  type="text"
                  className="input"
                  placeholder="@username or link"
                  value={shipping.instagram || ""}
                  onChange={(e) => setShipping({ ...shipping, instagram: e.target.value })}
                />
              </div>
            </form>

            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginTop: "3rem", marginBottom: "1.5rem" }}>
              {tr("payment", "Payment")}
            </h2>

            <div className="card">
              <button
                className="btn btn-primary"
                style={{ width: "100%", marginBottom: "1.5rem", backgroundColor: "black" }}
                type="button"
                onClick={() => alert("GPay is not connected yet.")}
              >
                {tr("payGPay", "Pay with Google Pay")}
              </button>

              <div style={{ display: "flex", alignItems: "center", margin: "1rem 0", color: "var(--text-tertiary)" }}>
                <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
                <span style={{ padding: "0 0.5rem", fontSize: "0.875rem" }}>{tr("payCard", "Pay with card")}</span>
                <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="input" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <CreditCard size={20} className="text-secondary" />
                  <input type="text" placeholder="Card number" style={{ border: "none", width: "100%", outline: "none" }} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <input type="text" placeholder="MM / YY" className="input" />
                  <input type="text" placeholder="CVC" className="input" />
                </div>
              </div>
            </div>
          </div>

          {/* Right */}
          <div>
            <div className="card" style={{ position: "sticky", top: "100px" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 950, marginBottom: "1rem" }}>
                {tr("orderSummary", "Order summary")}
              </h3>

              <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "1rem", marginBottom: "1rem", borderBottom: "1px solid var(--border)" }}>
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
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={(item.previewUrl || item.src) as string} alt="tile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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
                <span>฿{total}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                <span style={{ color: "var(--text-secondary)" }}>{tr("shipping", "Shipping")}</span>
                <span style={{ color: "#10B981" }}>{tr("free", "Free")}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.25rem", fontWeight: 950, borderTop: "1px solid var(--border)", paddingTop: "1rem", marginBottom: "1.0rem" }}>
                <span>{tr("total", "Total")}</span>
                <span>฿{total}</span>
              </div>

              {(isPaying || uploadLabel) && (
                <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "0.75rem" }}>
                  {uploadLabel || tr("processingPayment", "Processing…")}
                </div>
              )}

              <button
                type="submit"
                form="checkout-form"
                className="btn btn-primary"
                style={{ width: "100%", opacity: isPaying ? 0.7 : 1 }}
                disabled={isPaying}
              >
                {isPaying ? tr("processingPayment", "Processing…") : tr("payNow", "Pay now")}
              </button>

              <p style={{ marginTop: "1rem", fontSize: "0.75rem", color: "var(--text-tertiary)", textAlign: "center" }}>
                {tr("paymentRedirect", "After payment, you’ll be redirected to your order confirmation.")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
