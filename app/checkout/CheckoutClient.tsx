"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { useApp } from "@/context/AppContext";
import { CreditCard, Image as ImageIcon } from "lucide-react";

// ✅ 너 프로젝트에 이미 있는 orders 유틸을 그대로 사용
import { createOrder } from "@/utils/orders";

type OrderItem = {
  id: string;
  previewUrl?: string;
  src?: string;
  qty?: number;
  // (선택) editor에서 넘어오는 추가 필드들도 섞일 수 있으니 열어둠
  zoom?: number;
  dragPos?: { x: number; y: number };
  filter?: string;
  fileName?: string;
};

type ShippingAddress = {
  fullName: string;
  email?: string; // ✅ optional
  address1: string;
  address2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone: string;
  instagram?: string; // ✅ optional
};

// ✅ Editor와 동일 키
const ORDER_ITEMS_KEY = "MYTILE_ORDER_ITEMS";

function safeParseJSON<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
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

  // ✅ 1) checkout은 "이번 주문"을 sessionStorage에서 읽는 것이 정답
  //    (이전 주문이 cart에 남아 섞이는 문제를 원천 차단)
  const [sessionItems, setSessionItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    const parsed = safeParseJSON<OrderItem[]>(sessionStorage.getItem(ORDER_ITEMS_KEY));
    if (Array.isArray(parsed)) {
      setSessionItems(parsed);
    } else {
      setSessionItems([]);
    }
  }, []);

  // ✅ 2) 그래도 app.cart가 있을 수 있으니 fallback로만 사용(최후 수단)
  const cartFallback: OrderItem[] = (app?.cart || []) as OrderItem[];

  // ✅ 실제 결제/주문 생성에 쓸 items
  const items: OrderItem[] = useMemo(() => {
    const base = sessionItems.length ? sessionItems : cartFallback;

    // ✅ qty 기본 1, previewUrl 우선, src는 fallback
    const normalized = (Array.isArray(base) ? base : [])
      .filter((it) => !!it?.id)
      .map((it) => ({
        ...it,
        qty: Number(it.qty) || 1,
        previewUrl: it.previewUrl || undefined,
        src: it.src || undefined,
      }));

    // ✅ 중복 id 제거(혹시라도 섞였을 때 안전장치)
    const seen = new Set<string>();
    const deduped: OrderItem[] = [];
    for (const it of normalized) {
      if (seen.has(it.id)) continue;
      seen.add(it.id);
      deduped.push(it);
    }
    return deduped;
  }, [sessionItems, cartFallback]);

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

  // ✅ 가격 로직 (지금은 tile당 200)
  const tilesCount = useMemo(() => {
    return Array.isArray(items)
      ? items.reduce((sum, it) => sum + (Number(it.qty) || 1), 0)
      : 0;
  }, [items]);

  const total = useMemo(() => tilesCount * 200, [tilesCount]);

  const onPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!items?.length) return;

    try {
      setIsPaying(true);

      // ✅ 빈 문자열은 저장 시 깔끔하게 undefined로 정리
      const cleanedShipping: ShippingAddress = {
        ...shipping,
        fullName: shipping.fullName?.trim() || "",
        email: shipping.email?.trim() || undefined,
        address1: shipping.address1?.trim() || "",
        address2: shipping.address2?.trim() || undefined,
        city: shipping.city?.trim() || "",
        state: shipping.state?.trim() || undefined,
        postalCode: shipping.postalCode?.trim() || "",
        country: shipping.country?.trim() || "Thailand",
        phone: shipping.phone?.trim() || "",
        instagram: shipping.instagram?.trim() || undefined,
      };

      // ✅ 필수값 최소 검증(UX 해치지 않게 아주 얕게)
      if (!cleanedShipping.fullName || !cleanedShipping.address1 || !cleanedShipping.city || !cleanedShipping.postalCode || !cleanedShipping.phone) {
        alert(tr("fillRequired", "Please fill in required fields."));
        setIsPaying(false);
        return;
      }

      // ✅ 모든 아이템 qty 기본 1 유지 + "미리보기 우선"
      const normalizedItems: OrderItem[] = items.map((it) => ({
        ...it,
        qty: Number(it.qty) || 1,
        previewUrl: it.previewUrl || it.src, // ✅ Admin/리스트 미리보기 안정화
      }));

      // ✅ 구형 Admin UI 호환 shipping(legacy)
      const legacyShipping = {
        name: cleanedShipping.fullName,
        email: cleanedShipping.email,
        phone: cleanedShipping.phone,
        instagram: cleanedShipping.instagram,
        address: cleanedShipping.address1,
        address2: cleanedShipping.address2,
        city: cleanedShipping.city,
        state: cleanedShipping.state,
        postalCode: cleanedShipping.postalCode,
        country: cleanedShipping.country,
      };

      const newOrder = createOrder({
        items: normalizedItems,
        total,
        currency: "฿",

        // ✅ 신형
        shippingAddress: cleanedShipping,

        // ✅ 구형 호환
        shipping: legacyShipping,
      });

      // ✅✅✅ 핵심: 결제 성공 후 "이번 주문 임시 데이터" 삭제
      // - 다음 주문에서 이전 주문이 checkout에 섞여 보이는 현상 방지
      try {
        sessionStorage.removeItem(ORDER_ITEMS_KEY);
        sessionStorage.removeItem("MYTILE_EDITOR_STATE"); // editor 복원 상태도 제거(원하면 유지 가능)
      } catch {}

      // (선택) AppContext cart를 쓰는 곳이 있으면 비우기
      if (typeof app?.setCart === "function") app.setCart([]);

      router.push(`/order-success?orderId=${encodeURIComponent(newOrder.id)}`);
    } finally {
      setIsPaying(false);
    }
  };

  // ✅ cart/sessionItems 둘다 비면 checkout 접근 못하게
  if (!items || items.length === 0) {
    return (
      <AppLayout>
        <div className="container" style={{ textAlign: "center", padding: "4rem 1rem" }}>
          <div style={{ fontSize: 22, fontWeight: 950 }}>
            {tr("cartEmpty", "Your cart is empty")}
          </div>
          <div style={{ marginTop: 10, color: "var(--text-tertiary)", fontWeight: 650 }}>
            {tr("cartEmptyHint", "Add some photos first, then come back to checkout.")}
          </div>

          <button
            onClick={() => router.push("/editor")}
            className="btn btn-primary"
            style={{ marginTop: "1.25rem" }}
          >
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
          {/* Left: Shipping & Payment */}
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "1.5rem" }}>
              {tr("shippingAddress", "Shipping address")}
            </h2>

            <form
              id="checkout-form"
              onSubmit={onPay}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
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

              {/* ✅ Email (optional) */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="text-secondary text-sm">
                  {tr("email", "Email")} ({tr("optional", "optional")})
                </label>
                <input
                  type="email"
                  className="input"
                  value={shipping.email || ""}
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

              {/* address2 optional */}
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

              {/* state optional */}
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

              {/* ✅ Instagram optional */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="text-secondary text-sm">
                  Instagram ({tr("optional", "optional")})
                </label>
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
                  <input
                    type="text"
                    placeholder="Card number"
                    style={{ border: "none", width: "100%", outline: "none" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <input type="text" placeholder="MM / YY" className="input" />
                  <input type="text" placeholder="CVC" className="input" />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
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
                {items.map((item) => (
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
                <span>฿{total}</span>
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
                  marginBottom: "1.5rem",
                }}
              >
                <span>{tr("total", "Total")}</span>
                <span>฿{total}</span>
              </div>

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
