"use client";

import React, { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";

export default function AccountRecoveryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { sendPasswordReset } = useApp() as any;

  const nextPath = useMemo(() => {
    const n = searchParams?.get("next");
    if (!n) return "/editor";
    return n.startsWith("/") ? n : "/editor";
  }, [searchParams]);

  const backPath = useMemo(() => {
    const b = searchParams?.get("back");
    if (!b) return "/login";
    return b.startsWith("/") ? b : "/login";
  }, [searchParams]);

  const presetEmail = useMemo(() => {
    return (searchParams?.get("email") || "").trim();
  }, [searchParams]);

  const [email, setEmail] = useState(presetEmail);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    const cleaned = (email || "").trim();
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
        padding: "24px 16px",
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: 460,
          padding: 28,
          boxShadow: "var(--shadow-lg)",
          borderRadius: 16,
        }}
      >
        <h1
          style={{
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            marginBottom: 8,
            color: "var(--text)",
          }}
        >
          Find my email / password
        </h1>

        <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.5 }}>
          Enter your email address and we’ll send a password reset email.
        </p>

        <div style={{ marginTop: 18 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
            Email address
          </label>

          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            autoComplete="email"
            style={{
              width: "100%",
            }}
          />

          {sent && (
            <div style={{ marginTop: 10, fontSize: 13, color: "var(--text-secondary)" }}>
              Password reset email sent. Please check inbox & spam.
            </div>
          )}

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSend}
            disabled={loading || !email.trim()}
            style={{
              width: "100%",
              marginTop: 16,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Sending..." : "Send password reset email"}
          </button>

          <div style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>
            <button
              type="button"
              className="btn btn-text"
              style={{ padding: 0, height: "auto", fontWeight: 600 }}
              onClick={() => router.push(`${backPath}?next=${encodeURIComponent(nextPath)}`)}
              disabled={loading}
            >
              Back to login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
