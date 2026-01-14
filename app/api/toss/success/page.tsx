// app/toss/success/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { useApp } from "@/context/AppContext";
import { Loader2 } from "lucide-react";

// 만약 utils/orders에 updateOrderStatus 같은 게 있으면 연결 추천
// import { updateOrderStatus } from "@/utils/orders";

export default function TossSuccessPage() {
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

  // 우리가 successUrl에 같이 붙여준 값(선택)
  const createdOrderDocId = sp.get("docId") || "";

  const amount = useMemo(() => Number(amountStr || 0), [amountStr]);

  const [status, setStatus] = useState<"loading" | "ok" | "fail">("loading");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const run = async () => {
      try {
        if (!paymentKey || !orderId || !Number.isFinite(amount) || amount <= 0) {
          throw new Error("Missing payment params.");
        }

        // ✅ 여기서 원래는 DB의 주문금액과 amount 비교(강력 권장)
        // Toss도 amount 검증을 요구함
        // :contentReference[oaicite:8]{index=8}

        const res = await fetch("/api/toss/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentKey, orderId, amount }),
        });

        const data = await res.json();
        if (!res.ok || !data?.ok) {
          throw new Error(JSON.stringify(data?.error || data));
        }

        // ✅ Firestore 주문 상태 업데이트(권장)
        //  - 여기서는 프로젝트마다 orders 구조가 달라서, 네 utils/orders에 맞춰 연결해야 함
        // 예:
        // if (createdOrderDocId) await updateOrderStatus(createdOrderDocId, "paid", { paymentKey, orderId });

        setStatus("ok");

        // 성공 후 네 기존 성공 페이지로 보내고 싶으면:
        // router.replace(`/order-success?orderId=${encodeURIComponent(createdOrderDocId)}&public=${encodeURIComponent(orderId)}`);
      } catch (e: any) {
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
              <div style={{ fontWeight: 800 }}>
                {tr("tossApproving", "Approving your payment…")}
              </div>
            </div>
            <div style={{ marginTop: 10, color: "var(--text-tertiary)", fontSize: 13 }}>
              {tr("tossApprovingHint", "Please don’t close this page.")}
            </div>
          </div>
        )}

        {status === "ok" && (
          <div className="card" style={{ padding: "1.25rem" }}>
            <div style={{ fontSize: 20, fontWeight: 950 }}>
              {tr("paymentSuccessTitle", "Payment complete")}
            </div>
            <div style={{ marginTop: 10, color: "var(--text-tertiary)", fontSize: 13 }}>
              {tr("paymentSuccessBody", "Thanks! Your order is now being processed.")}
            </div>

            <button
              className="btn btn-primary"
              style={{ marginTop: 16 }}
              onClick={() => router.replace("/my-orders")}
            >
              {tr("goToOrders", "Go to My Orders")}
            </button>
          </div>
        )}

        {status === "fail" && (
          <div className="card" style={{ padding: "1.25rem" }}>
            <div style={{ fontSize: 20, fontWeight: 950 }}>
              {tr("paymentFailedTitle", "Payment approval failed")}
            </div>
            <div style={{ marginTop: 10, color: "crimson", fontSize: 13, whiteSpace: "pre-wrap" }}>
              {error}
            </div>

            <button
              className="btn"
              style={{ marginTop: 16 }}
              onClick={() => router.replace("/checkout")}
            >
              {tr("backToCheckout", "Back to checkout")}
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
