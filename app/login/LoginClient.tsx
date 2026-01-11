"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";

const GOOGLE_LOGO_SRC = "/assets/google-g.png";

export default function LoginClient() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");

  const { loginWithGoogle, registerWithEmail, loginWithEmail, t, user, authLoading, saveLastEmail } =
    useApp() as any;

  const router = useRouter();
  const searchParams = useSearchParams();

  // ✅ 번역이 없으면 key 자체가 그대로 오는 경우 방지
  const tt = (key: string, fallback: string) => {
    const v = t?.(key);
    if (!v || v === key) return fallback;
    return v;
  };

  // ✅ next 있으면 next로, 없으면 editor
  const nextPath = useMemo(() => {
    const n = searchParams?.get("next");
    if (!n) return "/editor";
    return n.startsWith("/") ? n : "/editor";
  }, [searchParams]);

  // ✅ 이미 로그인 상태면 로그인 페이지 보여주지 말고 바로 이동
  useEffect(() => {
    if (authLoading) return;
    if (user) router.replace(nextPath);
  }, [authLoading, user, router, nextPath]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);

      // ✅ 이미 로그인 상태면 팝업 띄우지 말고 바로 이동
      if (user) {
        router.replace(nextPath);
        return;
      }

      const u = await loginWithGoogle();
      if (u?.email) saveLastEmail?.(u.email);

      router.replace(nextPath);
    } catch (err: any) {
      console.error("[LOGIN] google error", err);
      if (err?.code === "auth/popup-closed-by-user") return;
      alert(err?.message || "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const cleanedEmail = email.trim();

      if (isRegistering) {
        if (!fullName.trim()) {
          alert(tt("loginEnterName", "Please enter your name."));
          return;
        }
        if (pw.length < 8) {
          alert(tt("loginPwMin", "Password must be at least 8 characters."));
          return;
        }
        if (pw !== pw2) {
          alert(tt("loginPwMismatch", "Passwords do not match."));
          return;
        }

        const u = await registerWithEmail(cleanedEmail, pw, fullName);
        if (u?.email) saveLastEmail?.(u.email);

        // ✅ 가입 후: verify 페이지로 보내기
        router.replace(`/verify-email?next=${encodeURIComponent(nextPath)}`);
        return;
      }

      // ✅ 로그인
      const u = await loginWithEmail(cleanedEmail, pw);
      if (u?.email) saveLastEmail?.(u.email);

      // ✅ 이메일/비번 유저는 인증 안했으면 verify로
      const providerId = u?.providerData?.[0]?.providerId || "";
      const isPasswordUser = providerId === "password";
      if (isPasswordUser && !u.emailVerified) {
        router.replace(`/verify-email?next=${encodeURIComponent(nextPath)}`);
        return;
      }

      router.replace(nextPath);
    } catch (err: any) {
      console.error("[LOGIN] email error", err);
      const code = err?.code;

      // ✅✅✅ 여기만 “안내 문구 강화” (로직은 그대로)
      if (code === "auth/email-already-in-use") {
        alert(
          tt(
            "loginEmailInUse",
            "This email is already registered.\n\n" +
              "• If you signed up with Google, please use “Continue with Google”.\n" +
              "• Otherwise, please sign in with your email and password."
          )
        );
        return;
      }

      if (code === "auth/invalid-email") {
        alert(tt("loginInvalidEmail", "Please enter a valid email address."));
        return;
      }
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        alert(tt("loginWrongPassword", "Incorrect email or password."));
        return;
      }
      if (code === "auth/user-not-found") {
        alert(tt("loginNoUser", "No account found with this email."));
        return;
      }

      alert(err?.message || tt("loginFailed", "Action failed."));
    } finally {
      setLoading(false);
    }
  };

  // ✅ auth 상태 확인 중엔 비워두기 (깜빡임 최소화)
  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "var(--text-tertiary)" }}>Loading...</span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 64px)",
        backgroundColor: "#F3F4F6",
        padding: "1rem",
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: "400px",
          width: "100%",
          textAlign: "center",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <button
          type="button"
          onClick={() => router.push("/")}
          aria-label="Go to home"
          style={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            marginBottom: "0.5rem",
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: "pointer",
            display: "inline-block",
            color: "inherit",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          MEMOTILES
        </button>

        <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
          {isRegistering ? tt("createAccount", "Create your account") : tt("welcomeBack", "Welcome back")}
        </p>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="btn btn-secondary"
          style={{
            width: "100%",
            marginBottom: "1.25rem",
            justifyContent: "center",
            gap: "0.75rem",
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={GOOGLE_LOGO_SRC}
            alt="Google"
            style={{ width: "18px", height: "18px" }}
            onError={(ev) => {
              (ev.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          {loading ? tt("loginSigningIn", "Signing in...") : tt("continueGoogle", "Continue with Google")}
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            margin: "1.25rem 0",
            color: "var(--text-tertiary)",
            fontSize: "0.875rem",
          }}
        >
          <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
          <span style={{ padding: "0 0.5rem" }}>{tt("or", "or")}</span>
          <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
        </div>

        <form onSubmit={handleEmailSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {isRegistering && (
            <input
              type="text"
              placeholder={tt("fullName", "Full name")}
              className="input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          )}

          <input
            type="email"
            placeholder={tt("emailPlaceholder", "Email address")}
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <input
            type="password"
            placeholder={tt("passwordPlaceholder", "Password")}
            className="input"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            required
            autoComplete={isRegistering ? "new-password" : "current-password"}
          />

          {isRegistering && (
            <input
              type="password"
              placeholder={tt("confirmPasswordPlaceholder", "Confirm password")}
              className="input"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              required
              autoComplete="new-password"
            />
          )}

          {/* ✅ 복구 링크 */}
          {!isRegistering && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -6, fontSize: 13 }}>
              <button
                type="button"
                className="btn btn-text"
                style={{ padding: 0, height: "auto" }}
                onClick={() =>
                  router.push(`/account-recovery?email=${encodeURIComponent(email)}&next=${encodeURIComponent(nextPath)}`)
                }
                disabled={loading}
              >
                {tt("recoveryLink", "Find my email / password")}
              </button>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
            {isRegistering ? tt("createAccountBtn", "Create account") : tt("signIn", "Sign in")}
          </button>
        </form>

        <div style={{ marginTop: "1.5rem", fontSize: "0.875rem" }}>
          {(isRegistering ? tt("alreadyHaveAccount", "Already have an account?") : tt("newHere", "New here?")) + " "}
          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            style={{ color: "var(--accent)", fontWeight: "600" }}
            disabled={loading}
          >
            {isRegistering ? tt("signIn", "Sign in") : tt("createAccount", "Create your account")}
          </button>
        </div>

        <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "2rem" }}>
          {tt("termsPrivacy", "By continuing, you agree to Terms & Privacy.")}
          <br />
          {tt("loginRedirect", "(After login you return to /editor automatically.)")}
        </p>
      </div>
    </div>
  );
}
