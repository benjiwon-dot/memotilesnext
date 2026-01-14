"use client";

import React from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";

export default function Footer() {
  const { t } = useApp() as any;

  const tr = (key: string, fallback: string) => {
    const v = t?.(key);
    if (!v || v === key) return fallback;
    return v;
  };

  return (
    <footer
      style={{
        backgroundColor: "#f3f4f6",
        padding: "4rem 1rem",
        borderTop: "1px solid var(--border)",
        marginTop: "auto",
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "2rem",
        }}
      >
        <div style={{ fontWeight: "bold", fontSize: "1.25rem" }}>MEMOTILE</div>

        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/about" className="btn-text">
            {tr("aboutUs", "About us")}
          </Link>
          <Link href="/terms" className="btn-text">
            {tr("terms", "Terms")}
          </Link>
          <Link href="/privacy" className="btn-text">
            {tr("privacy", "Privacy")}
          </Link>
          <Link href="/support" className="btn-text">
            {tr("support", "Support")}
          </Link>
          <Link href="/contact" className="btn-text">
            {tr("contactUs", "Contact us")}
          </Link>
        </div>

        <div style={{ color: "var(--text-tertiary)", fontSize: "0.875rem" }}>
          &copy; {new Date().getFullYear()} Memotile. {tr("allRightsReserved", "All rights reserved.")}
        </div>
      </div>
    </footer>
  );
}
