"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function MarketingLayout({ children }) {
  const pathname = usePathname();

  useEffect(() => {
    // 클라이언트에서만
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="marketing-layout" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar variant="marketing" />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
    </div>
  );
}
