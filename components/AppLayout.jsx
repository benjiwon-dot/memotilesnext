"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function AppLayout({ children, showFooter = true }) {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return (
    <div
      className="app-layout"
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: "#F9FAFB",
      }}
    >
      <Navbar variant="app" />
      <main style={{ flex: 1, paddingTop: "1rem" }}>{children}</main>
      {showFooter && <Footer minimal />}
    </div>
  );
}
