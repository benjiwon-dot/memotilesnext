"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { useApp } from "@/context/AppContext";
import { getFirebaseClient } from "@/lib/firebase.client";
import { reload, sendEmailVerification, type Auth } from "firebase/auth";
import { Mail, CheckCircle2, RefreshCcw, ArrowLeft, AlertCircle } from "lucide-react";

function formatT(template: string, params: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? "");
}

type ToastKind = "info" | "success" | "error";

function normalizeFirebaseErrorMessage(msg: string) {
  const m = (msg || "").toLowerCase();
  if (m.includes("too-many-requests")) return "Too many attempts. Please try again in a few minutes.";
  if (m.includes("network")) return "Network error. Please check your connection and try again.";
  return msg;
}

export default function VerifyEmailClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/editor";

  const app = useApp() as any;
  const t = (app?.t as (key: string) => string) || ((k: string) => k);
  const { user, authLoading } = app;

  // ✅ 렌더 중 getFirebaseClient() 호출 금지
  const [auth, setAuth] = useState<Auth | null>(null);
  const [firebaseReady, setFirebaseReady] = useState(false);

  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [toast, setToast] = useState<{ kind: ToastKind; text: string } | null>(null);

  const goLoginWithReturn = useMemo(() => {
    const back = `/verify-email?next=${encodeURIComponent(next)}`;
    return `/login?next=${encodeURIComponent(back)}`;
  }, [next]);

  useEffect(() => {
    try {
      const bundle = getFirebaseClient();
      setAuth(bundle.auth);
      setFirebaseReady(true);
    } catch {
      setFirebaseReady(false);
      setTimeout(() => {
        try {
          const bundle = getFirebaseClient();
          setAuth(bundle.auth);
          setFirebaseReady(true);
        } catch {
          setFirebaseReady(false);
        }
      }, 0);
    }
  }, []);

  useEffect(() => {
    if (!firebaseReady) return;
    if (authLoading) return;

    if (!user) {
      router.replace(goLoginWithReturn);
      return;
    }

    if (user.emailVerified) {
      router.replace(next);
      return;
    }

    // ✅ “We sent you …” 삭제 → 번역키로
    setToast({
      kind: "info",
      text: t("verifyPleaseClick") !== "verifyPleaseClick"
        ? t("verifyPleaseClick")
        : "Please check your inbox and click the verification link.",
    });
  }, [firebaseReady, authLoading, user, router, next, goLoginWithReturn, t]);

  const emailLine =
    user?.email && typeof user.email === "string"
      ? formatT(
          t("verifySentToEmail") !== "verifySentToEmail"
            ? t("verifySentToEmail")
            : "Verification email sent to {email}",
          { email: user.email }
        )
      : "";

  const resend = async () => {
    try {
      setSending(true);
      setToast(null);

      if (!auth?.currentUser) {
        router.replace(goLoginWithReturn);
        return;
      }

      await sendEmailVerification(auth.currentUser);

      setToast({
        kind: "success",
        text:
          t("verifyResentOk") !== "verifyResentOk"
            ? t("verifyResentOk")
            : "Verification email sent again. Please check your inbox.",
      });
    } catch (e: any) {
      const raw = e?.message || "";
      setToast({
        kind: "error",
        text:
          normalizeFirebaseErrorMessage(raw) ||
          (t("verifyResentFail") !== "verifyResentFail" ? t("verifyResentFail") : "Failed to resend verification email."),
      });
    } finally {
      setSending(false);
    }
  };

  const check = async () => {
    try {
      setChecking(true);
      setToast(null);

      if (!auth?.currentUser) {
        router.replace(goLoginWithReturn);
        return;
      }

      await reload(auth.currentUser);

      if (auth.currentUser.emailVerified) {
        setToast({
          kind: "success",
          text:
            t("verifyVerifiedRedirecting") !== "verifyVerifiedRedirecting"
              ? t("verifyVerifiedRedirecting")
              : "Verified! Redirecting…",
        });
        router.replace(next);
      } else {
        setToast({
          kind: "info",
          text:
            t("verifyNotYet") !== "verifyNotYet"
              ? t("verifyNotYet")
              : "Not verified yet. Please click the link in your email and try again.",
        });
      }
    } catch (e: any) {
      const raw = e?.message || "";
      setToast({
        kind: "error",
        text:
          normalizeFirebaseErrorMessage(raw) ||
          (t("verifyCheckFail") !== "verifyCheckFail"
            ? t("verifyCheckFail")
            : "Failed to check verification status."),
      });
    } finally {
      setChecking(false);
    }
  };

  const toastUI = toast ? (
    <div
      style={{
        marginTop: 14,
        padding: "12px 14px",
        borderRadius: 14,
        border: "1px solid #E5E7EB",
        background:
          toast.kind === "success"
            ? "rgba(16,185,129,0.10)"
            : toast.kind === "error"
              ? "rgba(239,68,68,0.10)"
              : "#F3F4F6",
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
      }}
    >
      <div style={{ marginTop: 1 }}>
        {toast.kind === "success" ? (
          <CheckCircle2 size={18} />
        ) : toast.kind === "error" ? (
          <AlertCircle size={18} />
        ) : (
          <Mail size={18} />
        )}
      </div>
      <div style={{ fontWeight: 750, lineHeight: 1.55 }}>{toast.text}</div>
    </div>
  ) : null;

  const loading = !firebaseReady;

  return (
    <AppLayout>
      <div
        style={{
          minHeight: "calc(100vh - 64px)",
          background: "#F9FAFB",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "2.5rem 1rem",
        }}
      >
        <div
          className="card"
          style={{
            width: "100%",
            maxWidth: 560,
            padding: "1.75rem",
            borderRadius: 18,
            opacity: loading ? 0.85 : 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: "rgba(17,24,39,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Mail size={22} />
            </div>

            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 20, fontWeight: 950, margin: 0 }}>
                {t("verifyTitle") !== "verifyTitle" ? t("verifyTitle") : "Verify your email"}
              </h1>
              <div style={{ marginTop: 4, fontSize: 13, fontWeight: 750, color: "var(--text-tertiary)" }}>
                {t("verifySubtitle") !== "verifySubtitle" ? t("verifySubtitle") : "One quick step to secure your account"}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontWeight: 700, lineHeight: 1.7 }}>
              {loading ? (
                t("verifyPreparing") !== "verifyPreparing" ? t("verifyPreparing") : "Preparing verification…"
              ) : user?.email ? (
                <span style={{ fontWeight: 900, color: "var(--text-primary)" }}>
                  {emailLine || `Verification email sent to ${user.email}`}
                </span>
              ) : (
                <span>
                  {t("verifyGenericDesc") !== "verifyGenericDesc"
                    ? t("verifyGenericDesc")
                    : "Please verify your email to continue."}
                </span>
              )}
            </p>

            {/* ✅ 점자/리스트 제거 + 문장 1줄만 유지 (번역키) */}
            <div
              style={{
                marginTop: 12,
                padding: "12px 14px",
                borderRadius: 14,
                border: "1px dashed rgba(0,0,0,0.12)",
                background: "white",
                color: "var(--text-tertiary)",
                fontSize: 13,
                fontWeight: 750,
                lineHeight: 1.65,
              }}
            >
              {t("verifyTip") !== "verifyTip" ? t("verifyTip") : "Check spam/junk if you can’t find the email."}
            </div>

            {toastUI}
          </div>

          <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
            <button className="btn btn-primary" onClick={check} disabled={loading || checking || sending}>
              {checking ? (
                <>
                  <RefreshCcw size={16} className="animate-spin" style={{ marginRight: 8 }} />
                  {t("verifyChecking") !== "verifyChecking" ? t("verifyChecking") : "Checking…"}
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} style={{ marginRight: 8 }} />
                  {t("verifyConfirmBtn") !== "verifyConfirmBtn" ? t("verifyConfirmBtn") : "Confirm"}
                </>
              )}
            </button>

            <button className="btn btn-secondary" onClick={resend} disabled={loading || sending || checking}>
              {sending ? (
                <>
                  <RefreshCcw size={16} className="animate-spin" style={{ marginRight: 8 }} />
                  {t("verifySending") !== "verifySending" ? t("verifySending") : "Sending…"}
                </>
              ) : (
                <>
                  <Mail size={16} style={{ marginRight: 8 }} />
                  {t("verifyResendBtn") !== "verifyResendBtn" ? t("verifyResendBtn") : "Resend email"}
                </>
              )}
            </button>

            <button
              className="btn btn-text"
              onClick={() => router.replace("/login")}
              disabled={loading || sending || checking}
            >
              <ArrowLeft size={16} style={{ marginRight: 8 }} />
              {t("verifyBackToLogin") !== "verifyBackToLogin" ? t("verifyBackToLogin") : "Back to login"}
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
