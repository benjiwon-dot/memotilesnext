"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard } from "lucide-react";

import AppLayout from "../../components/AppLayout";
import { useApp } from "../../context/AppContext";
import { createOrder } from "../../utils/orders";

type Shipping = {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
};

const ORDER_ITEMS_KEY = "MYTILE_ORDER_ITEMS";

export default function CheckoutClient() {
  const router = useRouter();
  const { cart: contextCart, t } = useApp();

  const [cart, setCart] = useState<any[]>([]);
  const [shipping, setShipping] = useState<Shipping>({
    name: "",
    address: "",
    city: "",
    postalCode: "",
    country: "Thailand",
    phone: "",
  });

  // ✅ Editor에서 sessionStorage에 저장한 orderItems 우선 사용
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(ORDER_ITEMS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setCart(parsed);
          return;
        }
      }
    } catch {
      // ignore
    }
    setCart(contextCart || []);
  }, [contextCart]);

  const total = useMemo(() => (cart?.length || 0) * 200, [cart]);

  /**
   * ✅ checkout에서 최종적으로 "주문에 들어갈 items"를 정규화
   * - editor에서 넘어온 items(UploadItem + CropState) 구조든
   * - contextCart(addTileToCart로 쌓은 구조)든
   * 최종적으로 orders에 저장될 때 필드가 일관되게 되도록 만든다.
   */
  const normalizeOrderItems = (items: any[]) => {
    const nowIso = new Date().toISOString();

    return (items || [])
      .filter(Boolean)
      .map((it: any) => {
        // editor -> checkout (sessionStorage) 경로:
        // { id, src, fileName, zoom, dragPos, filter, ... }
        const id = it.id;
        const src = it.src ?? it.previewUrl ?? it.imageUrl ?? it.url;
        const fileName = it.fileName ?? it.name ?? "photo";

        const zoom = typeof it.zoom === "number" ? it.zoom : 1.2;
        const dragPos =
          it.dragPos && typeof it.dragPos.x === "number" && typeof it.dragPos.y === "number"
            ? it.dragPos
            : { x: 0, y: 0 };

        const filter = typeof it.filter === "string" ? it.filter : "Original";

        // status: 주문 생성 시점에는 보통 "paid" 또는 "processing"으로 시작
        // (admin에서 printed / shipped / delivered 등으로 업데이트)
        const status = it.status ?? "paid";

        return {
          ...it,
          id,
          src, // ✅ my-orders/preview에서 공통으로 쓰기 좋게 src로 고정
          fileName,
          zoom,
          dragPos,
          filter,
          status,
          createdAt: it.createdAt ?? nowIso,
          isCropped: true,
        };
      })
      .filter((it: any) => !!it.id);
  };

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();

    const finalItems = normalizeOrderItems(cart);

    if (!finalItems.length) {
      return;
    }

    const newOrder = createOrder({
      items: finalItems,
      total,
      currency: "฿",
      shipping,
    });

    // ✅ 주문 생성 후 editor에서 넘어온 임시 저장값은 정리 (중복 주문 방지)
    try {
      sessionStorage.removeItem(ORDER_ITEMS_KEY);
    } catch {
      // ignore
    }

    router.push(`/order-success?orderId=${newOrder.id}`);
  };

  if (!cart || cart.length === 0) {
    return (
      <AppLayout>
        <div className="container" style={{ textAlign: "center", paddingTop: "4rem", paddingBottom: "4rem" }}>
          <h2>{t("cartEmpty") || "Your cart is empty"}</h2>
          <button onClick={() => router.push("/editor")} className="btn btn-primary" style={{ marginTop: "1rem" }}>
            {t("goToDashboard") || "Back to editor"}
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container" style={{ marginTop: "2rem", marginBottom: "4rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "2rem" }}>
          {t("checkoutTitle") || "Checkout"}
        </h1>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "4rem" }}>
          {/* Left */}
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1.5rem" }}>
              {t("shippingAddress") || "Shipping address"}
            </h2>

            <form
              id="checkout-form"
              onSubmit={handlePay}
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}
            >
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="text-secondary text-sm">{t("fullName") || "Full name"}</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={shipping.name}
                  onChange={(e) => setShipping({ ...shipping, name: e.target.value })}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label className="text-secondary text-sm">{t("address") || "Address"}</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={shipping.address}
                  onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                />
              </div>

              <div>
                <label className="text-secondary text-sm">{t("city") || "City"}</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={shipping.city}
                  onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                />
              </div>

              <div>
                <label className="text-secondary text-sm">{t("postalCode") || "Postal code"}</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={shipping.postalCode}
                  onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value })}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label className="text-secondary text-sm">{t("country") || "Country"}</label>
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
                <label className="text-secondary text-sm">{t("phone") || "Phone"}</label>
                <input
                  type="tel"
                  required
                  className="input"
                  value={shipping.phone}
                  onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                />
              </div>
            </form>

            <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginTop: "3rem", marginBottom: "1.5rem" }}>
              {t("payment") || "Payment"}
            </h2>

            <div className="card">
              <button
                className="btn btn-primary"
                style={{ width: "100%", marginBottom: "1.5rem", backgroundColor: "black" }}
                type="button"
              >
                {t("payGPay") || "Pay with GPay"}
              </button>

              <div style={{ display: "flex", alignItems: "center", margin: "1rem 0", color: "var(--text-tertiary)" }}>
                <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
                <span style={{ padding: "0 0.5rem", fontSize: "0.875rem" }}>
                  {t("payCard") || "Or pay with card"}
                </span>
                <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="input" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <CreditCard size={20} className="text-secondary" />
                  <input
                    type="text"
                    placeholder="Card number"
                    style={{ border: "none", width: "100%", outline: "none", background: "transparent" }}
                  />
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
              <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem" }}>
                {t("orderSummary") || "Order summary"}
              </h3>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ color: "var(--text-secondary)" }}>
                  {cart.length} {t("tilesCount") || "tiles"}
                </span>
                <span>฿{total}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                <span style={{ color: "var(--text-secondary)" }}>{t("shipping") || "Shipping"}</span>
                <span style={{ color: "#10B981" }}>{t("free") || "Free"}</span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "1.25rem",
                  fontWeight: "bold",
                  borderTop: "1px solid var(--border)",
                  paddingTop: "1rem",
                  marginBottom: "1.5rem",
                }}
              >
                <span>{t("total") || "Total"}</span>
                <span>฿{total}</span>
              </div>

              <button type="submit" form="checkout-form" className="btn btn-primary" style={{ width: "100%" }}>
                {t("payNow") || "Pay now"}
              </button>

              <p style={{ marginTop: "1rem", fontSize: "0.75rem", color: "var(--text-tertiary)", textAlign: "center" }}>
                {t("paymentRedirect") || "After payment success you will be redirected to /orders."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
