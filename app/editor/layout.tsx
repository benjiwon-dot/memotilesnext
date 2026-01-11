"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  const { user, authLoading } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (authLoading) return;

    // 로그인 안 했으면 로그인으로
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/editor")}`);
      return;
    }

    // ✅ 이메일/비번 가입자는 emailVerified=false면 차단
    const isPasswordUser = user.providerData?.some((p) => p.providerId === "password");
    if (isPasswordUser && !user.emailVerified) {
      router.replace(`/verify-email?next=${encodeURIComponent(pathname || "/editor")}`);
      return;
    }
  }, [authLoading, user, router, pathname]);

  // 로딩/가드 체크 중
  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <div style={{ color: "#6b7280" }}>Loading...</div>
      </div>
    );
  }

  // 로그인 안 됐거나 verify로 보냈으면 잠깐 빈 화면
  if (!user) return null;

  const isPasswordUser = user.providerData?.some((p) => p.providerId === "password");
  if (isPasswordUser && !user.emailVerified) return null;

  return <>{children}</>;
}
