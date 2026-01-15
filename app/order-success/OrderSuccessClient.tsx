// app/order-success/OrderSuccessClient.tsx
"use client";

import React, { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Package, Plus } from "lucide-react";
import { useApp } from "@/context/AppContext";
import AppLayout from "@/components/AppLayout";

export default function OrderSuccessClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const app = useApp() as any;
  const t = app?.t as ((key: string) => string) | undefined;

  const orderId = searchParams.get("orderId") || "";

  const tr = (key: string, fallback: string) => {
    const v = t?.(key);
    if (!v || v === key) return fallback;
    return v;
  };

  const prettyOrderNumber = useMemo(() => {
    if (!orderId) return "";

    const cleaned = orderId.replace(/\s+/g, "").toUpperCase();
    const tail = cleaned.length > 10 ? cleaned.slice(-8) : cleaned;

    if (cleaned.startsWith("ORD-")) {
      const after = cleaned.slice(4);
      const short = after.length > 8 ? after.slice(-8) : after;
      return `ORD-${short}`;
    }

    return `ORD-${tail}`;
  }, [orderId]);

  const goMyOrders = () => {
    router.push("/my-orders");
  };

  const createMoreTiles = () => {
    try {
      app?.clearCart?.();
      app?.resetCart?.();
      app?.resetEditor?.();
      app?.clearSelections?.();
      app?.setSelectedImages?.([]);
      app?.setCart?.([]);
    } catch {}

    router.push("/editor");
  };

  return (
    <AppLayout>
      <div
        style={{
          minHeight: "calc(100vh - 64px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F9FAFB",
          padding: "1rem",
        }}
      >
        <div
          className="card"
          style={{
            maxWidth: "520px",
            width: "100%",
            textAlign: "center",
            padding: "3rem 2rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.25rem",
          }}
        >
          <div
            style={{
              width: "84px",
              height: "84px",
              borderRadius: "50%",
              backgroundColor: "#ECFDF5",
              color: "#10B981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "0.25rem",
            }}
          >
            <CheckCircle size={42} />
          </div>

          <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)" }}>
            {tr("orderThanksTitle", "Thank you for your order!")}
          </h1>

          <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", lineHeight: 1.6 }}>
            {tr("orderPreparing", "We’re preparing your tiles now.")}
            {prettyOrderNumber && (
              <span
                style={{
                  display: "block",
                  marginTop: "0.75rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                {prettyOrderNumber}
              </span>
            )}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%", marginTop: "0.75rem" }}>
            <button onClick={goMyOrders} className="btn btn-primary" style={{ justifyContent: "center", padding: "1rem" }}>
              <Package size={20} style={{ marginRight: "0.5rem" }} />
              {tr("viewMyOrders", "View My Orders")}
            </button>

            <button
              onClick={createMoreTiles}
              className="btn btn-secondary"
              style={{ justifyContent: "center", padding: "1rem" }}
            >
              <Plus size={20} style={{ marginRight: "0.5rem" }} />
              {tr("createMoreTiles", "Create More Tiles")}
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
