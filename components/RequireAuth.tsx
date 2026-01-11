"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const { user, authReady } = useApp() as any;

  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/editor")}`);
    }
  }, [authReady, user, router, pathname]);

  if (!authReady) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "var(--text-tertiary)" }}>Loading...</span>
      </div>
    );
  }

  // 로그인 안 됐으면 리다이렉트 중이므로 화면 비움
  if (!user) return null;

  return <>{children}</>;
}
