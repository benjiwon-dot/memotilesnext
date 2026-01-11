"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";

export default function AuthGate({
  children,
  requireVerified = false,
}: {
  children: React.ReactNode;
  requireVerified?: boolean;
}) {
  const { user, authLoading } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  useEffect(() => {
    if (authLoading) return;

    // 로그인 안됨 → login으로
    if (!user) {
      const next = encodeURIComponent(pathname + (sp?.toString() ? `?${sp.toString()}` : ""));
      router.replace(`/login?next=${next}`);
      return;
    }

    // 이메일 인증 필요 옵션일 때 → verify=1로 login 이동
    if (requireVerified && !user.emailVerified) {
      const next = encodeURIComponent(pathname);
      router.replace(`/login?verify=1&next=${next}`);
      return;
    }
  }, [authLoading, user, requireVerified, router, pathname, sp]);

  if (authLoading) return null; // 로딩 UI 원하면 여기서 스켈레톤 넣어도 됨
  if (!user) return null;
  if (requireVerified && !user.emailVerified) return null;

  return <>{children}</>;
}
