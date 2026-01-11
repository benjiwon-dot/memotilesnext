"use client";

import React, { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";

export default function AccountRecoveryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { sendPasswordReset, t } = useApp() as any;

  const nextPath = useMemo(() => {
    const n = searchParams?.get("next");
    if (!n) return "/editor";
    return n.startsWith("/") ? n : "/editor";
  }, [searchParams]);

  const backPath = "/login";

  const presetEmail = useMemo(() => {
    return (searchParams?.get("email") || "").trim();
  }, [searchParams]);

  const [email, setEmail] = useState(presetEmail);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    const cleaned = email.trim();
    if (!cleaned) return;

    try {
      setLoading(true);
      setSent(false);
      await sendPasswordReset(cleaned);
      setSent(true);
    } catch (e: any) {
      alert(e?.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F3F4F6",
        padding: 16,
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: 460,
          padding: 28,
          borderRadius: 16,
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
          {t("recoveryTitle")}
        </h1>

        <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 20 }}>
          {t("recoveryDesc")}
        </p>

        <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: "block" }}>
          {t("recoveryEmailLabel")}
        </label>

        <input
          type="email"
          className="input"
          placeholder={t("recoveryEmailLabel")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />

        {sent && (
          <div style={{ marginTop: 10, fontSize: 13, color: "var(--text-secondary)" }}>
            {t("recoverySent")}
          </div>
        )}

        <button
          className="btn btn-primary"
          style={{ width: "100%", marginTop: 16 }}
          disabled={loading || !email.trim()}
          onClick={handleSend}
        >
          {loading ? t("recoverySending") : t("recoverySendReset")}
        </button>

        <div style={{ marginTop: 16, textAlign: "center" }}>
          <button
            className="btn btn-text"
            onClick={() => router.push(`${backPath}?next=${encodeURIComponent(nextPath)}`)}
          >
            {t("recoveryBackToLogin")}
          </button>
        </div>
      </div>
    </div>
  );
}
