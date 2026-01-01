"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useApp } from "../context/AppContext";
import { ChevronDown } from "lucide-react";

export default function Navbar({ variant = "marketing" }) {
  const { isLoggedIn, logout, language, setLanguage, t } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [langOpen, setLangOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const isApp = variant === "app";

  return (
    <nav
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        height: "64px",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          maxWidth: isApp ? "1400px" : "1100px",
        }}
      >
        {/* LEFT */}
        <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          <Link
            href="/"
            style={{
              fontSize: "1.25rem",
              fontWeight: "700",
              color: "var(--primary)",
              letterSpacing: "-0.025em",
              textDecoration: "none",
            }}
          >
            MEMOTILES
          </Link>

          {!isApp && (
            <div className="hide-mobile" style={{ display: "flex", gap: "1.5rem" }}>
              <Link href="/about" className="btn-text" style={{ fontSize: "0.875rem", fontWeight: "600" }}>
                {t("about")}
              </Link>
              <Link href="/support" className="btn-text" style={{ fontSize: "0.875rem", fontWeight: "600" }}>
                {t("support")}
              </Link>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          {/* Language */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setLangOpen(!langOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                fontSize: "0.875rem",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <span>{language === "EN" ? "🇺🇸 EN" : "🇹🇭 TH"}</span>
              <ChevronDown size={14} />
            </button>

            {langOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: "0.5rem",
                  backgroundColor: "white",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-md)",
                  minWidth: "100px",
                  zIndex: 1100,
                }}
              >
                {["EN", "TH"].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setLanguage(lang);
                      setLangOpen(false);
                    }}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "0.5rem 1rem",
                      fontSize: "0.875rem",
                      textAlign: "left",
                      background: language === lang ? "#f3f4f6" : "white",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {lang === "EN" ? "🇺🇸 EN" : "🇹🇭 TH"}
                  </button>
                ))}
              </div>
            )}
          </div>

          {isLoggedIn ? (
            <>
              <Link href="/my-orders" className="btn-text" style={{ fontSize: "0.875rem", fontWeight: "600" }}>
                {t("myOrders")}
              </Link>
              <button
                onClick={handleLogout}
                className="btn-text"
                style={{ fontSize: "0.875rem", fontWeight: "600", cursor: "pointer" }}
              >
                {t("signOut")}
              </button>
            </>
          ) : (
            pathname !== "/login" && (
              <Link href="/login" className="btn btn-primary" style={{ padding: "0.5rem 1.25rem", fontSize: "0.875rem" }}>
                {t("signIn")}
              </Link>
            )
          )}
        </div>
      </div>
    </nav>
  );
}
