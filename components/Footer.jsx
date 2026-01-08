"use client";

import React from "react";
import Link from "next/link";
import { useApp } from "../context/AppContext";

export default function Footer() {
  const { t } = useApp();

  return (
    <footer
      style={{
        backgroundColor: "#f3f4f6",
        padding: "4rem 1rem",
        borderTop: "1px solid var(--border)",
        marginTop: "auto",
      }}
    >
      <div className="container" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2rem" }}>
        <div style={{ fontWeight: "bold", fontSize: "1.25rem" }}>MEMOTILES</div>
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/about" className="btn-text">{t("aboutUs")}</Link>
          <Link href="/terms" className="btn-text">{t("terms")}</Link>
          <Link href="/privacy" className="btn-text">{t("privacy")}</Link>
          <Link href="/support" className="btn-text">{t("support")}</Link>
          <Link href="/contact" className="btn-text">{t("contactUs")}</Link>
        </div>
        <div style={{ color: "var(--text-tertiary)", fontSize: "0.875rem" }}>
          &copy; {new Date().getFullYear()} Memotiles. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
