"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { useApp } from "@/context/AppContext";
import { auth } from "@/lib/firebase";
import { reload, sendEmailVerification } from "firebase/auth";

function formatT(template: string, params: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? "");
}

export default function VerifyEmailClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/editor";

  const app = useApp() as any;
  const t = (app?.t as (key: string) => string) || ((k: string) => k);

  const { user, authLoading } = app;

  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    if (authLoading) return;

    // 로그인 세션 없으면 로그인으로
    if (!user) {
      router.replace(
        `/login?next=${encodeURIComponent(`/verify-email?next=${encodeURIComponent(next)}`)}`
      );
      return;
    }

    // 이미 인증이면 바로 이동
    if (user.emailVerified) {
      router.replace(next);
      return;
    }

    setMsg(t("verifyHintBox"));
  }, [authLoading, user, router, next, t]);

  const resend = async () => {
    try {
      setSending(true);
      setMsg("");

      if (!auth.currentUser) {
        router.replace(
          `/login?next=${encodeURIComponent(`/verify-email?next=${encodeURIComponent(next)}`)}`
        );
        return;
      }

      await sendEmailVerification(auth.currentUser);
      setMsg(t("verifyResentOk"));
    } catch (e: any) {
      setMsg(e?.message || t("verifyResentFail"));
    } finally {
      setSending(false);
    }
  };

  const check = async () => {
    try {
      setChecking(true);
      setMsg("");

      if (!auth.currentUser) {
        router.replace(
          `/login?next=${encodeURIComponent(`/verify-email?next=${encodeURIComponent(next)}`)}`
        );
        return;
      }

      await reload(auth.currentUser);
      if (auth.currentUser.emailVerified) {
        router.replace(next);
      } else {
        setMsg(t("verifyNotYet"));
      }
    } catch (e: any) {
      setMsg(e?.message || t("verifyCheckFail"));
    } finally {
      setChecking(false);
    }
  };

  const emailLine =
    user?.email && typeof user.email === "string"
      ? formatT(t("verifySentToEmail"), { email: user.email })
      : "";

  return (
    <AppLayout>
      <div
        style={{
          minHeight: "calc(100vh - 64px)",
          background: "#F9FAFB",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "2rem 1rem",
        }}
      >
        <div className="card" style={{ width: "100%", maxWidth: 520, padding: "1.5rem" }}>
          <h1 style={{ fontSize: 20, fontWeight: 950 }}>{t("verifyTitle")}</h1>

          <p style={{ marginTop: 10, color: "var(--text-tertiary)", fontWeight: 650, lineHeight: 1.6 }}>
            {user?.email ? (
              <>
                {emailLine ? (
                  <>
                    {emailLine}.
                    <br />
                  </>
                ) : null}
                {t("verifyPleaseClick")}
              </>
            ) : (
              <>{t("verifyGenericDesc")}</>
            )}
          </p>

          {msg ? (
            <div
              style={{
                marginTop: 14,
                padding: "12px 14px",
                borderRadius: 12,
                background: "#F3F4F6",
                border: "1px solid #E5E7EB",
                fontWeight: 700,
              }}
            >
              {msg}
            </div>
          ) : null}

          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            <button className="btn btn-primary" onClick={check} disabled={checking}>
              {checking ? t("verifyChecking") : t("verifyAlreadyVerified")}
            </button>

            <button className="btn btn-secondary" onClick={resend} disabled={sending}>
              {sending ? t("verifySending") : t("verifyResend")}
            </button>

            <button className="btn btn-text" onClick={() => router.replace("/login")}>
              {t("verifyBackToLogin")}
            </button>
          </div>

          <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-tertiary)", fontWeight: 650 }}>
            {t("verifyTip")}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
