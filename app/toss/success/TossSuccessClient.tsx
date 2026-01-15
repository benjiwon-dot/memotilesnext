// app/toss/success/TossSuccessClient.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { useApp } from "@/context/AppContext";
import { Loader2 } from "lucide-react";

const SESSION_KEY = "MYTILE_ORDER_ITEMS";

export default function TossSuccessClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const app = useApp() as any;

  const t = app?.t as ((k: string) => string) | undefined;
  const tr = (k: string, fallback: string) => {
    const v = t?.(k);
    if (!v || v === k) return fallback;
    return v;
  };

  const paymentKey = sp.get("paymentKey") || "";
  const orderId = sp.get("orderId") || "";
  const amountStr = sp.get("amount") || "0";
  const createdOrderDocId = sp.get("docId") || ""; // (사용 안해도 유지)

  const amount = useMemo(() => Number(amountStr || 0), [amountStr]);

  const [status, setStatus] = useState<"loading" | "ok" | "fail">("loading");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const run = async () => {
      try {
        if (!paymentKey || !orderId || !Number.isFinite(amount) || amount <= 0) {
          throw new Error("Missing payment params.");
        }

        const res = await fetch("/api/toss/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentKey, orderId, amount }),
        });

        const data = await res.json();
        if (!res.ok || !data?.ok) {
          throw new Error(JSON.stringify(data?.error || data));
        }

        // ✅ 결제 승인 성공 시에만 cart/session 비우기
        if (typeof app?.setCart === "function") app.setCart([]);
        try {
          sessionStorage.removeItem(SESSION_KEY);
        } catch {}

        setStatus("ok");
      } catch (e: any) {
        console.error("[TOSS SUCCESS] approve failed:", e);
        setError(e?.message || "Payment approval failed.");
        setStatus("fail");
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppLayout>
      <div className="container" style={{ marginTop: "2.5rem", marginBottom: "4rem", maxWidth: 720 }}>
        {status === "loading" && (
          <div className="card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Loader2 className="animate-spin" size={18} />
              <div style={{ fontWeight: 800 }}>{tr("tossApproving", "Approving your payment…")}</div>
            </div>
            <div style={{ marginTop: 10, color: "var(--text-tertiary)", fontSize: 13 }}>
              {tr("tossApprovingHint", "Please don’t close this page.")}
            </div>
          </div>
        )}

        {status === "ok" && (
          <div className="card" style={{ padding: "1.25rem" }}>
            <div style={{ fontSize: 20, fontWeight: 950 }}>{tr("paymentSuccessTitle", "Payment complete")}</div>
            <div style={{ marginTop: 10, color: "var(--text-tertiary)", fontSize: 13 }}>
              {tr("paymentSuccessBody", "Thanks! Your order is now being processed.")}
            </div>

            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => router.replace("/my-orders")}>
              {tr("goToOrders", "Go to My Orders")}
            </button>
          </div>
        )}

        {status === "fail" && (
          <div className="card" style={{ padding: "1.25rem" }}>
            <div style={{ fontSize: 20, fontWeight: 950 }}>{tr("paymentFailedTitle", "Payment approval failed")}</div>
            <div style={{ marginTop: 10, color: "crimson", fontSize: 13, whiteSpace: "pre-wrap" }}>{error}</div>

            <button className="btn" style={{ marginTop: 16 }} onClick={() => router.replace("/checkout")}>
              {tr("backToCheckout", "Back to checkout")}
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
