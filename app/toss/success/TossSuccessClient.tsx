// app/toss/success/successClient.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { useApp } from "@/context/AppContext";
import { CheckCircle2, ArrowRight, AlertCircle, Loader2 } from "lucide-react";

import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseClient } from "@/lib/firebase.client";

type ApproveState = "idle" | "approving" | "approved" | "failed";

export default function SuccessClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const app = useApp() as any;

  const t = app?.t || {};

  const [state, setState] = useState<ApproveState>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // ✅ Toss redirect params
  const paymentKey = sp.get("paymentKey") || "";
  const orderId = sp.get("orderId") || "";
  const amountStr = sp.get("amount") || "";
  const amount = Number(amountStr || 0);

  // ✅ 우리가 Checkout에서 successUrl에 넣어둔 docId
  const docId = sp.get("docId") || "";

  const canApprove = useMemo(() => {
    return Boolean(paymentKey && orderId && Number.isFinite(amount) && amount > 0 && docId);
  }, [paymentKey, orderId, amount, docId]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!canApprove) {
        setState("failed");
        setErrorMsg(
          "Missing payment parameters. Please return to My Orders or try again.\n" +
            `paymentKey:${!!paymentKey}, orderId:${!!orderId}, amount:${amount}, docId:${!!docId}`
        );
        return;
      }

      setState("approving");
      setErrorMsg("");

      try {
        // 1) ✅ 서버에서 Toss 승인(검증)
        const resp = await fetch("/api/toss/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentKey, orderId, amount }),
        });

        const data = await resp.json().catch(() => ({}));

        if (!resp.ok || !data?.ok) {
          const msg =
            data?.error?.message ||
            data?.error ||
            data?.message ||
            "Payment approval failed. Please contact support.";
          throw new Error(typeof msg === "string" ? msg : "Payment approval failed.");
        }

        const payment = data?.payment;

        // 2) ✅ Firestore 주문 업데이트 (paid 처리)
        const { db } = getFirebaseClient();

        const ref = doc(db, "orders", docId);

        await updateDoc(ref, {
          status: "paid",
          paidAt: serverTimestamp(),
          paymentProvider: "toss",
          toss: {
            paymentKey,
            orderId,
            amount,
            // 필요한 값만 저장 (너무 큰 객체는 저장하지 말자)
            method: payment?.method || null,
            status: payment?.status || null,
            currency: payment?.currency || null,
            approvedAt: payment?.approvedAt || null,
            receiptUrl: payment?.receipt?.url || null,
          },
          updatedAt: serverTimestamp(),
        });

        if (cancelled) return;
        setState("approved");
      } catch (e: any) {
        if (cancelled) return;
        setState("failed");
        setErrorMsg(e?.message || "Payment approval failed.");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [canApprove, paymentKey, orderId, amount, docId]);

  const isBusy = state === "approving";

  return (
    <AppLayout>
      <div
        style={{
          backgroundColor: "#F9FAFB",
          minHeight: "calc(100vh - 64px)",
          padding: "2rem 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          className="card"
          style={{
            width: "min(720px, 92vw)",
            padding: "1.75rem",
            textAlign: "center",
            transform: "translateY(-300px)",
          }}
        >
          {/* 아이콘 */}
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 18,
              margin: "0 auto",
              background: state === "failed" ? "#FEF2F2" : "#ECFDF5",
              border: state === "failed" ? "1px solid #FECACA" : "1px solid #A7F3D0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: state === "failed" ? "#991B1B" : "#065F46",
            }}
          >
            {isBusy ? <Loader2 className="animate-spin" size={22} /> : state === "failed" ? <AlertCircle size={26} /> : <CheckCircle2 size={26} />}
          </div>

          {/* 타이틀 */}
          <div style={{ marginTop: 14, fontSize: 22, fontWeight: 950 }}>
            {isBusy
              ? (t.paymentApprovingTitle || "Approving payment…")
              : state === "failed"
              ? (t.paymentFailedTitle || "Payment issue")
              : (t.paymentSuccessTitle || "Thank you!")}
          </div>

          {/* 설명 */}
          <div
            style={{
              marginTop: 12,
              fontSize: 14,
              color: "var(--text-tertiary)",
              fontWeight: 650,
              lineHeight: 1.7,
              textAlign: "center",
              whiteSpace: "pre-wrap",
            }}
          >
            {isBusy ? (
              <>
                <div>{t.paymentApprovingDesc1 || "Please wait a moment."}</div>
                <div>{t.paymentApprovingDesc2 || "We’re confirming your payment securely."}</div>
              </>
            ) : state === "failed" ? (
              <div>{errorMsg || (t.paymentFailedDesc || "We couldn't confirm your payment. Please try again.")}</div>
            ) : (
              <>
                <div>{t.paymentConfirmed || "Your order is confirmed."}</div>
                <div>{t.paymentPreparing || "We’ll start preparing your tiles now."}</div>
              </>
            )}
          </div>

          {/* 버튼 */}
          <div style={{ marginTop: 22, display: "grid", gap: 10, justifyItems: "center" }}>
            <button
              className="btn btn-primary"
              onClick={() => router.push("/my-orders")}
              style={{
                width: "min(320px, 100%)",
                display: "inline-flex",
                justifyContent: "center",
                gap: 8,
                opacity: isBusy ? 0.7 : 1,
              }}
              disabled={isBusy}
            >
              {t.goToMyOrders || "Go to My Orders"}
              <ArrowRight size={18} />
            </button>

            {state === "failed" ? (
              <button
                className="btn btn-text"
                onClick={() => router.push("/checkout")}
                style={{ width: "min(320px, 100%)", fontWeight: 950 }}
                disabled={isBusy}
              >
                {t.tryAgain || "Try again"}
              </button>
            ) : (
              <button
                className="btn btn-text"
                onClick={() => router.push("/editor")}
                style={{ width: "min(320px, 100%)", fontWeight: 950 }}
                disabled={isBusy}
              >
                {t.createTiles || "Create your tiles"}
              </button>
            )}
          </div>

          {/* 디버그(원하면 제거) */}
          <div style={{ marginTop: 14, fontSize: 12, color: "var(--text-tertiary)" }}>
            {orderId ? <>Order ID: {orderId}</> : null}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
