"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

/**
 * MarketingLayout - Standard wrapper for Landing, About, Terms, etc.
 * Centered content with maximum width and consistent vertical spacing.
 */
export default function MarketingLayout({ children }) {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div
      className="marketing-layout"
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <Navbar variant="marketing" />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
    </div>
  );
}
