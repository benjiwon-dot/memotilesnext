"use client";

import React from "react";
import Link from "next/link";

export default function Footer() {
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
        <div style={{ fontWeight: "bold", fontSize: "1.25rem" }}>
          MEMOTILES
        </div>

        <div
          style={{
            display: "flex",
            gap: "2rem",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <Link href="/about" className="btn-text">About us</Link>
          <Link href="/terms" className="btn-text">Terms</Link>
          <Link href="/privacy" className="btn-text">Privacy</Link>
          <Link href="/support" className="btn-text">Support</Link>
          <Link href="/contact" className="btn-text">Contact us</Link>
        </div>

        <div
          style={{
            color: "var(--text-tertiary)",
            fontSize: "0.875rem",
          }}
        >
          &copy; {new Date().getFullYear()} Memotiles. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
